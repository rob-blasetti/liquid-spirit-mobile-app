import io from 'socket.io-client';
import { API_URL } from '../config';

let socketInstance;
let activeAuthToken = null;

const getBaseUrl = () => {
  const base = API_URL || '';
  return base.endsWith('/') ? base.slice(0, -1) : base;
};

const applyAuthPayload = (socket, token) => {
  if (!socket || token === undefined) return;
  activeAuthToken = token || null;

  if (token) {
    socket.auth = { ...(socket.auth || {}), token };
    if (socket.io?.opts) {
      socket.io.opts.extraHeaders = {
        ...(socket.io.opts.extraHeaders || {}),
        Authorization: `Bearer ${token}`,
      };
    }
    return;
  }

  if (socket.io?.opts?.extraHeaders?.Authorization) {
    const nextHeaders = { ...socket.io.opts.extraHeaders };
    delete nextHeaders.Authorization;
    socket.io.opts.extraHeaders = nextHeaders;
  }
  socket.auth = { ...(socket.auth || {}) };
};

const buildChatRoomPayload = (chatId, token) => {
  const id = chatId == null ? '' : String(chatId);
  return {
    id,
    chatId: id,
    chat_id: id,
    chatID: id,
    roomId: id,
    room_id: id,
    conversationId: id,
    conversation_id: id,
    ...(token ? { token } : {}),
  };
};

const emitChatRoomEvent = (socket, events, payload) => {
  events.forEach((event) => {
    socket.emit(event, payload);
  });
};

export const initializeSocket = ({ token } = {}) => {
  if (socketInstance) {
    if (token && token !== activeAuthToken) {
      applyAuthPayload(socketInstance, token);
    }
    if (socketInstance.connected || socketInstance.connecting) {
      return socketInstance;
    }
  }

  const url = getBaseUrl();
  if (!url) {
    console.warn('[SocketService] API_URL is not configured; socket not initialized');
    return null;
  }

  const options = {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    ...(token
      ? {
          auth: { token },
          extraHeaders: { Authorization: `Bearer ${token}` },
        }
      : {}),
  };

  socketInstance = io(url, options);
  activeAuthToken = token || null;

  socketInstance.on('disconnect', () => {
    socketInstance = null;
    activeAuthToken = null;
  });

  socketInstance.on('connect_error', (error) => {
    console.warn('[SocketService] connect_error', error?.message || error);
  });

  return socketInstance;
};

export const subscribeToPostUpdates = (socket, callback) => {
  if (!socket || typeof callback !== 'function') return () => {};

  const events = ['post-updated', 'comment-added', 'like-updated'];

  events.forEach((event) => {
    socket.off(event, callback);
    socket.on(event, callback);
  });

  return () => {
    events.forEach((event) => socket.off(event, callback));
  };
};

const chatJoinEvents = ['join-chat', 'chat:join', 'chat:join-room', 'join-room', 'room:join'];
const chatLeaveEvents = ['leave-chat', 'chat:leave', 'chat:leave-room', 'leave-room', 'room:leave'];

export const joinChatRoom = (socket, chatId, token) => {
  const instance = socket || socketInstance;
  if (!instance || !chatId) return () => {};

  const payload = buildChatRoomPayload(chatId, token);
  const emitJoin = () => emitChatRoomEvent(instance, chatJoinEvents, payload);

  const connectListener = () => emitJoin();
  instance.on('connect', connectListener);

  if (instance.connected) {
    emitJoin();
  }

  return () => {
    instance.off('connect', connectListener);
    emitChatRoomEvent(instance, chatLeaveEvents, payload);
  };
};

export const leaveChatRoom = (socket, chatId, token) => {
  const instance = socket || socketInstance;
  if (!instance || !chatId) return;
  const payload = buildChatRoomPayload(chatId, token);
  emitChatRoomEvent(instance, chatLeaveEvents, payload);
};

export const disconnectSocket = (socket) => {
  const instance = socket || socketInstance;
  if (instance) {
    instance.removeAllListeners?.();
    instance.disconnect();
  }
  if (!socket || socket === socketInstance) {
    socketInstance = null;
    activeAuthToken = null;
  }
};
