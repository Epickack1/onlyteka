// client/src/lib/socket.js
// Единый Socket.IO-клиент для всего приложения.
// Подключаемся к тому же origin, на котором работает фронт — Vite проксирует /socket.io на бэк.

import { io } from 'socket.io-client';

export const socket = io({
    autoConnect: true,
    transports: ['websocket', 'polling']
});

socket.on('connect', () => console.info('[socket] connected:', socket.id));
socket.on('disconnect', (reason) => console.info('[socket] disconnected:', reason));