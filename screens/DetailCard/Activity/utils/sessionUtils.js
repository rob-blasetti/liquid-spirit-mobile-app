import { coalesceString, normalizeString } from './activityHelpers';
import {
  getStreetAndSuburb,
  normalizeVenueEntry,
  selectPrimaryVenue,
} from './venueUtils';
import { resolveSessionDate } from '../../../../utils/activityDate';

const getNormalizedVenues = (session, activityVenues = []) => {
  const source = [];
  if (session && Array.isArray(session.venues) && session.venues.length > 0) {
    source.push(...session.venues);
  }
  if (Array.isArray(activityVenues) && activityVenues.length > 0) {
    source.push(...activityVenues);
  }
  const seen = new Set();
  return source
    .map(normalizeVenueEntry)
    .filter(Boolean)
    .filter(venue => {
      const id = venue?._id || venue?.id;
      if (!id) return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
};

export const buildUpcomingSessions = (activity = {}) => {
  if (!Array.isArray(activity.sessions)) return [];
  const now = new Date();
  return activity.sessions
    .filter(Boolean)
    .filter(session => ['Scheduled', 'Confirmed'].includes(session?.status))
    .map(session => {
      const dateObj = resolveSessionDate(session, activity);
      return { session, dateObj };
    })
    .filter(({ dateObj }) => dateObj instanceof Date && !isNaN(dateObj) && dateObj >= now)
    .map(({ session, dateObj }) => {
      const normalizedForSession = getNormalizedVenues(session, activity.venues);
      const primaryVenue = selectPrimaryVenue(normalizedForSession);
      const venueAddress = primaryVenue?.address || session.address || activity.address;
      const displayAddress = normalizeString(getStreetAndSuburb(venueAddress));
      const displayName = coalesceString(
        session?.name,
        session?.title,
        primaryVenue?.name,
        activity?.title,
        'Upcoming Session'
      );
      return {
        ...session,
        dateObj,
        normalizedVenues: normalizedForSession,
        primaryVenue,
        displayAddress,
        displayName,
      };
    })
    .sort((a, b) => a.dateObj - b.dateObj);
};

export const orderSessionsWithHighlight = (upcomingSessions, initialSessionId) => {
  const normalizedInitialSessionId = normalizeString(initialSessionId);
  const sessionMatchesInitialId = (sessionCandidate) => {
    if (!normalizedInitialSessionId || !sessionCandidate) return false;
    const candidates = [
      sessionCandidate._id,
      sessionCandidate.id,
      sessionCandidate.sessionId,
      sessionCandidate.session_id,
      sessionCandidate.session?._id,
      sessionCandidate.session?.id,
    ];
    return candidates.some(value => normalizeString(value) === normalizedInitialSessionId);
  };

  const highlightedSessionIndex = normalizedInitialSessionId
    ? upcomingSessions.findIndex(sessionMatchesInitialId)
    : -1;

  if (highlightedSessionIndex <= 0) {
    return {
      orderedUpcomingSessions: upcomingSessions,
      highlightedSessionIndex,
      normalizedInitialSessionId,
    };
  }

  const clone = [...upcomingSessions];
  const [highlighted] = clone.splice(highlightedSessionIndex, 1);
  clone.unshift(highlighted);

  return {
    orderedUpcomingSessions: clone,
    highlightedSessionIndex,
    normalizedInitialSessionId,
  };
};
