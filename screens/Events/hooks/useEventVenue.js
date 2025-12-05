import { useMemo } from 'react';
import { getDisplayAddress } from '../../DetailCard/Activity/utils/locationUtils';

const coalesceString = (...values) => {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return '';
};

const pickEventAddress = (event = {}) => {
  const venueAddress = Array.isArray(event.venues)
    ? event.venues
        .map((venue) => venue?.address)
        .find((address) => getDisplayAddress({ sessionAddress: address }).length > 0)
    : null;

  const sessionAddress = venueAddress || event.address;
  const venueName = Array.isArray(event.venues)
    ? event.venues
        .map((venue) => venue?.name || venue?.title || venue?.label)
        .find((name) => typeof name === 'string' && name.trim().length > 0)
    : event.venueName || event.venue;

  return coalesceString(
    venueName,
    getDisplayAddress({ sessionAddress }),
    sessionAddress?.name,
    event.location,
  );
};

const useEventVenue = (event) =>
  useMemo(() => {
    const isOnline =
      event?.locationMode === 'online' ||
      event?.locationMode === 'both' ||
      Boolean(event?.onlineLink);
    const venueLabel = pickEventAddress(event);

    return {
      venueLabel: venueLabel || (isOnline ? 'Online' : 'Location TBD'),
      isOnline,
    };
  }, [event]);

export default useEventVenue;
