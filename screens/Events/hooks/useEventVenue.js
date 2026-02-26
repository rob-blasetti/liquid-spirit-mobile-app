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

const formatAddressLike = (address) => {
  if (typeof address === 'string') return address.trim();
  if (!address || typeof address !== 'object') return '';

  const fallbackParts = [
    address.streetAddress,
    address.street,
    address.line1,
    address.suburb,
    address.city,
    address.state,
    address.postalCode,
    address.zip,
    address.country,
  ]
    .map(part => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(', ');

  return coalesceString(
    getDisplayAddress({ sessionAddress: address }),
    fallbackParts,
    address.name,
    address.address,
    address.formatted,
    address.formattedAddress,
  );
};

const pickEventAddress = (event = {}) => {
  const venueNameFromArray = Array.isArray(event.venues)
    ? event.venues
        .map((venue) =>
          typeof venue === 'object'
            ? venue?.name || venue?.title || venue?.label || venue?.venueName
            : ''
        )
        .find((name) => typeof name === 'string' && name.trim().length > 0)
    : '';

  const venueAddressFromArray = Array.isArray(event.venues)
    ? event.venues
        .map((venue) =>
          typeof venue === 'object'
            ? formatAddressLike(venue?.address || venue?.location || venue)
            : ''
        )
        .find((address) => address.length > 0)
    : '';

  const eventAddress = formatAddressLike(event.address);

  return coalesceString(
    venueNameFromArray,
    event.venueName,
    event.venue,
    venueAddressFromArray,
    eventAddress,
    event.address?.name,
    event.address?.address,
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
