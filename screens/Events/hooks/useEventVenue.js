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

const getString = (value) => (typeof value === 'string' ? value.trim() : '');

const asAddressObject = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  return null;
};

const pickEventAddress = (event = {}) => {
  const venueObjects = Array.isArray(event.venues)
    ? event.venues.filter((venue) => typeof venue === 'object')
    : [];

  const venueAddress = venueObjects
    .map((venue) => venue?.address)
    .find((address) => getDisplayAddress({ sessionAddress: address }).length > 0)
    || asAddressObject(event.address);

  const venueName = venueObjects
    .map((venue) => venue?.name || venue?.title || venue?.label)
    .find((name) => typeof name === 'string' && name.trim().length > 0)
    || event.venueName
    || event.venue
    || getString(event.locationName);

  const addressString = getString(event.address);

  return coalesceString(
    venueName,
    getDisplayAddress({ sessionAddress: venueAddress }),
    venueAddress?.name,
    addressString,
    venueAddress?.label,
    getString(event.location),
    event.locationName || event.locationAddress,
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
