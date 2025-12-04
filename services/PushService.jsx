import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { API_URL } from '../config';
import { navigateWhenReady } from '../navigation/RootNavigation';
import NotificationService from './NotificationService.jsx';

const log = (...args) => console.log('[PushService]', ...args);

const emitter = Platform.OS === 'ios' && NativeModules.APNs
  ? new NativeEventEmitter(NativeModules.APNs)
  : null;

let currentApnsToken = null;
let didHealthConfigCheck = false;
let didConnectivityProbe = false;
let listenersInitialized = false;

export async function registerDevice(authToken, apnsToken) {
  if (!authToken || !apnsToken) return { ok: false };

  const base = String(API_URL || '').replace(/\/$/, '');
  const dashed = `${base}/api/push/register-device`;
  const camel = `${base}/api/push/registerDevice`;

  const payload = { platform: 'ios', token: apnsToken };
  const headers = {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  try {
    let res = await fetch(dashed, { method: 'POST', headers, body: JSON.stringify(payload) });
    if (res.status === 404) {
      res = await fetch(camel, { method: 'POST', headers, body: JSON.stringify(payload) });
    }
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch (e) {
    console.warn('[PushService] registerDevice network error', e);
    return { ok: false, data: null, error: String(e) };
  }
}

export function initPushNotifications(authToken) {
  if (Platform.OS !== 'ios' || !NativeModules.APNs) return;
  if (listenersInitialized && emitter) {
    log('initPushNotifications: already initialized, skipping duplicate setup');
    return () => {};
  }

  const apns = NativeModules.APNs;
  const hasRegister = typeof apns.register === 'function';
  const hasGetToken = typeof apns.getToken === 'function';
  const hasGetInitial = typeof apns.getInitialNotification === 'function';

  if (!hasRegister || !hasGetToken || !hasGetInitial) {
    // Avoid crashing when native methods are unavailable (e.g., not exported/linked)
    console.warn('APNs native module is present but missing methods:', {
      register: hasRegister,
      getToken: hasGetToken,
      getInitialNotification: hasGetInitial,
    });
    return;
  }

  log('initPushNotifications: setting up listeners');

  // Health: one-time configuration check (no connectivity) on init
  if (authToken && !didHealthConfigCheck) {
    didHealthConfigCheck = true;
    getApnsHealth(authToken, { connectivity: false }).then(result => {
      if (!result) return;
      const { ok, data } = result;
      log('APNs health (config)', { ok, data });
    }).catch(e => console.warn('[PushService] getApnsHealth (config) error', e));
  }

  const onToken = async (event) => {
    currentApnsToken = event?.token || null;
    log('apnsToken event received', {
      hasToken: !!currentApnsToken,
      tokenLength: currentApnsToken ? currentApnsToken.length : 0,
    });
    if (authToken && currentApnsToken) {
      try {
        await registerDevice(authToken, currentApnsToken);
      } catch (e) {
        console.warn('[PushService] registerDevice failed', e);
      }

      // Health: one-time connectivity probe after we have a device token
      if (!didConnectivityProbe) {
        didConnectivityProbe = true;
        getApnsHealth(authToken, { connectivity: true }).then(result => {
          if (!result) return;
          const { ok, data } = result;
          log('APNs health (connectivity)', { ok, data });
        }).catch(e => console.warn('[PushService] getApnsHealth (connectivity) error', e));
      }
    }
  };

  const sub = emitter.addListener('apnsToken', onToken);

  const onOpened = async (payload) => {
    try {
      log('notificationOpened event received', { payload });
      // Mark as read if provided
      if (payload?.notificationId && authToken) {
        try {
          await NotificationService.markNotificationAsRead(authToken, payload.notificationId);
        } catch (e) {
          console.warn('[PushService] markNotificationAsRead failed', e);
        }
      }

      const p = normalizePayload(payload);
      log('normalized opened payload', { normalized: p });
      if (!p) return;
      switch (p.type) {
        case 'event':
          navigateWhenReady('Main', {
            screen: 'Home',
            params: { screen: 'EventDetailCard', params: { eventId: p.id } },
          });
          break;
        case 'activity':
          navigateWhenReady('Main', {
            screen: 'Home',
            params: { screen: 'ActivityDetailCard', params: { activityId: p.id } },
          });
          break;
        case 'post':
          navigateWhenReady('Main', {
            screen: 'Feed',
            params: { screen: 'PostDetailCard', params: { postId: p.id } },
          });
          break;
        default:
          // no-op
          break;
      }
    } catch {}
  };

  const subOpen = emitter.addListener('notificationOpened', onOpened);

  // Foreground notifications
  const onForeground = payload => {
    log('notification (foreground) event received', { payload });
  };
  const subNotification = emitter.addListener('notification', onForeground);

  // Request permission and registration; then attempt to get the token if already available
  listenersInitialized = true;
  apns.register();
  log('called apns.register()');
  apns.getToken().then(token => {
    log('apns.getToken() resolved', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
    });
    if (token) onToken({ token });
  });
  apns.getInitialNotification().then(payload => {
    log('apns.getInitialNotification() resolved', { hasPayload: !!payload });
    if (payload) onOpened(payload);
  });

  return () => {
    log('cleanup: removing APNs listeners');
    sub.remove();
    subOpen.remove();
    subNotification.remove();
    listenersInitialized = false;
  };
}

export function getCurrentApnsToken() {
  return currentApnsToken;
}

// Send a backend-triggered test push to this device
export async function sendTestPush(authToken, apnsToken, { title = 'Test', body = 'Hello from backend', payload = { debug: true } } = {}) {
  const base = String(API_URL || '').replace(/\/$/, '');
  const url = `${base}/api/push/send`;
  if (!authToken) {
    console.warn('[PushService] sendTestPush: missing auth token');
    return { ok: false, data: null };
  }
  if (!apnsToken || apnsToken.length < 64) {
    console.warn('[PushService] sendTestPush: invalid APNs token');
    return { ok: false, data: null };
  }

  const bodyJson = {
    token: apnsToken,
    alert: { title, body },
    payload,
  };

  log('sendTestPush: requesting', { url, body: bodyJson });
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyJson),
    });
    const data = await res.json().catch(() => ({}));
    log('sendTestPush: response', { ok: res.ok, status: res.status, data });
    return { ok: res.ok, data };
  } catch (e) {
    console.warn('[PushService] sendTestPush network error', e);
    return { ok: false, data: null, error: String(e) };
  }
}

// APNs health check helper
export async function getApnsHealth(authToken, { connectivity = false } = {}) {
  const base = String(API_URL || '').replace(/\/$/, '');
  const url = `${base}/api/push/health${connectivity ? '?connectivity=true' : ''}`;
  if (!authToken) {
    console.warn('[PushService] getApnsHealth: missing auth token');
    return { ok: false, data: null };
  }

  log('getApnsHealth: requesting', { url });
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json().catch(() => ({}));
    log('getApnsHealth: response', { ok: res.ok, status: res.status, data });
    return { ok: res.ok, data };
  } catch (e) {
    console.warn('[PushService] getApnsHealth network error', e);
    return { ok: false, data: null, error: String(e) };
  }
}

export function normalizePayload(userInfo) {
  if (!userInfo || typeof userInfo !== 'object') return null;
  const data = userInfo.data || userInfo.custom || userInfo;
  const typeName = (data.type || data.typeName || data.targetType || '').toString();
  const typeKey = typeName.replace(/[^a-zA-Z]/g, '').toLowerCase();
  const targetId =
    data.targetId ||
    data.id ||
    data.eventId ||
    data.postId ||
    data.activityId ||
    data.activity_id;

  // Map backend type names to categories used by navigation
  const typeCategoryMap = {
    post_media: 'post',
    post_created: 'post',
    post: 'post',
    new_activity: 'activity',
    join_activity: 'activity',
    activity_updated: 'activity',
    activity: 'activity',
    // Session-related notifications should open Activity detail
    session: 'activity',
    session_created: 'activity',
    session_updated: 'activity',
    session_reminder: 'activity',
    session_cancelled: 'activity',
    session_canceled: 'activity',
    join_event: 'event',
    event_reminder: 'event',
    event: 'event',
  };

  let category = typeCategoryMap[typeName.toLowerCase()];
  if (!category) {
    // Heuristic fallbacks by type keywords
    if (typeKey.includes('session')) {
      category = 'activity';
    } else if (typeKey.includes('event')) {
      category = 'event';
    } else if (typeKey.includes('post')) {
      category = 'post';
    } else {
      // ID-based fallbacks
      if (data.eventId) {
        category = 'event';
      } else if (data.activityId || data.activity_id) {
        category = 'activity';
      } else if (data.postId) {
        category = 'post';
      }
    }
  }

  if (!category) return null;

  // Prefer the correct parent ID when dealing with session payloads
  // Many session notifications include the parent activity id alongside the session id
  let resolvedId = targetId;
  const isSessionType = /^session(_|$)/i.test(typeName);
  if (category === 'activity' && isSessionType) {
    // Common fields provided by backend for session notifications
    resolvedId =
      data.activityId ||
      data.activity_id ||
      (data.activity && (data.activity._id || data.activity.id)) ||
      data.parentActivityId ||
      data.parentId ||
      targetId;
  }

  if (!resolvedId) return null;
  return { type: category, id: resolvedId };
}
