import { API_URL } from '../config';

const makeRequest = async (url, method, token, body = null, config = {}) => {
  try {
    let requestUrl = url;
    if (config.params) {
      const queryString = new URLSearchParams(config.params).toString();
      requestUrl += `?${queryString}`;
    }

    const response = await fetch(`${API_URL}${requestUrl}`, {
      method,
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        ...(config.headers || {}),
      },
      body: body ? JSON.stringify(body) : null,
      signal: config.signal,
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = json?.message || `Error ${method} ${requestUrl}`;
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }

    return json;
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.error(`Error in ${method} request to ${url}:`, error);
    }
    throw error;
  }
};

export const fetchVenues = (communityId, token, options = {}) =>
  makeRequest('/api/venues', 'GET', token, null, {
    params: communityId ? { community: communityId } : {},
    ...options,
  });

export const fetchEligibleVenuesForActivity = (activityId, token, options = {}) =>
  makeRequest(
    `/api/activities/${encodeURIComponent(activityId)}/eligible-venues`,
    'GET',
    token,
    null,
    options,
  );

export const findVenuesForIds = (
  facilitatorIds = [],
  participantIds = [],
  token,
  options = {},
) => {
  const { signal, userId, ...restOptions } = options || {};
  const payload = { facilitatorIds, participantIds };
  if (userId) {
    payload.userId = userId;
  }
  return makeRequest('/api/venues/find', 'POST', token, payload, {
    ...restOptions,
    signal,
  });
};

// Back-compat: older callers used /api/activities/:id/venues.
export const fetchAvailableVenuesForActivity = (activityId, token, options = {}) =>
  makeRequest(`/api/activities/${encodeURIComponent(activityId)}/venues`, 'GET', token, null, options);

export const fetchVenuesForActivity = fetchAvailableVenuesForActivity;
