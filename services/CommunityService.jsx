import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const getAuthToken = async () => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    throw new Error('User is not authenticated.');
  }
  return token;
};

export const fetchCommunity = async (communityId) => {
  try {
    const token = await getAuthToken();
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
    const token = await getAuthToken();
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
    const token = await getAuthToken();
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
    const token = await getAuthToken();
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
