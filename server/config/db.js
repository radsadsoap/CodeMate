import mongoose from "mongoose";
import { env } from "./env.js";

mongoose.set("strictQuery", true);
// Strips `$`-prefixed operators from filter objects built from user input.
mongoose.set("sanitizeFilter", true);

export async function connectDatabase() {
    await mongoose.connect(env.MONGO_URI, {
        dbName: env.MONGO_DB_NAME,
        serverSelectionTimeoutMS: 15_000,
    });
    console.info(
        `MongoDB connected to "${mongoose.connection.name}" on ${mongoose.connection.host}`,
    );
}

export function disconnectDatabase() {
    return mongoose.disconnect();
}

export function isDatabaseReady() {
    return mongoose.connection.readyState === 1;
}
