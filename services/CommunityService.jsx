import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import { buildJsonHeaders, requestJson } from './http';

const getAuthToken = async () => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    throw new Error('User is not authenticated.');
  }
  return token;
};

const fetchCommunityResource = async (path, fallbackLabel) => {
  try {
    const token = await getAuthToken();
    const { data } = await requestJson(
      `${API_URL}${path}`,
      {
        method: 'GET',
        headers: buildJsonHeaders(token),
      },
      fallbackLabel,
    );
    return data;
  } catch (error) {
    throw new Error(`${fallbackLabel}: ${error.message}`);
  }
};

export const fetchCommunity = async (communityId) =>
  fetchCommunityResource(`/api/community/${communityId}`, 'Fetch community error');

export const fetchFeastCommittee = async (communityId) =>
  fetchCommunityResource(`/api/community/${communityId}/feastcommittee`, 'Fetch Feast Committee error');

export const fetchHolyDaysCommittee = async (communityId) =>
  fetchCommunityResource(`/api/community/${communityId}/holydayscommittee`, 'Fetch Holy Days Committee error');

export const fetchLocalSpiritualAssembly = async (communityId) =>
  fetchCommunityResource(`/api/community/${communityId}/lsa`, 'Fetch Local Spirital Assembly error');
