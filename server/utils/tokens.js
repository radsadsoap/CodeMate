import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const SOCKET_TTL_SECONDS = 60;

export const AUTH_COOKIE = 'codemate_session';

export const authCookieOptions = Object.freeze({
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS * 1000,
});

export function signSessionToken(userId) {
    return jwt.sign({ sub: String(userId) }, env.JWT_SECRET, {
        expiresIn: SESSION_TTL_SECONDS,
        audience: 'api',
    });
}

// Socket.IO connects straight to the API host, where the first-party session cookie is not sent.
export function signSocketToken(userId) {
    return jwt.sign({ sub: String(userId) }, env.JWT_SECRET, {
        expiresIn: SOCKET_TTL_SECONDS,
        audience: 'socket',
    });
}

export function verifyToken(token, audience) {
    return jwt.verify(token, env.JWT_SECRET, { audience, algorithms: ['HS256'] });
}
