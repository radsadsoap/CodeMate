import { HttpError } from '../utils/httpError.js';

export function fieldErrors(zodError) {
    const fields = {};
    for (const issue of zodError.issues) {
        const key = issue.path.join('.') || 'form';
        fields[key] ??= issue.message;
    }
    return fields;
}

export const validate =
    (schema, source = 'body') =>
    (req, res, next) => {
        const result = schema.safeParse(req[source] ?? {});
        if (!result.success) {
            const fields = fieldErrors(result.error);
            throw new HttpError(400, Object.values(fields)[0], fields);
        }
        req.valid = { ...req.valid, [source]: result.data };
        next();
    };
