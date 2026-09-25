import http from "node:http";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import {
    connectDatabase,
    disconnectDatabase,
    isDatabaseReady,
} from "./config/db.js";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middlewares/error.js";
import { apiLimiter } from "./middlewares/rateLimit.js";
import { persistAllRooms } from "./realtime/rooms.js";
import { createSocketServer } from "./realtime/socket.js";
import authRoutes from "./routes/authRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";

const app = express();

// Render, Railway and the Vercel/Netlify rewrite each add exactly one proxy hop.
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.clientOrigins, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
    const database = isDatabaseReady() ? "up" : "down";
    res.status(database === "up" ? 200 : 503).json({ status: "ok", database });
});

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
const io = createSocketServer(server);

let shuttingDown = false;

async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.info(`${signal} received: saving open sessions before exit.`);

    const forceExit = setTimeout(() => process.exit(1), 10_000);
    forceExit.unref();

    try {
        await persistAllRooms();
        await new Promise((resolve) => io.close(() => resolve()));
        await disconnectDatabase();
        process.exit(0);
    } catch (error) {
        console.error("Shutdown failed:", error);
        process.exit(1);
    }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

try {
    await connectDatabase();
    server.listen(env.PORT, () => {
        console.info(`CodeMate API listening on http://localhost:${env.PORT}`);
    });
} catch (error) {
    console.error(`Could not start the server: ${error.message}`);
    process.exit(1);
}
