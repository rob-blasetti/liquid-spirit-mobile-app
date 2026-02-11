import AsyncStorage from '@react-native-async-storage/async-storage';

// Stable URL: you can update the JSON at this URL without shipping a new app version.
// Recommended: host as a public object on S3/CloudFront.
export const REMOTE_CONFIG_URL =
  'https://liquid-spirit.s3.us-east-1.amazonaws.com/app-config/mobile.json';

const STORAGE_KEY = 'remoteConfig:v1';
const STORAGE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

export const DEFAULT_HOME_LINKS = [
  {
    id: 'ridvan-182',
    type: 'url',
    title: 'Ridvan Message 182 BE',
    icon: 'mail-open-outline',
    url: 'https://universalhouseofjustice.bahai.org/ridvan-messages/20250420_001',
  },
  {
    id: 'activities',
    type: 'route',
    title: 'View All Activities',
    icon: 'list-outline',
    routeName: 'Activities',
    params: {},
  },
  {
    id: 'events',
    type: 'route',
    title: 'View All Events',
    icon: 'calendar-outline',
    routeName: 'Events',
    params: {},
  },
];

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch (_) {
    return null;
  }
};

export const loadRemoteConfig = async ({ timeoutMs = 2500 } = {}) => {
  const now = Date.now();

  // 1) Return cached config if fresh
  try {
    const cachedRaw = await AsyncStorage.getItem(STORAGE_KEY);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);
      if (cached?.fetchedAt && now - cached.fetchedAt < STORAGE_TTL_MS && cached?.config) {
        return cached.config;
      }
    }
  } catch (_) {
    // ignore
  }

  // 2) Fetch remote
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(REMOTE_CONFIG_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`remote config fetch failed: ${res.status}`);
    }

    const data = await safeJson(res);
    if (!data || typeof data !== 'object') {
      throw new Error('remote config invalid JSON');
    }

    const config = {
      homeLinks: Array.isArray(data.homeLinks) ? data.homeLinks : undefined,
    };

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ fetchedAt: now, config }),
    );

    return config;
  } catch (err) {
    // 3) Fallback to any cached config, even if stale
    try {
      const cachedRaw = await AsyncStorage.getItem(STORAGE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached?.config) return cached.config;
      }
    } catch (_) {
      // ignore
    }

    return null;
  }
};
