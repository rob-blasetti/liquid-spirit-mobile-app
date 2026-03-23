import { API_URL } from '../config';
import debugLog from '../utils/debugLog';

const normalizeEntityId = (value) => {
  if (!value) return null;
  if (typeof value === 'string' || typeof value === 'number') {
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }
  if (typeof value === 'object') {
    return (
      normalizeEntityId(value._id) ||
      normalizeEntityId(value.id) ||
      null
    );
  }
  return null;
};

const isPostCreationType = (typeName = '') => {
  const normalized = typeName.toString().toLowerCase().replace(/[^a-z]/g, '');
  if (!normalized) return false;
  if (normalized === 'postcreated' || normalized === 'postcreate') return true;
  return normalized.includes('post') && normalized.includes('create');
};

export const filterOutSelfAuthoredPostNotifications = (notifications, currentUserId) => {
  if (!Array.isArray(notifications) || notifications.length === 0) return notifications || [];
  const normalizedUserId = normalizeEntityId(currentUserId);
  if (!normalizedUserId) return notifications;

  return notifications.filter((notification) => {
    if (!notification) return false;
    const rawType = notification.type?.typeName || notification.type;
    if (!isPostCreationType(rawType)) {
      return true;
    }

    const actorId =
      normalizeEntityId(notification.actor) ||
      normalizeEntityId(notification.actorId) ||
      normalizeEntityId(notification.additionalData?.actor) ||
      normalizeEntityId(notification.additionalData?.actorId);

    if (!actorId) return true;
    return actorId !== normalizedUserId;
  });
};

const NotificationService = {
  async sendNotification(token, type, actorId, targetId, targetType, recipientCommunity, additionalData, scope) {
    try {
      if (!token) {
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
          scope,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notification');
      }

      return data;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },

  // Specific Notification Types

  async userJoinedEventNotification(token, actorId, eventId, recipientCommunity, eventTitle, userName) {
    return this.sendNotification(
      token,
      'join_event',
      actorId,
      eventId,
      'Event',
      recipientCommunity,
      { caption: `${userName} is attending "${eventTitle}".` },
      'community'
    );
  },

  async newActivityNotification(token, actorId, activityId, recipientCommunity, activityTitle) {
    return this.sendNotification(
      token,
      'new_activity',
      actorId,
      activityId,
      'Activity',
      recipientCommunity,
      { caption: `A new activity "${activityTitle}" has been created.` },
      'community'
    );
  },

  async userJoinedActivity(token, actorId, activityId, recipientCommunity, activityTitle, activityType, userName) {
    return this.sendNotification(
      token,
      'activity_updated',
      actorId,
      activityId,
      'Activity',
      recipientCommunity,
      { caption: `${userName} has joined the ${activityType} activity: ${activityTitle}` },
      'community'
    );
  },

  async activityUpdateNotification(token, actorId, activityId, recipientCommunity, activityTitle) {
    return this.sendNotification(
      token,
      'activity_updated',
      actorId,
      activityId,
      'Activity',
      recipientCommunity,
      { caption: `The activity "${activityTitle}" has been updated.` },
      'community'
    );
  },

  async activityCanceledNotification(token, actorId, activityId, recipientCommunity, activityTitle) {
    return this.sendNotification(
      token,
      'activity_canceled',
      actorId,
      activityId,
      'Activity',
      recipientCommunity,
      { caption: `The activity "${activityTitle}" has been canceled.` },
      'community'
    );
  },

  async userLeftEventNotification(token, actorId, eventId, recipientCommunity, eventTitle, userName) {
    return this.sendNotification(
      token,
      'leave_event',
      actorId,
      eventId,
      'Event',
      recipientCommunity,
      { caption: `${userName} has left the event "${eventTitle}".` },
      'community'
    );
  },

  async mediaPostedNotification(token, actorId, mediaId, recipientCommunity, mediaTitle, mediaUrl) {
    return this.sendNotification(
      token,
      'post_media',
      actorId,
      mediaId,
      'Media',
      recipientCommunity,
      { caption: `A new media "${mediaTitle}" has been posted.`, mediaUrl },
      'community'
    );
  },

  async assemblyAnnouncementNotification(token, actorId, announcementId, recipientCommunity, announcementTitle) {
    return this.sendNotification(
      token,
      'assembly_announcement',
      actorId,
      announcementId,
      'Announcement',
      recipientCommunity,
      { caption: `New assembly announcement: "${announcementTitle}".` },
      'community'
    );
  },

  async budgetUpdateNotification(token, actorId, budgetId, recipientCommunity) {
    return this.sendNotification(
      token,
      'budget_update',
      actorId,
      budgetId,
      'Finance',
      recipientCommunity,
      { caption: 'The community budget has been updated.' },
      'community'
    );
  },

  async eventReminderNotification(token, actorId, eventId, recipientCommunity, eventTitle) {
    return this.sendNotification(
      token,
      'event_reminder',
      actorId,
      eventId,
      'Event',
      recipientCommunity,
      { caption: `Reminder: The event "${eventTitle}" is happening soon.` },
      'community'
    );
  },

  async newMemberWelcomeNotification(token, actorId, memberId, recipientCommunity, memberName) {
    return this.sendNotification(
      token,
      'new_member_welcome',
      actorId,
      memberId,
      'Member',
      recipientCommunity,
      { caption: `Welcome ${memberName} to the community!` },
      'community'
    );
  },

  async roleAssignmentNotification(token, actorId, memberId, recipientCommunity, roleName) {
    return this.sendNotification(
      token,
      'role_assignment',
      actorId,
      memberId,
      'Member',
      recipientCommunity,
      { caption: `${roleName} role has been assigned.` },
      'community'
    );
  },

  async communityEventUpdateNotification(token, actorId, eventId, recipientCommunity, eventTitle, updateDetails) {
    return this.sendNotification(
      token,
      'community_event_update',
      actorId,
      eventId,
      'Event',
      recipientCommunity,
      { caption: `Update on the event "${eventTitle}": ${updateDetails}` },
      'community'
    );
  },

  async markNotificationAsRead(token, notificationId) {
    debugLog('markNotificationAsRead', { hasToken: Boolean(token), notificationId });

    try {
      if (!token) throw new Error('Token not available');

      const response = await fetch(`${API_URL}/api/notifications/${notificationId}/mark-as-read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      debugLog('markNotificationAsRead response', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark notification as read');
      }

      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  async markAllNotificationsAsRead(token, userId) {
    try {
      if (!token) throw new Error('Token not available');

      const response = await fetch(`${API_URL}/api/notifications/mark-as-read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark all notifications as read');
      }

      return data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  async getAllNotifications(token, params = {}) {
    try {
      if (!token) throw new Error('Token not available');

      const url = new URL(`${API_URL}/api/notifications`);

      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, value);
        }
      });

      // fetch expects a string URL; convert URL object to string
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        // throw server-provided message if available, else default
        throw new Error(data.error || data.message || 'Failed to fetch notifications');
      }

      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },
};

export default NotificationService;
