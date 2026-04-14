import { API_URL } from '../config';
import { buildJsonHeaders, requestJson } from './http';
import { getAuthTokenOrThrow } from './getAuthToken';

const AUTH_ERROR_MESSAGE = 'User is not authenticated.';

const getAuthToken = async () => {
  const token = await getAuthTokenOrThrow();
  if (!token) {
    throw new Error(AUTH_ERROR_MESSAGE);
  }
  return token;
};

const withAuthFallback = async (work, { onAuthMessage, onErrorMessage, fallbackValue = null }) => {
  try {
    return await work();
  } catch (error) {
    if (error.message === AUTH_ERROR_MESSAGE) {
      console.warn(onAuthMessage);
      return fallbackValue;
    }
    console.error(onErrorMessage, error);
    return fallbackValue;
  }
};

const fetchBodyMembers = async (path, token, errorLabel) => {
  if (!token) {
    console.warn('No token found, returning empty array.');
    return [];
  }

  try {
    const { data } = await requestJson(
      `${API_URL}${path}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      errorLabel,
    );
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(errorLabel, error);
    return [];
  }
};

const authedJsonRequest = async (path, method, fallbackMessage, body = null) => {
  const token = await getAuthToken();
  const { data } = await requestJson(
    `${API_URL}${path}`,
    {
      method,
      headers: buildJsonHeaders(token),
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
    fallbackMessage,
  );
  return data;
};

const authedGetRequest = async (path, fallbackMessage) => {
  const token = await getAuthToken();
  const { data } = await requestJson(
    `${API_URL}${path}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    fallbackMessage,
  );
  return data;
};

export const fetchLocalSpiritualAssembly = async (token) =>
  fetchBodyMembers('/api/bodies/local-spiritual-assembly', token, 'Error fetching Local Spiritual Assembly:');

export const fetchFeastCommittee = async (token) =>
  fetchBodyMembers('/api/bodies/feast-committee', token, 'Error fetching Feast Committee:');

export const fetchHolyDaysCommittee = async (token) =>
  fetchBodyMembers('/api/bodies/holy-days-committee', token, 'Error fetching Holy Days Committee:');

export const createUserBody = async (userBodyData) =>
  withAuthFallback(
    () => authedJsonRequest('/api/bodies', 'POST', 'Failed to create User-Body relationship', userBodyData),
    {
      onAuthMessage: 'createUserBody aborted: user not authenticated.',
      onErrorMessage: 'Error creating User-Body:',
      fallbackValue: null,
    },
  );

export const updateUserBody = async (userBodyData) =>
  withAuthFallback(
    () => authedJsonRequest('/api/bodies', 'PUT', 'Failed to update User-Body relationship', userBodyData),
    {
      onAuthMessage: 'updateUserBody aborted: user not authenticated.',
      onErrorMessage: 'Error updating User-Body:',
      fallbackValue: null,
    },
  );

export const deleteUserBody = async (userId, bodyId) =>
  withAuthFallback(
    () => authedJsonRequest(`/api/bodies/${userId}/${bodyId}`, 'DELETE', 'Failed to delete User-Body relationship'),
    {
      onAuthMessage: 'deleteUserBody aborted: user not authenticated.',
      onErrorMessage: 'Error deleting User-Body:',
      fallbackValue: null,
    },
  );

export const fetchIsMemberOfFeastCommittee = async (userId, communityId) =>
  withAuthFallback(
    () => authedGetRequest(`/api/bodies/feast-committee/${communityId}/${userId}/is-member`, 'Failed to fetch is member of Feast Committee'),
    {
      onAuthMessage: 'fetchIsMemberOfFeastCommittee aborted: user not authenticated.',
      onErrorMessage: 'Error fetching is member of Feast Committee:',
      fallbackValue: null,
    },
  );

export const fetchIsMemberOfHolyDaysCommittee = async (userId, communityId) =>
  withAuthFallback(
    () => authedGetRequest(`/api/bodies/holy-days-committee/${communityId}/${userId}/is-member`, 'Failed to fetch is member of Holy Days Committee'),
    {
      onAuthMessage: 'fetchIsMemberOfHolyDaysCommittee aborted: user not authenticated.',
      onErrorMessage: 'Error fetching is member of Holy Days Committee:',
      fallbackValue: null,
    },
  );

export const fetchIsMemberOfLocalSpiritualAssembly = async (userId, communityId) =>
  withAuthFallback(
    () => authedGetRequest(`/api/bodies/local-spiritual-assembly/${communityId}/${userId}/is-member`, 'Failed to fetch is member of Local Spiritual Assembly'),
    {
      onAuthMessage: 'fetchIsMemberOfLocalSpiritualAssembly aborted: user not authenticated.',
      onErrorMessage: 'Error fetching is member of Local Spiritual Assembly:',
      fallbackValue: null,
    },
  );

export const fetchUserBodyByEventType = async (eventType, token) => {
  try {
    switch (String(eventType || '').trim()) {
      case 'Feast':
        return await fetchFeastCommittee(token);
      case 'Holy Day':
        return await fetchHolyDaysCommittee(token);
      case 'Admin':
      case 'Community':
      default:
        return await fetchLocalSpiritualAssembly(token);
    }
  } catch (error) {
    console.error('Error fetching user body for event type:', eventType, error);
    return [];
  }
};
