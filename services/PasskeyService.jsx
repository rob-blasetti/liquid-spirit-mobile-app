import { API_URL, AUTH_API_URL } from '../config';

const AUTH_BASE = String(AUTH_API_URL || API_URL || '').replace(/\/$/, '');

const readJsonBody = async response => {
  const rawBody = await response.text();
  if (!rawBody) return null;

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
};

export const fetchPasskeyCredentialsWithToken = async token => {
  const response = await fetch(`${AUTH_BASE}/api/auth/passkey/credentials`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await readJsonBody(response);

  return { ok: response.ok, status: response.status, data };
};
