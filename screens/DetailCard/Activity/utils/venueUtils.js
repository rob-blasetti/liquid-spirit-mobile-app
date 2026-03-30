import { normalizeString } from './activityHelpers';
import {
  getDisplayAddress as getDisplayAddressFromLocation,
  getStreetAndSuburb as getStreetAndSuburbFromLocation,
  normalizeAddress,
  resolveCoordinates,
} from './locationUtils';

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
  return normalizeAddress(address);
};

export const getVenueCoordinates = (venue) => {
  if (!venue || typeof venue !== 'object') return null;
  return (
    resolveCoordinates(venue.coordinates) ||
    resolveCoordinates(venue.location) ||
    resolveCoordinates(venue.address?.coordinates) ||
    resolveCoordinates(venue.address?.location) ||
    null
  );
};

export const getStreetAndSuburb = (address) => {
  return getStreetAndSuburbFromLocation(address);
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
  getDisplayAddressFromLocation({
    sessionAddress: session.address,
    activityAddress: activity.address,
  });
