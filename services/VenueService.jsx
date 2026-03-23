import { API_URL } from '../config';
import { buildJsonHeaders, requestJson } from './http';

const makeRequest = async (url, method, token, body = null, config = {}) => {
  try {
    const requestUrl = config.params
      ? `${API_URL}${url}?${new URLSearchParams(config.params).toString()}`
      : `${API_URL}${url}`;

    const { data } = await requestJson(
      requestUrl,
      {
        method,
        headers: {
          ...buildJsonHeaders(token),
          ...(config.headers || {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: config.signal,
      },
      `Error ${method} ${url}`,
    );

    return data;
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
