import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { checkDbConnection } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import { asyncHandler } from "./utils/asyncHandler.js";

export const app = express();

// 03-security-architecture.md §6.1 -- exactly one trusted origin per environment, never a
// wildcard; credentials required for the httpOnly refresh-token cookie to be sent at all.
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  })
);
app.use(express.json());
app.use(cookieParser());

// 02-api-contract.md §0.4 -- public, no auth required, reachable by external monitors.
app.get(
  "/health",
  asyncHandler(async (_req, res) => {
    const isConnected = await checkDbConnection();
    if (!isConnected) {
      return res.status(503).json({ status: "unavailable" });
    }
    return res.status(200).json({ status: "ok" });
  })
);

// Resource routes mount here as each is built (auth/users first, Milestone 1) -- see
// 04-application-architecture.md §7 for the full intended registration order.

app.use(errorHandler); // MUST be registered last (04-application-architecture.md §7)
