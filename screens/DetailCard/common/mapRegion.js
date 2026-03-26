const DEFAULT_DELTA = 0.01;

const isFiniteNumber = value => typeof value === 'number' && Number.isFinite(value);

const isValidLatitude = value => isFiniteNumber(value) && value >= -90 && value <= 90;

const isValidLongitude = value => isFiniteNumber(value) && value >= -180 && value <= 180;

const normalizeDelta = value => {
  const parsed = Number(value);
  return isFiniteNumber(parsed) && parsed > 0 ? parsed : DEFAULT_DELTA;
};

export const normalizeMapRegion = region => {
  if (!region || typeof region !== 'object') return null;

  const latitude = Number(region.latitude ?? region.lat);
  const longitude = Number(region.longitude ?? region.lng ?? region.lon);

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
    latitudeDelta: normalizeDelta(region.latitudeDelta),
    longitudeDelta: normalizeDelta(region.longitudeDelta),
  };
};

export const buildMapRegion = coords => {
  if (!coords || typeof coords !== 'object') return null;
  return normalizeMapRegion({
    latitude: coords.latitude ?? coords.lat,
    longitude: coords.longitude ?? coords.lng ?? coords.lon,
    latitudeDelta: coords.latitudeDelta,
    longitudeDelta: coords.longitudeDelta,
  });
};

export const getMarkerCoordinate = region => {
  const normalized = normalizeMapRegion(region);
  if (!normalized) return null;
  return {
    latitude: normalized.latitude,
    longitude: normalized.longitude,
  };
};
