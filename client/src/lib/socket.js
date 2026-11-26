import { io } from 'socket.io-client';

let socket = null;

// One authenticated socket per session. Leave VITE_SOCKET_URL empty in dev (uses the Vite proxy).
export function connectSocket(token) {
  if (socket) socket.disconnect();
  socket = io(import.meta.env.VITE_SOCKET_URL || undefined, { auth: { token } });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
  socket = null;
}
