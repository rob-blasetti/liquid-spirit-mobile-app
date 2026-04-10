import {normalizeAddress, resolveCoordinates} from './locationUtils';
import {
  DATE_ONLY_REGEX,
  MIDNIGHT_UTC_REGEX,
  getEffectiveNextDate,
  resolveSessionDate,
} from '../../../../utils/activityDate';

const safeArray = value => (Array.isArray(value) ? value.filter(Boolean) : []);
const isValidDate = value => value instanceof Date && !isNaN(value.getTime());
const hasExplicitTime = value =>
  typeof value === 'string' &&
  value.includes('T') &&
  !DATE_ONLY_REGEX.test(value) &&
  !MIDNIGHT_UTC_REGEX.test(value);
const formatDateAsTime = value =>
  `${String(value.getHours()).padStart(2, '0')}:${String(
    value.getMinutes(),
  ).padStart(2, '0')}`;

const getNextSessionEntry = activity => {
  const now = new Date();
  return (
    safeArray(activity?.sessions)
      .map(session => ({
        session,
        dateObj: resolveSessionDate(session, activity),
      }))
      .filter(({dateObj}) => isValidDate(dateObj) && dateObj >= now)
      .sort((a, b) => a.dateObj - b.dateObj)[0] || null
  );
};

const deriveGroupDetails = activity => {
  const existing = activity?.groupDetails || {};
  const nextSessionEntry = getNextSessionEntry(activity);
  const fallbackDate =
    nextSessionEntry?.dateObj || getEffectiveNextDate(activity);

  if (!isValidDate(fallbackDate)) {
    return existing;
  }

  const rawDateSource =
    [
      nextSessionEntry?.session?.startTime,
      nextSessionEntry?.session?.scheduledAt,
      nextSessionEntry?.session?.datetime,
      nextSessionEntry?.session?.date,
      activity?.startTime,
      activity?.scheduledAt,
      activity?.date,
    ].find(hasExplicitTime) || '';

  const derivedTime =
    existing.time ||
    nextSessionEntry?.session?.time ||
    nextSessionEntry?.session?.groupDetails?.time ||
    (rawDateSource ? formatDateAsTime(fallbackDate) : '');

  return {
    ...existing,
    day:
      existing.day ||
      fallbackDate.toLocaleDateString(undefined, {weekday: 'long'}),
    time: derivedTime || existing.time,
  };
};

export const mapActivityDetail = activity => {
  if (!activity) return null;

  const mappedAddress = activity.address || {};
  const base = {
    ...activity,
    facilitators: safeArray(activity.facilitators),
    participants: safeArray(activity.participants),
    pendingFacilitators: safeArray(activity.pendingFacilitators),
    pendingParticipants: safeArray(activity.pendingParticipants),
    sessions: safeArray(activity.sessions),
    venues: safeArray(activity.venues),
    address: mappedAddress,
    groupDetails: deriveGroupDetails(activity),
  };

  base.addressString = normalizeAddress(mappedAddress);
  base.addressCoordinates =
    resolveCoordinates(mappedAddress.coordinates) ||
    resolveCoordinates(mappedAddress.location) ||
    null;

  base.sessions = base.sessions.map(session => {
    const sessionAddress = session.address || {};
    return {
      ...session,
      address: sessionAddress,
      addressString: normalizeAddress(sessionAddress),
      coordinates:
        resolveCoordinates(sessionAddress.coordinates) ||
        resolveCoordinates(sessionAddress.location) ||
        null,
    };
  });

  return base;
};

export default mapActivityDetail;
