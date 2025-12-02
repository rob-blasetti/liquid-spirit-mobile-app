import { useMemo } from 'react';

import { getEffectiveNextDate, resolveSessionDate } from '../../../utils/activityDate';
import { getDisplayAddress } from '../../DetailCard/Activity/utils/locationUtils';

const coalesceString = (...values) => {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length) return trimmed;
    }
  }
  return '';
};

const deriveActivityAddress = (activity = {}) =>
  coalesceString(
    activity.addressString,
    getDisplayAddress({ activityAddress: activity.address }),
    activity.address?.name,
    activity.venue,
    activity.location,
  );

const resolveSessionAddress = (session = {}, activity = {}) =>
  coalesceString(
    getDisplayAddress({ sessionAddress: session.address, activityAddress: activity.address }),
    session.address?.name,
    session.location,
    session.venue,
    deriveActivityAddress(activity),
    'Location TBD',
  );

const getNextSessionInfo = (activity = {}) => {
  const now = new Date();
  const sessions = Array.isArray(activity.sessions) ? activity.sessions : [];
  const upcoming = sessions
    .map((session) => {
      const date = resolveSessionDate(session, activity);
      if (!date || !(date instanceof Date) || isNaN(date) || date < now) return null;
      return { session, date };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);

  return upcoming[0] || { session: null, date: null };
};

const deriveEventAddress = (event = {}) =>
  coalesceString(
    event.venue,
    event.location,
    event.address?.name,
    event.address?.address,
    'Location TBD',
  );

const mapActivities = (activities = []) => {
  const now = new Date();
  return activities
    .map((activity) => {
      const { session, date: sessionDate } = getNextSessionInfo(activity);
      const nextDate = sessionDate || getEffectiveNextDate(activity);
      if (!nextDate || !(nextDate instanceof Date) || isNaN(nextDate) || nextDate < now) {
        return null;
      }
      const addressLabel = resolveSessionAddress(session, activity);
      return { activity, nextDate, addressLabel };
    })
    .filter(Boolean)
    .sort((a, b) => a.nextDate - b.nextDate)
    .slice(0, 4);
};

const mapEvents = (events = []) => {
  const now = new Date();
  return events
    .map((event) => {
      const when = new Date(event.startTime || event.date);
      if (isNaN(when) || when < now) return null;
      return {
        event,
        when,
        addressLabel: deriveEventAddress(event),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.when - b.when)
    .slice(0, 4);
};

const useDiscoverData = ({ userActivities, userEvents }) => {
  const activityPreview = useMemo(() => mapActivities(userActivities || []), [userActivities]);
  const eventPreview = useMemo(() => mapEvents(userEvents || []), [userEvents]);

  return {
    activityPreview,
    eventPreview,
  };
};

export default useDiscoverData;
