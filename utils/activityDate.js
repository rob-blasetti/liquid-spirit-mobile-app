export const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const MIDNIGHT_UTC_REGEX = /T00:00(?::00(?:\.000)?)?Z$/;

export const parseGroupTime = (timeStr) => {
  if (typeof timeStr !== 'string') {
    return { hasTime: false, hours: 0, minutes: 0 };
  }
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr ?? 0);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return { hasTime: false, hours: 0, minutes: 0 };
  }
  return { hasTime: true, hours, minutes };
};

export const normalizeActivityDate = (dateStr, fallbackTime) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const { hasTime, hours, minutes } = parseGroupTime(fallbackTime);

  if (DATE_ONLY_REGEX.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, hasTime ? hours : 0, hasTime ? minutes : 0);
  }

  const parsed = new Date(dateStr);
  if (isNaN(parsed)) return null;

  if (MIDNIGHT_UTC_REGEX.test(dateStr)) {
    return new Date(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate(),
      hasTime ? hours : 0,
      hasTime ? minutes : 0,
    );
  }

  return parsed;
};

export const resolveSessionDate = (session, activity) => {
  if (!session) return null;
  const dateSource = [
    session.date,
    session.startTime,
    session.scheduledAt,
    session.datetime,
  ].find(value => typeof value === 'string' && value.length > 0);
  if (!dateSource) return null;
  const fallbackTime = session.time || session.groupDetails?.time || activity?.groupDetails?.time;
  return normalizeActivityDate(dateSource, fallbackTime);
};

export const getNextSessionDate = (activity) => {
  if (!activity || !Array.isArray(activity.sessions)) return null;
  const now = new Date();
  const future = activity.sessions
    .filter(session => ['Scheduled', 'Confirmed'].includes(session.status))
    .map(session => resolveSessionDate(session, activity))
    .filter(date => date instanceof Date && !isNaN(date) && date >= now)
    .sort((a, b) => a - b);
  return future[0] || null;
};

export const getEffectiveNextDate = (activity) => {
  const nextSession = getNextSessionDate(activity);
  if (nextSession) return nextSession;

  const dateSource = [
    activity?.date,
    activity?.startTime,
    activity?.scheduledAt,
  ].find(value => typeof value === 'string' && value.length > 0);
  if (!dateSource) return null;

  return normalizeActivityDate(dateSource, activity?.groupDetails?.time);
};
