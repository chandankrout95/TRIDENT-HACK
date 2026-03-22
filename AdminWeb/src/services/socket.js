import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket;

export const initiateAdminSocket = () => {
  if (socket) return socket;
  
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Admin socket connected:', socket.id);
    socket.emit('join_admin_room');
  });

  socket.on('disconnect', () => {
    console.log('Admin socket disconnected');
  });

  return socket;
};

export const getAdminSocket = () => socket;

export const disconnectAdminSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = undefined;
  }
};
