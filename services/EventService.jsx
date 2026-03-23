import NotificationService from '../services/NotificationService';
import { getCurrentUserId } from './AuthService';

import { API_URL } from '../config';
import { buildJsonHeaders, parseJsonSafe, requestJson } from './http';

export const fetchEvents = async (token) => {
  try {
    const { data: eventsData } = await requestJson(
      `${API_URL}/api/events`,
      {
        method: 'GET',
        headers: buildJsonHeaders(token),
      },
      'Failed to fetch events',
    );
    return eventsData.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const fetchEventsForAttendee = async (userId, token) => {
  try {
    const { data } = await requestJson(
      `${API_URL}/api/events/user/${userId}/attending`,
      {
        method: 'GET',
        headers: buildJsonHeaders(token),
      },
      'Failed to load attendee events.',
    );

    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.events)) return data.events;
    if (Array.isArray(data.data?.events)) return data.data.events;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;

    return data;
  } catch (error) {
    if (!error.status) {
      console.error('Error fetching attendee events:', error);
    }
    throw error;
  }
};

export const joinEvent = async (eventId, token, eventName, user, communityId) => {
  const userName = user.firstName + ' ' + user.lastName;
  const userId = user?._id || user?.id;

  try {
    const { response } = await requestJson(
      `${API_URL}/api/events/${eventId}/join`,
      {
        method: 'PUT',
        headers: buildJsonHeaders(token),
      },
      'Failed to join the event. Please try again.',
    );

    try {
      await NotificationService.userJoinedEventNotification(
        token,
        userId,
        eventId,
        communityId,
        eventName,
        userName
      );
    } catch (notifErr) {
      console.error('Notification Service failed:', notifErr);
    }

    return response;
  } catch (error) {
    console.error('Error joining event:', error);
    throw error;
  }
};

export const fetchEventDetails = async (eventId, token) => {
  try {
    const { data } = await requestJson(
      `${API_URL}/api/events/${eventId}`,
      {
        method: 'GET',
        headers: buildJsonHeaders(token),
      },
      'Failed to fetch event details. Please try again.',
    );
    return data;
  } catch (error) {
    console.error('Error fetching event details:', error);
    throw error;
  }
};

export const addEventHost = async (eventId, hosts, token) => {
  try {
    const { data: updatedEvent } = await requestJson(
      `${API_URL}/api/events/${eventId}/hosts`,
      {
        method: 'PATCH',
        headers: buildJsonHeaders(token),
        body: JSON.stringify({ hosts }),
      },
      'Failed to add event host(s).',
    );
    return updatedEvent;
  } catch (error) {
    console.error('Error adding event host(s):', error);
    throw error;
  }
};

export const addEventHostRequest = async (token, eventId) => {
  try {
    if (!token) throw new Error('User is not authenticated.');

    const userId = getCurrentUserId(token);
    if (!userId) throw new Error('User ID is missing. Cannot request host privileges.');

    const requestBody = { requester: { refId: userId, type: 'User' } };

    const { data: updatedEvent } = await requestJson(
      `${API_URL}/api/events/${eventId}/hostRequests`,
      {
        method: 'PUT',
        headers: buildJsonHeaders(token),
        body: JSON.stringify(requestBody),
      },
      'Failed to submit host request.',
    );
    return updatedEvent;
  } catch (error) {
    console.error('Error submitting host request:', error);
    throw error;
  }
};

export const addEventMaterials = async (id, title, file, token) => {
  const formData = new FormData();
  formData.append('eventId', id);
  formData.append('title', title.toString());
  formData.append('file', file);

  try {
    const response = await fetch(`${API_URL}/api/upload/materials`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const updatedEvent = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(updatedEvent?.message || 'Failed to add event material(s).');
    }

    if (!updatedEvent) {
      throw new Error('Event materials upload response was empty');
    }

    return updatedEvent;
  } catch (error) {
    console.error('Error adding event material(s):', error);
    throw error;
  }
};
