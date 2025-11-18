import { API_URL } from '../config';

const baseUrl = String(API_URL || '').replace(/\/$/, '');

const ENDPOINT_DASHED = (userId) => `${baseUrl}/api/users/${userId}/push-preferences`;
const ENDPOINT_CAMEL = (userId) => `${baseUrl}/api/users/${userId}/pushPreferences`;

// The full set of preference keys supported by backend
export const PUSH_PREF_KEYS = [
  'post_created',
  'post_media',
  'new_activity',
  'join_activity',
  'activity_updated',
  'activity_deleted',
  'activity_completed',
  'join_event',
  'event_reminder',
  'signup',
  'session_created',
  'session_reminder',
  'session_cancelled',
  'chat_direct_message',
  'chat_group_message',
];

// Normalize preferences, defaulting missing keys to true per spec
export function normalizePreferences(prefs) {
  const raw = prefs && typeof prefs === 'object' ? prefs : {};
  const out = {};
  for (const key of PUSH_PREF_KEYS) {
    out[key] = raw[key] !== false; // treat undefined as enabled (true)
  }
  return out;
}

export async function getPushPreferences(authToken, userId) {
  if (!authToken || !userId) throw new Error('Missing auth token or userId');
  const headers = { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' };

  // Try dashed first, then camel as fallback
  let res;
  try {
    res = await fetch(ENDPOINT_DASHED(userId), { method: 'GET', headers });
    if (res.status === 404) {
      res = await fetch(ENDPOINT_CAMEL(userId), { method: 'GET', headers });
    }
  } catch (e) {
    throw new Error(`Network error: ${String(e)}`);
  }

  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const msg = data?.message || 'Failed to fetch push preferences';
    throw new Error(msg);
  }
  // Backend may return wrapper or plain object; support both
  const prefs = data?.data || data?.preferences || data;
  return normalizePreferences(prefs);
}

// patch: object with any subset of keys -> boolean
export async function updatePushPreferences(authToken, userId, patch) {
  if (!authToken || !userId) throw new Error('Missing auth token or userId');
  if (!patch || typeof patch !== 'object') throw new Error('Invalid patch');
  const headers = { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' };
  const body = JSON.stringify(patch);

  // Try dashed first, then camel as fallback on 404
  let res;
  try {
    res = await fetch(ENDPOINT_DASHED(userId), { method: 'PUT', headers, body });
    if (res.status === 404) {
      res = await fetch(ENDPOINT_CAMEL(userId), { method: 'PUT', headers, body });
    }
  } catch (e) {
    throw new Error(`Network error: ${String(e)}`);
  }

  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const msg = data?.message || 'Failed to update push preferences';
    throw new Error(msg);
  }
  const prefs = data?.data || data?.preferences || data;
  return normalizePreferences(prefs);
}

export default {
  getPushPreferences,
  updatePushPreferences,
  normalizePreferences,
  PUSH_PREF_KEYS,
};
