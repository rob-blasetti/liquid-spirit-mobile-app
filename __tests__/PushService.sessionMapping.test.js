jest.mock('react-native-config', () => ({ PROD_API: 'https://api.test' }));
jest.mock('../navigation/RootNavigation', () => ({ navigate: jest.fn() }));

describe('normalizePayload session mapping', () => {
  let normalizePayload;
  beforeAll(() => {
    ({ normalizePayload } = require('../services/PushService'));
  });

  test('session_created maps to activity and prefers activityId', () => {
    const payload = {
      data: {
        type: 'session_created',
        id: 'session-123',
        activityId: 'activity-abc',
      },
    };
    const res = normalizePayload(payload);
    expect(res).toEqual({ type: 'activity', id: 'activity-abc' });
  });

  test('SESSION_REMINDER (case-insensitive) maps via nested activity._id', () => {
    const payload = {
      data: {
        type: 'SESSION_REMINDER',
        targetId: 'session-999',
        activity: { _id: 'activity-nested' },
      },
    };
    const res = normalizePayload(payload);
    expect(res).toEqual({ type: 'activity', id: 'activity-nested' });
  });

  test('session_cancelled falls back to parentActivityId', () => {
    const payload = {
      custom: {
        typeName: 'session_cancelled',
        parentActivityId: 'activity-parent',
      },
    };
    const res = normalizePayload(payload);
    expect(res).toEqual({ type: 'activity', id: 'activity-parent' });
  });

  test('chat_group_message maps to chat detail payload', () => {
    const payload = {
      chatId: 'chat-789',
      deeplink: {
        screen: 'ChatDetail',
        params: {
          chatId: 'chat-789',
        },
      },
    };
    const res = normalizePayload(payload);
    expect(res).toEqual({
      type: 'chat',
      id: 'chat-789',
      params: { chatId: 'chat-789' },
    });
  });

  test('activity deeplink maps to activity and preserves session anchor', () => {
    const payload = {
      deeplink: {
        screen: 'ActivityDetail',
        params: {
          activityId: 'activity-abc',
          sessionId: 'session-123',
        },
      },
      threadId: 'session-123',
    };
    const res = normalizePayload(payload);
    expect(res).toEqual({
      type: 'activity',
      id: 'activity-abc',
      params: { initialSessionId: 'session-123' },
    });
  });
});
