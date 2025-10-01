import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../services/NotificationService';
import { getCurrentUserId } from './AuthService';

import { API_URL } from '../config';
import { UserContext } from '../contexts/UserContext';
import { useContext } from 'react';

export const fetchEvents = async (token) => {

  try {
    const response = await fetch(`${API_URL}/api/events`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }

    const eventsData = await response.json();
    return eventsData.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const fetchEventsForAttendee = async (userId, token) => {
  try {
    const response = await fetch(`${API_URL}/api/events/user/${userId}/attending`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    let data = null;
    try { data = await response.json(); } catch (_) { data = null; }

    if (!response.ok) {
      const message = data?.message || 'Failed to load attendee events.';
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

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
    const response = await fetch(`${API_URL}/api/events/${eventId}/join`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('response: ', response);

    if (!response.ok) {
      throw new Error('Failed to join the event. Please try again.');
    }

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
    const response = await fetch(`${API_URL}/api/events/${eventId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let message = 'Failed to fetch event details. Please try again.';
      try {
        const errBody = await response.json();
        if (errBody?.message) message = errBody.message;
      } catch (_) {
        // ignore JSON parse error
      }
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // surface status if fetch threw a Response error above
    console.error('Error fetching event details:', error);
    throw error;
  }
};

export const addEventHost = async (eventId, hosts, token) => {
  try {
    const response = await fetch(`${API_URL}/api/events/${eventId}/hosts`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ hosts }),
    });

    if (!response.ok) {
      throw new Error('Failed to add event host(s).');
    }

    // Return the updated event data
    const updatedEvent = await response.json();
    return updatedEvent;
  } catch (error) {
    console.error('Error adding event host(s):', error);
    throw error;
  }
};

export const addEventHostRequest = async (token, eventId) => {
  try {
    if (!token) throw new Error('User is not authenticated.');

    // Extract user ID from token
    const userId = getCurrentUserId(token);
    if (!userId) throw new Error('User ID is missing. Cannot request host privileges.');

    const requestBody = { requester: { refId: userId, type: 'User' } };

    const response = await fetch(`${API_URL}/api/events/${eventId}/hostRequests`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to submit host request: ${errText}`);
    }

    const updatedEvent = await response.json();
    return updatedEvent;
  } catch (error) {
    console.error('Error submitting host request:', error);
    throw error;
  }
};

export const addEventMaterials = async (id, title, file, token) => {
  const formData = new FormData();
  console.log(title, title.toString());
  formData.append('eventId', id);  // Changed to match the backend's expected field name
  formData.append('title', title.toString());
  formData.append('file', file);
  console.log(formData);

  try {
    const response = await fetch(`${API_URL}/api/upload/materials`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const updatedEvent = await response.json();

    if (!response.ok) {
      throw new Error(updatedEvent.message || 'Failed to add event material(s).');
    }

    return updatedEvent;
  } catch (error) {
    console.error('Error adding event material(s):', error);
    throw error;
  }
};
