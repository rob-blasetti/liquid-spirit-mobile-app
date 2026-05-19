import { notifyAuthExpired } from '../utils/authSessionEvents';

export const buildJsonHeaders = token => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const parseJsonSafe = async response => {
  try {
    return await response.json();
  } catch (_) {
    return null;
  }
};

export const getErrorMessage = (data, fallback) =>
  data?.message || data?.error?.message || data?.error || fallback;

const isAuthExpiredError = error => {
  if (!error) return false;
  const message = `${error.message || ''}`.toLowerCase();
  return error.status === 401 || message.includes('token has expired');
};

export async function requestJson(url, options = {}, fallbackMessage = 'Request failed') {
  const response = await fetch(url, options);
  const data = await parseJsonSafe(response);

  if (!response.ok) {
    const error = new Error(getErrorMessage(data, fallbackMessage));
    error.status = response.status;
    error.data = data;
    if (isAuthExpiredError(error)) {
      notifyAuthExpired(error);
    }
    throw error;
  }

  return { response, data };
}
