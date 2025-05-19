import { API_URL } from '../config';

export const fetchSearchResults = async (query, token) => {
  try {
    const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      },
    });

    // Debug: remove raw fetch response log; JSON will be logged after parsing

    if (!response.ok) {
      throw new Error('Failed to fetch search results');
    }

    const responseData = await response.json();
    console.log('Fetched search results:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error fetching search results:', error);
    throw new Error(`Fetch search results error: ${error.message}`);
  }
};