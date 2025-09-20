import io from 'socket.io-client';
import { API_URL } from '../config';

let socketInstance;

const getBaseUrl = () => {
  const base = API_URL || '';
  return base.endsWith('/') ? base.slice(0, -1) : base;
};

export const initializeSocket = () => {
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  const url = getBaseUrl();
  if (!url) {
    console.warn('[SocketService] API_URL is not configured; socket not initialized');
    return null;
  }

  if (socketInstance && socketInstance.connecting) {
    return socketInstance;
  }

  socketInstance = io(url, {
    transports: ['websocket'],
  });

  socketInstance.on('disconnect', () => {
    socketInstance = null;
  });

  return socketInstance;
};

export const subscribeToPostUpdates = (socket, callback) => {
  if (!socket || typeof callback !== 'function') return () => {};

  const events = ['post-updated', 'comment-added', 'like-updated'];

  events.forEach(event => {
    socket.off(event, callback);
    socket.on(event, callback);
  });

  return () => {
    events.forEach(event => socket.off(event, callback));
  };
};

export const disconnectSocket = (socket) => {
  const instance = socket || socketInstance;
  if (instance) {
    instance.removeAllListeners?.();
    instance.disconnect();
  }
  if (!socket || socket === socketInstance) {
    socketInstance = null;
  }
};
