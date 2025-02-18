// src/services/NotificationService.js
import { API_URL } from '../config';

const NotificationService = {
  async sendNotification(type, actorId, targetId, targetType, recipientCommunity, additionalData, scope) {
    const token = localStorage.getItem('token');
    try {
      if (!token) {
        console.error('Token is not available for sendNotification. Ensure the user is logged in.');
        throw new Error('Token not available');
      }

      const response = await fetch(`${API_URL}/api/notifications/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          actor: actorId,
          target: targetId,
          targetType,
          recipientCommunity,
          additionalData,
          scope
        }),
      });


      const data = await response.json();
      console.log('Notification Response: ', data);
      if (!response.ok) {
        console.error('Failed to send notification:', data.error || 'Unknown error');
        throw new Error(data.error || 'Failed to send notification');
      }

      console.log('Notification sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },

  // Specific notification types

  async userJoinedEventNotification(actorId, eventId, recipientCommunity, eventTitle, userName) {
    return this.sendNotification(
      'join_event',
      actorId,
      eventId,
      'Event',
      recipientCommunity,
      { caption: `${userName} is attending "${eventTitle}".` },
      'community'
    );
  },

  async newActivityNotification(actorId, activityId, recipientCommunity, activityTitle) {
    return this.sendNotification(
      'new_activity',
      actorId,
      activityId,
      'Activity',
      recipientCommunity,
      { caption: `A new activity "${activityTitle}" has been created.` },
      'community'
    );
  },

  async userJoinedActivity(actorId, activityId, recipientCommunity, activityTitle, activityType, userName) {
    console.log('actorId:', actorId);
    console.log('activityId:', activityId);
    console.log('recipientCommunity:', recipientCommunity);
    console.log('activityTitle:', activityTitle);
    console.log('userName:', userName);
    return this.sendNotification(
      'activity_updated',
      actorId,
      activityId,
      'Activity',
      recipientCommunity,
      { caption: `${userName} has joined the ${activityType} activity: ${activityTitle}` },
      'community'
    );
  },

  async activityUpdateNotification(actorId, activityId, recipientCommunity, activityTitle) {
    return this.sendNotification(
      'activity_updated',
      actorId,
      activityId,
      'Activity',
      recipientCommunity,
      { caption: `The activity "${activityTitle}" has been updated.` },
      'community'
    );
  },

  async activityCanceledNotification(actorId, activityId, recipientCommunity, activityTitle) {
    return this.sendNotification(
      'activity_canceled',
      actorId,
      activityId,
      'Activity',
      recipientCommunity,
      { caption: `The activity "${activityTitle}" has been canceled.` },
      'community'
    );
  },

  async userLeftEventNotification(actorId, eventId, recipientCommunity, eventTitle, userName) {
    return this.sendNotification(
      'leave_event',
      actorId,
      eventId,
      'Event',
      recipientCommunity,
      { caption: `${userName} has left the event "${eventTitle}".` },
      'community'
    );
  },

  async mediaPostedNotification(actorId, mediaId, recipientCommunity, mediaTitle, mediaUrl) {
    return this.sendNotification(
      'post_media',
      actorId,
      mediaId,
      'Media',
      recipientCommunity,
      { caption: `A new media "${mediaTitle}" has been posted.`, mediaUrl },
      'community'
    );
  },

  async assemblyAnnouncementNotification(actorId, announcementId, recipientCommunity, announcementTitle) {
    return this.sendNotification(
      'assembly_announcement',
      actorId,
      announcementId,
      'Announcement',
      recipientCommunity,
      { caption: `New assembly announcement: "${announcementTitle}".` },
      'community'
    );
  },

  async budgetUpdateNotification(actorId, budgetId, recipientCommunity) {
    return this.sendNotification(
      'budget_update',
      actorId,
      budgetId,
      'Finance',
      recipientCommunity,
      { caption: `The community budget has been updated.` },
      'community'
    );
  },

  async eventReminderNotification(actorId, eventId, recipientCommunity, eventTitle) {
    return this.sendNotification(
      'event_reminder',
      actorId,
      eventId,
      'Event',
      recipientCommunity,
      { caption: `Reminder: The event "${eventTitle}" is happening soon.` },
      'community'
    );
  },

  async newMemberWelcomeNotification(actorId, memberId, recipientCommunity, memberName) {
    return this.sendNotification(
      'new_member_welcome',
      actorId,
      memberId,
      'Member',
      recipientCommunity,
      { caption: `Welcome ${memberName} to the community!` },
      'community'
    );
  },

  async roleAssignmentNotification(actorId, memberId, recipientCommunity, roleName) {
    return this.sendNotification(
      'role_assignment',
      actorId,
      memberId,
      'Member',
      recipientCommunity,
      { caption: `${roleName} role has been assigned.` },
      'community'
    );
  },

  async communityEventUpdateNotification(actorId, eventId, recipientCommunity, eventTitle, updateDetails) {
    return this.sendNotification(
      'community_event_update',
      actorId,
      eventId,
      'Event',
      recipientCommunity,
      { caption: `Update on the event "${eventTitle}": ${updateDetails}` },
      'community'
    );
  },

  async markNotificationAsRead(notificationId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token is not available for markNotificationAsRead. Ensure the user is logged in.');
        throw new Error('Token not available');
      }

      const response = await fetch(`${API_URL}/api/notifications/${notificationId}/mark-as-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Failed to mark notification as read:', data.error || 'Unknown error');
        throw new Error(data.error || 'Failed to mark notification as read');
      }

      console.log('Notification marked as read successfully:', data);
      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  async markAllNotificationsAsRead(userId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token is not available for markAllNotificationsAsRead. Ensure the user is logged in.');
        throw new Error('Token not available');
      }
  
      const response = await fetch(`${API_URL}/api/notifications/mark-as-read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId })
      });
  
      const data = await response.json();
      if (!response.ok) {
        console.error('Failed to mark all notifications as read:', data.error || 'Unknown error');
        throw new Error(data.error || 'Failed to mark all notifications as read');
      }
  
      console.log('All notifications marked as read successfully:', data);
      return data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },  

  // Get all notifications
async getAllNotifications(userId, params = {}) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token is not available for getAllNotifications. Ensure the user is logged in.');
      throw new Error('Token not available');
    }

    // Construct the URL with query parameters
    const url = new URL(`${API_URL}/api/notifications`);
    url.searchParams.append('userId', userId);

    // Add optional parameters (e.g., since for incremental fetching)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value);
      }
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      console.error('Unauthorized request. Token might be expired or invalid.');
      throw new Error('Unauthorized request');
    }

    const data = await response.json();
    if (!response.ok) {
      console.error('Failed to fetch notifications:', data.error || 'Unknown error');
      throw new Error(data.error || 'Failed to fetch notifications');
    }

    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}
};

export default NotificationService;