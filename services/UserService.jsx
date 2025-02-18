import { API_URL } from '../config';

export const fetchUser = async (userId) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_URL}/api/users/getUser/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }
    return data;
  } catch (error) {
    throw new Error(`Fetch user error: ${error.message}`);
  }
};

export const discoverUsers = async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('User is not authenticated. No token found in localStorage.');
  }

  try {
    const response = await fetch(`${API_URL}/api/users/discover`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    // Log the response for debugging purposes
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error fetching users');
    }

    return data;
  } catch (error) {
    console.error(`Fetch user error: ${error.message}`);
    throw new Error(`Fetch user error: ${error.message}`);
  }
};

export const getMemberList = async (communityId) => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('User is not authenticated. No token found in localStorage.');
  }

  try {
    const response = await fetch(`${API_URL}/api/users/getAllMembers/${communityId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Decode the error response if the server provides error details
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.message || 'Error fetching users';
      throw new Error(errorMessage);
    }

    // Decode the successful JSON response
    const data = await response.json();

    return data; // This corresponds to `memberDetails` in your backend response
  } catch (error) {
    console.error(`Fetch user error: ${error.message}`);
    throw new Error(`Fetch user error: ${error.message}`);
  }
};


export const helloUsers = async () => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_URL}/api/users/hello`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    console.log('data: ', data);
    if (!response.ok) {
      throw new Error(data.message);
    }
    return data;
  } catch (error) {
    throw new Error(`Fetch user error: ${error.message}`);
  }
};

export const blockUser = async (userId, token) => { 
  try {
    const response = await fetch(`${API_URL}/api/users/${userId}/blockUser`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
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
      }
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