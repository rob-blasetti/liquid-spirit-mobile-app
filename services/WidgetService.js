import { NativeModules, Platform } from 'react-native';

const widgetBridge = NativeModules.LiquidSpiritWidget;

const coalesceString = (...values) => {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return '';
};

const formatAddressLike = address => {
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
    fallbackParts,
    address.name,
    address.address,
    address.formatted,
    address.formattedAddress,
  );
};

const resolveEventLocation = event => {
  const venueNameFromArray = Array.isArray(event?.venues)
    ? event.venues
        .map(venue =>
          typeof venue === 'object'
            ? venue?.name || venue?.title || venue?.label || venue?.venueName
            : '',
        )
        .find(name => typeof name === 'string' && name.trim().length > 0)
    : '';

  const venueAddressFromArray = Array.isArray(event?.venues)
    ? event.venues
        .map(venue =>
          typeof venue === 'object'
            ? formatAddressLike(venue?.address || venue?.location || venue)
            : '',
        )
        .find(address => address.length > 0)
    : '';

  const isOnline =
    event?.locationMode === 'online' ||
    event?.locationMode === 'both' ||
    Boolean(event?.onlineLink);

  return coalesceString(
    venueNameFromArray,
    event?.venueName,
    event?.venue,
    venueAddressFromArray,
    formatAddressLike(event?.address),
    event?.address?.name,
    event?.address?.address,
    event?.location,
    isOnline ? 'Online' : 'Location TBD',
  );
};

const parseDateCandidate = value => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const applyTimeToDate = (date, timeValue) => {
  if (!date || !timeValue) return date;

  const parsedTime = parseDateCandidate(timeValue);
  if (parsedTime && parsedTime.getFullYear() !== 1970) {
    return parsedTime;
  }

  const match =
    typeof timeValue === 'string'
      ? timeValue.match(/^(\d{1,2}):(\d{2})(?::\d{2})?/)
      : null;
  if (!match) return date;

  const combined = new Date(date);
  combined.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return combined;
};

const resolveEventDate = event => {
  const baseDate = parseDateCandidate(event?.date);
  const startTimeDate = parseDateCandidate(event?.startTime);

  if (startTimeDate && startTimeDate.getFullYear() !== 1970) {
    return startTimeDate;
  }

  return applyTimeToDate(baseDate, event?.startTime);
};

const formatEventTime = event => {
  const startDate = resolveEventDate(event);
  if (!startDate) return 'Time TBD';

  const startText = startDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return startText;
};

const buildWidgetPayload = event => {
  const date = resolveEventDate(event);
  if (!date) return null;

  return {
    title: event?.title || event?.name || 'Community event',
    dateText: date.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
    }),
    dayText: date.toLocaleDateString(undefined, { weekday: 'long' }),
    timeText: formatEventTime(event),
    locationText: resolveEventLocation(event),
    startTimestamp: date.getTime(),
    updatedAt: Date.now(),
  };
};

const findNextEvent = events => {
  if (!Array.isArray(events)) return null;
  const now = Date.now();

  return events
    .map(event => ({ event, date: resolveEventDate(event) }))
    .filter(({ date }) => date && date.getTime() >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0]?.event || null;
};

export const syncNextEventWidget = async ({ isLoggedIn, events }) => {
  if (Platform.OS !== 'ios' || !widgetBridge) return;

  if (!isLoggedIn) {
    await widgetBridge.clear();
    return;
  }

  if (events == null) return;

  const nextEvent = findNextEvent(events);
  const payload = nextEvent
    ? buildWidgetPayload(nextEvent)
    : {
        title: 'No upcoming events',
        dateText: '',
        dayText: '',
        timeText: '',
        locationText: 'Check back soon',
        startTimestamp: 0,
        updatedAt: Date.now(),
        isPlaceholder: true,
      };

  if (payload) {
    await widgetBridge.updateNextEvent(payload);
  }
};
