import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const AUTH_ERROR_MESSAGE = 'User is not authenticated.';

const getAuthToken = async () => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    throw new Error(AUTH_ERROR_MESSAGE);
  }
  return token;
};

/**
 * Fetch Local Spiritual Assembly members.
 * @param {string} token - Bearer token for authorization.
 */
export const fetchLocalSpiritualAssembly = async (token) => {
    if (!token) {
        console.warn('No token found, returning empty array.');
        return [];
    }

    try {
        const response = await fetch(`${API_URL}/api/bodies/local-spiritual-assembly`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error(`Failed to fetch: ${response.status} - ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching Local Spiritual Assembly:', error);
        return [];
    }
};

/**
 * Fetch Feast Committee members.
 * @param {string} token - Bearer token for authorization.
 */
export const fetchFeastCommittee = async (token) => {
    if (!token) {
        console.warn('No token found, returning empty array.');
        return [];
    }

    try {
        const response = await fetch(`${API_URL}/api/bodies/feast-committee`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error(`Failed to fetch: ${response.status} - ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching Feast Committee:', error);
        return [];
    }
};

/**
 * Fetch Holy Days Committee members.
 * @param {string} token - Bearer token for authorization.
 */
export const fetchHolyDaysCommittee = async (token) => {
    if (!token) {
        console.warn('No token found, returning empty array.');
        return [];
    }

    try {
        const response = await fetch(`${API_URL}/api/bodies/holy-days-committee`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error(`Failed to fetch: ${response.status} - ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching Holy Days Committee:', error);
        return [];
    }
};

export const createUserBody = async (userBodyData) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/bodies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userBodyData),
    });
    if (!response.ok) {
      throw new Error('Failed to create User-Body relationship');
    }
    return await response.json();
  } catch (error) {
    if (error.message === AUTH_ERROR_MESSAGE) {
      console.warn('createUserBody aborted: user not authenticated.');
      return null;
    }
    console.error('Error creating User-Body:', error);
    return null;
  }
};

/**
 * Updates a User-Body relationship.
 */
export const updateUserBody = async (userBodyData) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/bodies`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userBodyData),
    });
    if (!response.ok) {
      throw new Error('Failed to update User-Body relationship');
    }
    return await response.json();
  } catch (error) {
    if (error.message === AUTH_ERROR_MESSAGE) {
      console.warn('updateUserBody aborted: user not authenticated.');
      return null;
    }
    console.error('Error updating User-Body:', error);
    return null;
  }
};

/**
 * Deletes a User-Body relationship.
 */
export const deleteUserBody = async (userId, bodyId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/bodies/${userId}/${bodyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to delete User-Body relationship');
    }
    return await response.json();
  } catch (error) {
    if (error.message === AUTH_ERROR_MESSAGE) {
      console.warn('deleteUserBody aborted: user not authenticated.');
      return null;
    }
    console.error('Error deleting User-Body:', error);
    return null;
  }
};

export const fetchIsMemberOfFeastCommittee = async (userId, communityId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/bodies/feast-committee/${communityId}/${userId}/is-member`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch is member of Feast Committee');
    }
    return await response.json();
  } catch (error) {
    if (error.message === AUTH_ERROR_MESSAGE) {
      console.warn('fetchIsMemberOfFeastCommittee aborted: user not authenticated.');
      return null;
    }
    console.error('Error fetching is member of Feast Committee:', error);
    return null;
  }
};

export const fetchIsMemberOfHolyDaysCommittee = async (userId, communityId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/bodies/holy-days-committee/${communityId}/${userId}/is-member`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch is member of Holy Days Committee');
    }
    return await response.json();
  } catch (error) {
    if (error.message === AUTH_ERROR_MESSAGE) {
      console.warn('fetchIsMemberOfHolyDaysCommittee aborted: user not authenticated.');
      return null;
    }
    console.error('Error fetching is member of Holy Days Committee:', error);
    return null;
  }
};

export const fetchIsMemberOfLocalSpiritualAssembly = async (userId, communityId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/bodies/local-spiritual-assembly/${communityId}/${userId}/is-member`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch is member of Local Spiritual Assembly');
    }
    return await response.json();
  } catch (error) {
    if (error.message === AUTH_ERROR_MESSAGE) {
      console.warn('fetchIsMemberOfLocalSpiritualAssembly aborted: user not authenticated.');
      return null;
    }
    console.error('Error fetching is member of Local Spiritual Assembly:', error);
    return null;
  }
};
/**
 * Fetch the appropriate user body members based on the event type.
 * @param {string} eventType - The type of the event (e.g., 'Feast', 'Holy Day', or other).
 * @returns {Promise<Array>} - Array of users in the appropriate committee or assembly.
 */
/**
 * Fetch the appropriate user body members based on the event type.
 * @param {string} eventType - The type of the event (e.g., 'Feast', 'Holy Day', else LSA).
 * @param {string} token - Bearer token for authorization.
 * @returns {Promise<Array>} Array of users in the selected body.
 */
export const fetchUserBodyByEventType = async (eventType, token) => {
  const type = (eventType || '').toLowerCase();
    try {
      if (type.includes('feast')) {
        return await fetchFeastCommittee(token);
      } else if (type.includes('holy')) {
        return await fetchHolyDaysCommittee(token);
      } else {
        return await fetchLocalSpiritualAssembly(token);
      }
    } catch (error) {
      console.error('Error fetching user body for event type:', eventType, error);
      return [];
    }
};
