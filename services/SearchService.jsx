import { API_URL } from '../config';
import debugLog from '../utils/debugLog';

export const fetchSearchResults = async (query, token, communityId) => {
  try {
    let url = `${API_URL}/api/search?q=${encodeURIComponent(query)}`;
    if (communityId) {
      url += `&communityId=${encodeURIComponent(communityId)}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    // Debug: remove raw fetch response log; JSON will be logged after parsing

    if (!response.ok) {
      throw new Error('Failed to fetch search results');
    }

    const responseData = await response.json();
    debugLog('Fetched search results:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error fetching search results:', error);
    throw new Error(`Fetch search results error: ${error.message}`);
  }
};

export const fetchSearchAutocomplete = async (query, token, communityId) => {
  const trimmedQuery = query?.trim?.() ?? '';
  if (!trimmedQuery) {
    return [];
  }

  try {
    let url = `${API_URL}/api/search/autocomplete?q=${encodeURIComponent(trimmedQuery)}`;
    if (communityId) {
      url += `&communityId=${encodeURIComponent(communityId)}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch autocomplete suggestions');
    }

    const responseData = await response.json();
    debugLog('Fetched autocomplete suggestions:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error fetching search autocomplete:', error);
    return [];
  }
};
