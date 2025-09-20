import {
  parseGroupTime,
  normalizeActivityDate,
  resolveSessionDate,
  getNextSessionDate,
  getEffectiveNextDate,
} from '../utils/activityDate';

describe('parseGroupTime', () => {
  it('parses valid HH:MM strings', () => {
    expect(parseGroupTime('07:30')).toEqual({ hasTime: true, hours: 7, minutes: 30 });
  });

  it('assumes zero minutes when only hours are provided', () => {
    expect(parseGroupTime('09')).toEqual({ hasTime: true, hours: 9, minutes: 0 });
  });

  it('returns a disabled state for non-numeric input', () => {
    expect(parseGroupTime('09:ab')).toEqual({ hasTime: false, hours: 0, minutes: 0 });
  });

  it('returns a disabled state when the value is not a string', () => {
    expect(parseGroupTime(null)).toEqual({ hasTime: false, hours: 0, minutes: 0 });
  });
});

describe('normalizeActivityDate', () => {
  it('constructs a local date when given a date-only string', () => {
    const result = normalizeActivityDate('2024-02-10', '08:15');

    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(10);
    expect(result.getHours()).toBe(8);
    expect(result.getMinutes()).toBe(15);
  });

  it('applies fallback time when the input is a midnight UTC string', () => {
    const result = normalizeActivityDate('2024-02-10T00:00:00Z', '05:30');

    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(10);
    expect(result.getHours()).toBe(5);
    expect(result.getMinutes()).toBe(30);
  });

  it('returns null for invalid dates', () => {
    expect(normalizeActivityDate('not-a-date', '08:00')).toBeNull();
  });
});

describe('resolveSessionDate', () => {
  it('uses the session date and time when provided', () => {
    const session = { date: '2024-03-05', time: '13:45' };

    const result = resolveSessionDate(session);

    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(5);
    expect(result.getHours()).toBe(13);
    expect(result.getMinutes()).toBe(45);
  });

  it('falls back to the activity group time when session time is missing', () => {
    const session = { scheduledAt: '2024-03-06T00:00:00Z' };
    const activity = { groupDetails: { time: '09:00' } };

    const result = resolveSessionDate(session, activity);

    expect(result).toBeInstanceOf(Date);
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(0);
  });

  it('returns null when no string fields are available', () => {
    expect(resolveSessionDate({})).toBeNull();
  });
});

describe('getNextSessionDate', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the soonest future scheduled or confirmed session', () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-01T10:00:00Z'));

    const activity = {
      sessions: [
        { status: 'Scheduled', scheduledAt: '2024-04-25T10:00:00Z' },
        { status: 'Draft', scheduledAt: '2024-05-03T10:00:00Z' },
        { status: 'Confirmed', scheduledAt: '2024-05-02T12:00:00Z' },
        { status: 'Scheduled', scheduledAt: '2024-05-04T09:00:00Z' },
      ],
    };

    const result = getNextSessionDate(activity);

    expect(result?.toISOString()).toBe('2024-05-02T12:00:00.000Z');
  });

  it('returns null when no future sessions are available', () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-10T10:00:00Z'));

    const activity = {
      sessions: [{ status: 'Scheduled', scheduledAt: '2024-05-01T12:00:00Z' }],
    };

    expect(getNextSessionDate(activity)).toBeNull();
  });
});

describe('getEffectiveNextDate', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the next session date when one exists', () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-01T10:00:00Z'));

    const activity = {
      sessions: [{ status: 'Scheduled', scheduledAt: '2024-05-02T12:00:00Z' }],
    };

    expect(getEffectiveNextDate(activity)?.toISOString()).toBe('2024-05-02T12:00:00.000Z');
  });

  it('falls back to the activity level date and time', () => {
    const activity = {
      sessions: [],
      date: '2024-06-01',
      groupDetails: { time: '07:00' },
    };

    const result = getEffectiveNextDate(activity);

    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(1);
    expect(result.getHours()).toBe(7);
    expect(result.getMinutes()).toBe(0);
  });

  it('returns null when neither sessions nor activity metadata can be used', () => {
    expect(getEffectiveNextDate({ sessions: [] })).toBeNull();
  });
});
