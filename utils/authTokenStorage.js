import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const SESSION_SERVICE = 'liquid-spirit-session';

let inMemoryAccessToken = null;
let inMemoryRefreshToken = null;

const keychainOptions = {
  service: SESSION_SERVICE,
  ...(Keychain.ACCESSIBLE?.WHEN_UNLOCKED_THIS_DEVICE_ONLY
    ? { accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
    : {}),
};

const parseSessionPayload = value => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      accessToken: typeof parsed.accessToken === 'string' ? parsed.accessToken : null,
      refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : null,
    };
  } catch {
    return null;
  }
};

export const setAccessTokenMemory = token => {
  inMemoryAccessToken = token || null;
};

export const setRefreshTokenMemory = token => {
  inMemoryRefreshToken = token || null;
};

export const getAccessTokenMemory = () => inMemoryAccessToken;
export const getRefreshTokenMemory = () => inMemoryRefreshToken;

export const saveSessionTokens = async ({ accessToken = null, refreshToken = null }) => {
  inMemoryAccessToken = accessToken || null;
  inMemoryRefreshToken = refreshToken || null;

  const payload = JSON.stringify({
    accessToken: accessToken || null,
    refreshToken: refreshToken || null,
  });

  await Keychain.setGenericPassword('session', payload, keychainOptions);
  await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
};

export const loadSessionTokens = async () => {
  if (inMemoryAccessToken || inMemoryRefreshToken) {
    return {
      accessToken: inMemoryAccessToken,
      refreshToken: inMemoryRefreshToken,
    };
  }

  const creds = await Keychain.getGenericPassword({ service: SESSION_SERVICE });
  if (creds) {
    const parsed = parseSessionPayload(creds.password);
    if (parsed) {
      inMemoryAccessToken = parsed.accessToken;
      inMemoryRefreshToken = parsed.refreshToken;
      return parsed;
    }
  }

  const [legacyAccessToken, legacyRefreshToken] = await AsyncStorage.multiGet(['authToken', 'refreshToken']);
  const accessToken = legacyAccessToken?.[1] || null;
  const refreshToken = legacyRefreshToken?.[1] || null;

  if (accessToken || refreshToken) {
    await saveSessionTokens({ accessToken, refreshToken });
    return { accessToken, refreshToken };
  }

  return { accessToken: null, refreshToken: null };
};

export const getStoredAccessToken = async () => {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  const tokens = await loadSessionTokens();
  return tokens.accessToken || null;
};

export const getStoredRefreshToken = async () => {
  if (inMemoryRefreshToken) return inMemoryRefreshToken;
  const tokens = await loadSessionTokens();
  return tokens.refreshToken || null;
};

export const clearSessionTokens = async () => {
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;
  await Keychain.resetGenericPassword({ service: SESSION_SERVICE });
  await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
};
