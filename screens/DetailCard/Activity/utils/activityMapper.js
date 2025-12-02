import { normalizeAddress, resolveCoordinates } from './locationUtils';

const safeArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

export const mapActivityDetail = (activity) => {
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
