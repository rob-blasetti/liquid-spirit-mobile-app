import { API_URL } from '../config';

export const fetchCommunity = async (communityId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/community/${communityId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }
    return data;
  } catch (error) {
    throw new Error(`Fetch community error: ${error.message}`);
  }
};

export const fetchFeastCommittee = async (communityId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/community/${communityId}/feastcommittee`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }
    return data;
  } catch (error) {
    throw new Error(`Fetch Feast Committee error: ${error.message}`);
  }
};

export const fetchHolyDaysCommittee = async (communityId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/community/${communityId}/holydayscommittee`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }
    return data;
  } catch (error) {
    throw new Error(`Fetch Holy Days Committee error: ${error.message}`);
  }
};

export const fetchLocalSpiritualAssembly = async (communityId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/community/${communityId}/lsa`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }
    return data;
  } catch (error) {
    throw new Error(`Fetch Local Spirital Assembly error: ${error.message}`);
  }
};