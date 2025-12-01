import { coalesceString, normalizeString } from './activityHelpers';

const MAP_VENUE_TYPES = new Set(['Residence', 'CommunityVenue']);

export const selectPrimaryVenue = (venues) => {
  if (!Array.isArray(venues) || venues.length === 0) return null;
  const priority = ['Residence', 'CommunityVenue'];
  for (const type of priority) {
    const match = venues.find(venue => venue?.type === type);
    if (match) return match;
  }
  const fallback = venues.find(venue => MAP_VENUE_TYPES.has(venue?.type) || Boolean(venue?.address));
  return fallback || venues[0] || null;
};

export const normalizeVenueEntry = (entry) => {
  if (!entry) return null;
  if (typeof entry === 'string') return null;
  if (entry.venue) return normalizeVenueEntry(entry.venue);
  if (entry.venueDetails) return normalizeVenueEntry(entry.venueDetails);
  return entry;
};

export const formatAddress = (address) => {
  if (!address || typeof address !== 'object') return '';
  const parts = [
    address.streetAddress,
    address.suburb,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ];
  return parts
    .map(part => (typeof part === 'string' ? part.trim() : ''))
    .filter(part => part.length > 0)
    .join(', ');
};

const coerceCoordinates = (value) => {
  const makePoint = (lat, lng) => {
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
    return null;
  };

  if (!value) return null;
  if (Array.isArray(value) && value.length >= 2) {
    const [lng, lat] = value;
    return makePoint(lat, lng);
  }
  if (typeof value === 'object') {
    if ('latitude' in value || 'longitude' in value) {
      return makePoint(value.latitude ?? value.lat, value.longitude ?? value.lng);
    }
    if ('lat' in value || 'lng' in value) {
      return makePoint(value.lat, value.lng);
    }
    if (Array.isArray(value.coordinates) && value.coordinates.length >= 2) {
      const [lng, lat] = value.coordinates;
      return makePoint(lat, lng);
    }
  }
  return null;
};

export const getVenueCoordinates = (venue) => {
  if (!venue || typeof venue !== 'object') return null;
  return (
    coerceCoordinates(venue.coordinates) ||
    coerceCoordinates(venue.location) ||
    coerceCoordinates(venue.address?.coordinates) ||
    coerceCoordinates(venue.address?.location) ||
    null
  );
};

export const getStreetAndSuburb = (address) => {
  if (!address || typeof address !== 'object') return '';
  const parts = [address.streetAddress, address.suburb]
    .map(part => (typeof part === 'string' ? part.trim() : ''))
    .filter(part => part.length > 0);
  if (parts.length > 0) return parts.join(', ');
  return formatAddress(address);
};

export const isOnlineVenue = (venue) => {
  if (!venue || typeof venue !== 'object') return false;
  const type = normalizeString(venue.type).toLowerCase();
  if (type === 'online') return true;
  return normalizeString(venue.onlineLink).length > 0;
};

export const hasPhysicalVenueData = (venue) => {
  if (!venue || typeof venue !== 'object') return false;
  if (isOnlineVenue(venue)) return false;
  const hasAddress = formatAddress(venue.address).length > 0;
  return hasAddress || Boolean(getVenueCoordinates(venue));
};

export const mapDisplayAddress = (activity = {}, session = {}) =>
  coalesceString(
    formatAddress(session.address),
    getStreetAndSuburb(session.address),
    formatAddress(activity.address),
    getStreetAndSuburb(activity.address),
  );
