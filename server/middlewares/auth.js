import { User } from '../models/user.js';
import { HttpError } from '../utils/httpError.js';
import { AUTH_COOKIE, verifyToken } from '../utils/tokens.js';

async function userFromCookie(req) {
    const token = req.cookies?.[AUTH_COOKIE];
    if (!token) return { user: null, reason: 'Sign in to continue.' };

    let payload;
    try {
        payload = verifyToken(token, 'api');
    } catch {
        return { user: null, reason: 'Your sign-in expired. Sign in again.' };
    }

    const user = await User.findById(payload.sub);
    return { user, reason: user ? null : 'This account no longer exists.' };
}

export async function requireAuth(req, res, next) {
    const { user, reason } = await userFromCookie(req);
    if (!user) throw new HttpError(401, reason);
    req.user = user;
    next();
}

// For endpoints that answer differently for signed-out visitors instead of rejecting them.
export async function optionalAuth(req, res, next) {
    req.user = (await userFromCookie(req)).user;
    next();
}

export const requireRole = (role, message) => (req, res, next) => {
    if (req.user.role !== role) throw new HttpError(403, message);
    next();
};
