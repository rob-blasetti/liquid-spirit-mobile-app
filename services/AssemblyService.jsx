import { API_URL } from '../config';

export const sendAgendaItemSuggestion = async (token, communityId, title, body) => {
    const res = await fetch(
      `${API_URL}/api/assembly/${communityId}/agenda-item-suggestion`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify({ title, body })
      }
    );
  
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unknown error');
    return data;
  };