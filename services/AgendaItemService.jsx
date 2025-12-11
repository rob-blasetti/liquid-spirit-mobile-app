import { API_URL } from '../config';

export const createAgendaItem = async ({ token, title, description }) => {
  if (!token) {
    throw new Error('Authentication token is required');
  }
  if (!title?.trim()) {
    throw new Error('Title is required');
  }
  if (!description?.trim()) {
    throw new Error('Description is required');
  }

  const payload = {
    title: title.trim(),
    description: description.trim(),
  };

  console.log('[AgendaItemService] createAgendaItem start', {
    hasToken: Boolean(token),
    title: payload.title,
    descriptionLength: payload.description.length,
  });

  const response = await fetch(`${API_URL}/api/guardian/agenda-items/community`, {
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
