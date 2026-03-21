import { io } from 'socket.io-client';

const SOCKET_URL = 'http://172.16.8.162:5000';

let socket;

export const initiateSocketConnection = (token) => {
  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
  });
  console.log('Connecting socket...');
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};
