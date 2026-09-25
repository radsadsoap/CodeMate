import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { User } from '../models/user.js';
import { verifyToken } from '../utils/tokens.js';
import { registerHandlers } from './handlers.js';
import { attachIo } from './rooms.js';

async function authenticate(socket, next) {
    try {
        const { token } = socket.handshake.auth ?? {};
        if (typeof token !== 'string') throw new Error('missing token');

        const { sub } = verifyToken(token, 'socket');
        const user = await User.findById(sub).lean();
        if (!user) throw new Error('unknown user');

        socket.data.user = { id: String(user._id), name: user.name, role: user.role };
        next();
    } catch {
        next(new Error('unauthorized'));
    }
}

export function createSocketServer(httpServer) {
    const io = new Server(httpServer, {
        cors: { origin: env.clientOrigins, credentials: true },
        maxHttpBufferSize: 1_000_000,
        pingInterval: 20_000,
        pingTimeout: 20_000,
    });

    attachIo(io);
    io.use(authenticate);
    io.on('connection', (socket) => registerHandlers(io, socket));
    return io;
}
