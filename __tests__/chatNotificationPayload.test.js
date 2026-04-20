import { extractChatNavigationParams, isChatNotificationType } from '../utils/chatNotificationPayload';

describe('chatNotificationPayload', () => {
  test('recognizes direct and group chat notification types', () => {
    expect(isChatNotificationType('chat_direct_message')).toBe(true);
    expect(isChatNotificationType('chat_group_message')).toBe(true);
    expect(isChatNotificationType('event_reminder')).toBe(false);
  });

  test('extracts chat navigation params from inbox notification payload', () => {
    const payload = {
      type: { typeName: 'chat_direct_message' },
      additionalData: {
        chatId: 'chat-123',
      },
    };

    const result = extractChatNavigationParams(payload, {
      fallbackTypeName: 'chat_direct_message',
    });

    expect(result).toEqual({ chatId: 'chat-123' });
  });

  test('extracts chat navigation params from APNs payload', () => {
    const payload = {
      chatId: 'group-99',
      deeplink: {
        screen: 'ChatDetail',
        params: {
          chatId: 'group-99',
        },
      },
    };

    const result = extractChatNavigationParams(payload, {
      fallbackTypeName: 'chat_group_message',
    });

    expect(result).toEqual({ chatId: 'group-99' });
  });
});
