import { getCurrentUserId } from '../services/AuthService';
import NotificationService from '../services/NotificationService';

import API_URL from '../config';
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
    return eventsData;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const joinEvent = async (eventId, eventName, user, community, token) => {
  try {
    const userId = getCurrentUserId();
    const userName = user.firstName + ' ' + user.lastName;
    const userCommunityId = (community && community.data && community.data._id) ? community.data._id : 'Your Community ID';

    const response = await fetch(`${API_URL}/api/events/${eventId}/join`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to join the event. Please try again.');
    }

    // Simulate a Notification Service call
    await NotificationService.userJoinedEventNotification(
      userId,
      eventId,
      userCommunityId,
      eventName,
      userName
    );

    return response; // Ensure that the response is returned
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
      throw new Error('Failed to fetch event details. Please try again.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
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