import { API_URL } from '../config';
import { buildJsonHeaders, requestJson } from './http';
import debugLog from '../utils/debugLog';
import { getAuthTokenOrThrow } from './getAuthToken';

const getAuthToken = async () => {
  const token = await getAuthTokenOrThrow();
  if (!token) {
    throw new Error('User is not authenticated.');
  }
  return token;
};

export const fetchUser = async (userId) => {
  try {
    const token = await getAuthToken();
    const { data } = await requestJson(
      `${API_URL}/api/users/getUser/${userId}`,
      {
        method: 'GET',
        headers: buildJsonHeaders(token),
      },
      'Error fetching user',
    );
    return data;
  } catch (error) {
    throw new Error(`Fetch user error: ${error.message}`);
  }
};

export const discoverUsers = async () => {
  try {
    const token = await getAuthToken();
    const { response, data } = await requestJson(
      `${API_URL}/api/users/discover`,
      {
        method: 'GET',
        headers: buildJsonHeaders(token),
      },
      'Error fetching users',
    );

    debugLog('discoverUsers response meta', {
      status: response.status,
      ok: response.ok,
    });

    return data;
  } catch (error) {
    console.error(`Fetch user error: ${error.message}`);
    throw new Error(`Fetch user error: ${error.message}`);
  }
};

// Fetch list of community members (requires authentication token from AsyncStorage)
export const getMemberList = async (communityId) => {
  try {
    const token = await getAuthToken();
    const { data } = await requestJson(
      `${API_URL}/api/users/getAllMembers/${communityId}`,
      {
        method: 'GET',
        headers: buildJsonHeaders(token),
      },
      'Error fetching users',
    );

    return data; // This corresponds to `memberDetails` in your backend response
  } catch (error) {
    console.error(`Fetch user error: ${error.message}`);
    throw new Error(`Fetch user error: ${error.message}`);
  }
};


export const helloUsers = async () => {
  try {
    const token = await getAuthToken();
    const { data } = await requestJson(
      `${API_URL}/api/users/hello`,
      {
        method: 'GET',
        headers: buildJsonHeaders(token),
      },
      'Error fetching users',
    );
    debugLog('helloUsers data:', data);
    return data;
  } catch (error) {
    throw new Error(`Fetch user error: ${error.message}`);
  }
};
/**
 * Fetch a single user's public profile by ID (React Native version)
 * @param {string} userId
 * @param {string} token  Bearer token
 */
const userByIdCache = new Map();
const memberByIdCache = new Map();

export const fetchUserById = async (userId, token) => {
  try {
    const key = userId ? String(userId) : '';
    if (key && userByIdCache.has(key)) {
      return userByIdCache.get(key);
    }

    const { data } = await requestJson(
      `${API_URL}/api/users/getUser/${userId}`,
      {
        method: 'GET',
        headers: buildJsonHeaders(token),
      },
      'Failed to fetch user',
    );

    // API may return wrapper { data: user } or { user: {...} }
    if (key) {
      userByIdCache.set(key, data);
    }
    return data;
  } catch (error) {
    if (error.status) throw error;
    const e = new Error(`fetchUserById error: ${error.message}`);
    e.status = error.status;
    throw e;
  }
};

export const fetchEntitiesBatch = async ({ users = [], members = [], guests = [] } = {}, token) => {
  try {
    const { data } = await requestJson(
      `${API_URL}/api/entities/batch`,
      {
        method: 'POST',
        headers: buildJsonHeaders(token),
        body: JSON.stringify({ users, members, guests }),
      },
      'Failed to batch fetch entities',
    );

    return data;
  } catch (error) {
    if (error.status) throw error;
    const e = new Error(`fetchEntitiesBatch error: ${error.message}`);
    e.status = error.status;
    throw e;
  }
};

export const fetchMemberById = async (memberId, token) => {
  try {
    const key = memberId ? String(memberId) : '';
    if (key && memberByIdCache.has(key)) {
      return memberByIdCache.get(key);
    }

    const { data } = await requestJson(
      `${API_URL}/api/members/${memberId}`,
      {
        method: 'GET',
        headers: buildJsonHeaders(token),
      },
      'Failed to fetch member',
    );

    if (key) {
      memberByIdCache.set(key, data);
    }

    return data;
  } catch (error) {
    if (error.status) throw error;
    const e = new Error(`fetchMemberById error: ${error.message}`);
    e.status = error.status;
    throw e;
  }
};

export const blockUser = async (userId, token) => {
  try {
    const response = await fetch(`${API_URL}/api/users/${userId}/blockUser`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const jsonResponse = await response.json();

    if (!response.ok) {
      throw new Error(jsonResponse.message || 'Failed to block user.');
    }

    return jsonResponse.data;
  } catch (error) {
    console.error('Error blocking user:', error);
    throw new Error(`Block user error: ${error.message}`);
  }
};

export const muteUser = async (userId, token) => {
  try {
    const response = await fetch(`${API_URL}/api/users/${userId}/muteUser`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const jsonResponse = await response.json();

    if (!response.ok) {
      throw new Error(jsonResponse.message || 'Failed to mute user.');
    }

    return jsonResponse.data;
  } catch (error) {
    console.error('Error muting user:', error);
    throw new Error(`Mute user error: ${error.message}`);
  }
};
