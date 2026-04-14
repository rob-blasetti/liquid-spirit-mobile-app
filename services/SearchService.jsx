import { API_URL } from '../config';
import { buildJsonHeaders, requestJson } from './http';
import debugLog from '../utils/debugLog';

export const fetchSearchResults = async (query, token, communityId, type) => {
  try {
    let url = `${API_URL}/api/search?q=${encodeURIComponent(query)}`;
    if (communityId) {
      url += `&communityId=${encodeURIComponent(communityId)}`;
    }
    if (type) {
      url += `&type=${encodeURIComponent(type)}`;
    }

    const { data: responseData } = await requestJson(
      url,
      {
        headers: buildJsonHeaders(token),
      },
      'Failed to fetch search results',
    );
    debugLog('Fetched search results:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error fetching search results:', error);
    throw new Error(`Fetch search results error: ${error.message}`);
  }
};

export const fetchSearchAutocomplete = async (query, token, communityId, type) => {
  const trimmedQuery = query?.trim?.() ?? '';
  if (!trimmedQuery) {
    return [];
  }

  try {
    let url = `${API_URL}/api/search/autocomplete?q=${encodeURIComponent(trimmedQuery)}`;
    if (communityId) {
      url += `&communityId=${encodeURIComponent(communityId)}`;
    }
    if (type) {
      url += `&type=${encodeURIComponent(type)}`;
    }

    const { data: responseData } = await requestJson(
      url,
      {
        headers: buildJsonHeaders(token),
      },
      'Failed to fetch autocomplete suggestions',
    );
    debugLog('Fetched autocomplete suggestions:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error fetching search autocomplete:', error);
    return [];
  }
};
