import bcrypt from 'bcrypt';
import { z } from 'zod';
import { User } from '../models/user.js';
import { ROLES } from '../utils/constants.js';
import { HttpError } from '../utils/httpError.js';
import { AUTH_COOKIE, authCookieOptions, signSessionToken, signSocketToken } from '../utils/tokens.js';

const BCRYPT_COST = 12;

const email = z
    .string({ error: 'Enter your email address.' })
    .trim()
    .toLowerCase()
    .max(254, 'That email address is too long.')
    .pipe(z.email({ error: 'Enter a valid email address, like name@school.edu.' }));

export const registerSchema = z.object({
    name: z
        .string({ error: 'Enter your name.' })
        .trim()
        .min(2, 'Enter at least 2 characters for your name.')
        .max(60, 'Keep your name under 60 characters.'),
    email,
    password: z
        .string({ error: 'Create a password.' })
        .min(8, 'Use at least 8 characters.')
        // bcrypt silently ignores everything after 72 bytes.
        .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Use at most 72 characters.'),
    role: z.enum([ROLES.STUDENT, ROLES.TA], { error: 'Choose Student or Teaching assistant.' }),
});

export const loginSchema = z.object({
    email,
    password: z.string({ error: 'Enter your password.' }).min(1, 'Enter your password.'),
});

// Compared against when the email is unknown so both failure paths take the same time.
const timingGuardHash = bcrypt.hashSync('codemate-timing-guard', BCRYPT_COST);

function startSession(res, user) {
    res.cookie(AUTH_COOKIE, signSessionToken(user.id), authCookieOptions);
}

export async function register(req, res) {
    const { name, email: address, password, role } = req.valid.body;

    if (await User.exists({ email: address })) {
        throw new HttpError(409, 'An account with this email already exists. Sign in instead.', {
            email: 'An account with this email already exists.',
        });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    let user;
    try {
        user = await User.create({ name, email: address, passwordHash, role });
    } catch (error) {
        if (error?.code === 11000) {
            throw new HttpError(409, 'An account with this email already exists. Sign in instead.', {
                email: 'An account with this email already exists.',
            });
        }
        throw error;
    }

    startSession(res, user);
    res.status(201).json({ user: user.toPublic() });
}

export async function login(req, res) {
    const { email: address, password } = req.valid.body;
    const user = await User.findOne({ email: address }).select('+passwordHash');
    const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? timingGuardHash);

    if (!user || !passwordMatches) {
        throw new HttpError(401, 'Email or password is incorrect.');
    }

    startSession(res, user);
    res.json({ user: user.toPublic() });
}

export function logout(req, res) {
    const { maxAge, ...cookieOptions } = authCookieOptions;
    res.clearCookie(AUTH_COOKIE, cookieOptions);
    res.status(204).end();
}

export function me(req, res) {
    res.set('Cache-Control', 'no-store');
    res.json({ user: req.user ? req.user.toPublic() : null });
}

export function socketToken(req, res) {
    res.set('Cache-Control', 'no-store');
    res.json({ token: signSocketToken(req.user.id) });
}
