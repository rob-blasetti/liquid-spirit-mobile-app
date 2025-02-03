import io from 'socket.io-client';

export const initializeSocket = () => {
  const socket = io(import.meta.env.VITE_API_URL);
  return socket;
};

export const subscribeToPostUpdates = (socket, callback) => {
  socket.on('post-updated', callback);
  socket.on('comment-added', callback);
  socket.on('like-updated', callback);
};

export const disconnectSocket = (socket) => {
  if (socket) {
    socket.disconnect();
  }
};
