import rateLimit from 'express-rate-limit';

const limiter = (options) =>
    rateLimit({
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        ...options,
        message: { error: { message: options.message } },
    });

export const loginLimiter = limiter({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    message: 'Too many failed sign-in attempts. Wait 15 minutes and try again.',
});

export const registerLimiter = limiter({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    // Only accounts that were actually created count; typos and validation errors do not.
    skipFailedRequests: true,
    message: 'Too many accounts created from this network. Try again later.',
});

export const apiLimiter = limiter({
    windowMs: 60 * 1000,
    limit: 300,
    message: 'Too many requests. Slow down and try again in a minute.',
});
