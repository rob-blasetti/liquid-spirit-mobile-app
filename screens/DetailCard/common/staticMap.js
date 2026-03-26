const DEFAULT_ZOOM = 15;
const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 600;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toNumber = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const buildStaticMapUrl = ({
  latitude,
  longitude,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  zoom = DEFAULT_ZOOM,
} = {}) => {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);

  if (lat === null || lng === null) {
    return '';
  }

  const safeWidth = clamp(Math.round(width), 200, 1280);
  const safeHeight = clamp(Math.round(height), 120, 1280);
  const safeZoom = clamp(Math.round(zoom), 1, 18);
  const center = `${lat},${lng}`;
  const marker = `${lat},${lng},red-pushpin`;

  return `https://staticmap.openstreetmap.de/staticmap.php?center=${encodeURIComponent(center)}&zoom=${safeZoom}&size=${safeWidth}x${safeHeight}&markers=${encodeURIComponent(marker)}`;
};

export default buildStaticMapUrl;
