import { io } from 'socket.io-client';
import { api } from './api';

// In development the socket shares the page origin through the Vite proxy.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;

export function createSocket() {
    return io(SOCKET_URL, {
        autoConnect: false,
        transports: ['websocket', 'polling'],
        // Called before every connection attempt, so reconnects always carry a fresh token.
        auth: (send) => {
            api.socketToken()
                .then(({ token }) => send({ token }))
                .catch(() => send({}));
        },
    });
}
