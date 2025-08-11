import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { API_URL } from '../config';
import { navigate } from '../navigation/RootNavigation';
import NotificationService from './NotificationService.jsx';

const emitter = Platform.OS === 'ios' && NativeModules.APNs
  ? new NativeEventEmitter(NativeModules.APNs)
  : null;

let currentApnsToken = null;

export async function registerDevice(authToken, apnsToken) {
  if (!authToken || !apnsToken) return { ok: false };
  const res = await fetch(`${API_URL}/api/push/register-device`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ platform: 'ios', token: apnsToken }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function initPushNotifications(authToken) {
  if (Platform.OS !== 'ios' || !NativeModules.APNs) return;

  const onToken = async (event) => {
    currentApnsToken = event?.token || null;
    if (authToken && currentApnsToken) {
      try { await registerDevice(authToken, currentApnsToken); } catch {}
    }
  };

  const sub = emitter.addListener('apnsToken', onToken);

  const onOpened = async (payload) => {
    try {
      // Mark as read if provided
      if (payload?.notificationId && authToken) {
        try { await NotificationService.markNotificationAsRead(authToken, payload.notificationId); } catch {}
      }

      const p = normalizePayload(payload);
      if (!p) return;
      switch (p.type) {
        case 'event':
          navigate('EventDetailCard', { eventId: p.id });
          break;
        case 'activity':
          navigate('ActivityDetailCard', { activityId: p.id });
          break;
        case 'post':
          navigate('PostDetailCard', { postId: p.id });
          break;
        default:
          // no-op
          break;
      }
    } catch {}
  };

  const subOpen = emitter.addListener('notificationOpened', onOpened);

  // Request permission and registration; then attempt to get the token if already available
  NativeModules.APNs.register();
  NativeModules.APNs.getToken().then(token => {
    if (token) onToken({ token });
  });
  NativeModules.APNs.getInitialNotification().then(payload => {
    if (payload) onOpened(payload);
  });

  return () => {
    sub.remove();
    subOpen.remove();
  };
}

export function getCurrentApnsToken() {
  return currentApnsToken;
}

function normalizePayload(userInfo) {
  if (!userInfo || typeof userInfo !== 'object') return null;
  const data = userInfo.data || userInfo.custom || userInfo;
  const typeName = data.type || data.typeName || data.targetType || '';
  const targetId = data.targetId || data.id || data.eventId || data.postId || data.activityId;

  // Map backend type names to categories used by navigation
  const typeCategoryMap = {
    post_media: 'post',
    post_created: 'post',
    post: 'post',
    new_activity: 'activity',
    join_activity: 'activity',
    activity_updated: 'activity',
    activity: 'activity',
    join_event: 'event',
    event_reminder: 'event',
    event: 'event',
  };

  let category = typeCategoryMap[typeName];
  if (!category) {
    // Fallbacks
    if (data.eventId) category = 'event';
    else if (data.activityId) category = 'activity';
    else if (data.postId) category = 'post';
  }

  if (!category || !targetId) return null;
  return { type: category, id: targetId };
}
