import { coalesceString } from './activityHelpers';

const makePoint = (lat, lng) => {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { latitude, longitude };
  }
  return null;
};

export const normalizeAddress = (address) => {
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

export const getStreetAndSuburb = (address) => {
  if (!address || typeof address !== 'object') return '';
  const parts = [address.streetAddress, address.suburb]
    .map(part => (typeof part === 'string' ? part.trim() : ''))
    .filter(part => part.length > 0);
  if (parts.length > 0) return parts.join(', ');
  return normalizeAddress(address);
};

export const resolveCoordinates = (value) => {
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
    if (Array.isArray(value.location) && value.location.length >= 2) {
      const [lng, lat] = value.location;
      return makePoint(lat, lng);
    }
  }
  return null;
};

export const getRegionForMap = (addressLike) => {
  if (!addressLike || typeof addressLike !== 'object') return null;
  const point = resolveCoordinates(addressLike.coordinates || addressLike.location || addressLike);
  if (!point) return null;
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };
};

export const getDisplayAddress = ({ sessionAddress, activityAddress } = {}) =>
  coalesceString(
    normalizeAddress(sessionAddress),
    getStreetAndSuburb(sessionAddress),
    normalizeAddress(activityAddress),
    getStreetAndSuburb(activityAddress),
  );

