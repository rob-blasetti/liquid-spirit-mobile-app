const CHAT_TYPE_KEYS = new Set([
  'chat_direct_message',
  'chat_group_message',
]);

const normalizeTypeName = (value = '') => value.toString().trim().toLowerCase();

const normalizeIdValue = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    const trimmed = String(value).trim();
    return trimmed.length ? trimmed : '';
  }
  if (typeof value === 'object') {
    return (
      normalizeIdValue(value._id) ||
      normalizeIdValue(value.id) ||
      ''
    );
  }
  return '';
};

export const isChatNotificationType = (typeName = '') => CHAT_TYPE_KEYS.has(normalizeTypeName(typeName));

export const extractChatNavigationParams = (payload, { fallbackTypeName = '' } = {}) => {
  if (!payload || typeof payload !== 'object') return null;

  const typeName =
    payload.type?.typeName ||
    payload.type ||
    payload.rawType ||
    payload.data?.type ||
    payload.data?.typeName ||
    fallbackTypeName;

  if (!isChatNotificationType(typeName)) {
    return null;
  }

  const chatId =
    normalizeIdValue(payload.chatId) ||
    normalizeIdValue(payload.targetId) ||
    normalizeIdValue(payload.target?._id) ||
    normalizeIdValue(payload.target?.id) ||
    normalizeIdValue(payload.additionalData?.chatId) ||
    normalizeIdValue(payload.data?.chatId) ||
    normalizeIdValue(payload.deeplink?.params?.chatId) ||
    normalizeIdValue(payload.data?.deeplink?.params?.chatId);

  if (!chatId) return null;
  return { chatId };
};
