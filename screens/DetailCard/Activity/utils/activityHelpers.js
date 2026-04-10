export const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

export const coalesceString = (...values) => {
  for (const value of values) {
    const trimmed = normalizeString(value);
    if (trimmed) {
      return trimmed;
    }
  }
  return '';
};

export const formatTime = (timeValue) => {
  if (!timeValue) return 'N/A';
  const [h, m] = timeValue.split(':');
  const d = new Date();
  d.setHours(+h, +m);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export const formatLongSessionDate = dateValue => {
  if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime?.())) {
    return '';
  }

  return `${dateValue.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })}, ${dateValue.toLocaleDateString(undefined, {
    year: 'numeric',
  })}`;
};

export const resolveActivityImage = (activity = {}) =>
  activity.imageUrl ||
  activity.imageURL ||
  activity.bannerUrl ||
  activity.bannerURL ||
  activity.heroImage ||
  '';
