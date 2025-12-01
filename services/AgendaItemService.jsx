import { API_URL } from '../config';

export const createAgendaItem = async ({ token, communityId, title, description }) => {
  if (!token) {
    throw new Error('Authentication token is required');
  }
  if (!communityId) {
    throw new Error('Community id is required');
  }
  if (!title?.trim()) {
    throw new Error('Title is required');
  }

  const payload = {
    title: title.trim(),
    community: communityId,
  };

  if (description?.trim()) {
    payload.description = description.trim();
  }

  console.log('[AgendaItemService] createAgendaItem start', {
    communityId,
    hasToken: Boolean(token),
    title: payload.title,
    hasDescription: Boolean(payload.description),
  });

  const response = await fetch(`${API_URL}/api/assembly-agenda-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  let responseData = null;
  try {
    responseData = await response.json();
  } catch (_) {
    responseData = null;
  }

  console.log('[AgendaItemService] createAgendaItem response', {
    status: response.status,
    ok: response.ok,
    body: responseData,
  });

  if (!response.ok) {
    const message = responseData?.message || 'Failed to create agenda item';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return responseData?.data ?? responseData;
};
