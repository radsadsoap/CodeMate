import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const schema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    MONGO_URI: z.string().min(1, 'is required'),
    MONGO_DB_NAME: z.string().min(1).default('codemate'),
    JWT_SECRET: z.string().min(32, 'must be at least 32 characters'),
    CLIENT_ORIGIN: z.string().min(1).default('http://localhost:5173'),
    TURN_URLS: z.string().optional(),
    TURN_USERNAME: z.string().optional(),
    TURN_CREDENTIAL: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
    const problems = parsed.error.issues
        .map((issue) => `  - ${issue.path.join('.')} ${issue.message}`)
        .join('\n');
    console.error(`Invalid server environment. Check server/.env:\n${problems}`);
    process.exit(1);
}

const values = parsed.data;

const splitList = (value) =>
    (value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

export const env = Object.freeze({
    ...values,
    isProduction: values.NODE_ENV === 'production',
    clientOrigins: splitList(values.CLIENT_ORIGIN),
    turnUrls: splitList(values.TURN_URLS),
});
