import { HttpError } from '../utils/httpError.js';

export function notFound(req, res, next) {
    next(new HttpError(404, `No route for ${req.method} ${req.originalUrl}.`));
}

// Express recognises error handlers by their four-argument signature.
export function errorHandler(error, req, res, next) {
    if (error instanceof HttpError) {
        return res.status(error.status).json({
            error: { message: error.message, ...(error.fields && { fields: error.fields }) },
        });
    }

    if (error?.type === 'entity.parse.failed') {
        return res.status(400).json({ error: { message: 'The request body is not valid JSON.' } });
    }

    if (error?.type === 'entity.too.large') {
        return res.status(413).json({ error: { message: 'The request body is too large.' } });
    }

    console.error(`[${req.method} ${req.originalUrl}]`, error);
    return res
        .status(500)
        .json({ error: { message: 'Something went wrong on our side. Try again in a moment.' } });
}
