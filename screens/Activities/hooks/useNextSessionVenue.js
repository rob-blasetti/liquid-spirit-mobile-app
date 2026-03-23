import { useMemo } from 'react';
import { resolveSessionDate } from '../../../utils/activityDate';
import { getDisplayAddress } from '../../DetailCard/Activity/utils/locationUtils';

const coalesceString = (...values) => {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return '';
};

const pickSessionAddress = (sessionInput = {}, activityInput = {}) => {
  const session = sessionInput || {};
  const activity = activityInput || {};
  const venueAddress = Array.isArray(session.venues)
    ? session.venues
        .map((venue) => venue?.address)
        .find((address) => getDisplayAddress({ sessionAddress: address }).length > 0)
    : null;

  const sessionAddress = venueAddress || session.address;
  const activityAddress = activity.address;

  const venueName = Array.isArray(session.venues)
    ? session.venues
        .map((venue) => venue?.name || venue?.title || venue?.label)
        .find((name) => typeof name === 'string' && name.trim().length > 0)
    : session.venueName || session.venue;

  const addressLabel = coalesceString(
    venueName,
    getDisplayAddress({ sessionAddress, activityAddress }),
    sessionAddress?.name,
    session.location,
    session.venue,
    activity?.venue,
    activity?.location,
    getDisplayAddress({ activityAddress }),
  );

  return addressLabel;
};

const pickNextSession = (activity = {}) => {
  const sessions = Array.isArray(activity.sessions) ? activity.sessions : [];
  if (!sessions.length) return { session: null, date: null };
  const now = new Date();
  const upcoming = sessions
    .map((session) => ({
      session,
      date: resolveSessionDate(session, activity),
    }))
    .filter(
      (entry) =>
        entry.date instanceof Date &&
        !isNaN(entry.date) &&
        entry.date >= now &&
        ['Scheduled', 'Confirmed'].includes(entry.session?.status || 'Scheduled'),
    )
    .sort((a, b) => a.date - b.date);

  return upcoming[0] || { session: null, date: null };
};

const isOnlineSession = (sessionInput = {}, activityInput = {}) => {
  const session = sessionInput || {};
  const activity = activityInput || {};
  const mode = session.locationMode || activity.locationMode;
  return (
    mode === 'online' ||
    mode === 'both' ||
    Boolean(session.onlineLink || activity.onlineLink)
  );
};

const useNextSessionVenue = (activity) =>
  useMemo(() => {
    const { session, date } = pickNextSession(activity);
    const online = isOnlineSession(session, activity);
    const venueLabel = pickSessionAddress(session, activity);
    return {
      nextSessionDate: date,
      venueLabel: venueLabel || (online ? 'Online' : 'Location TBD'),
      isOnline: online,
    };
  }, [activity]);

export default useNextSessionVenue;
