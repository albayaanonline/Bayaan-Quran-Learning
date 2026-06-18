import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// ── Rate limiting ───────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: (req) => req.path === "/api/healthz",
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI rate limit reached, please wait a moment." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP." },
});

// ── Request logging ─────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res) { return { statusCode: res.statusCode }; },
    },
  }),
);

// ── Clerk proxy ─────────────────────────────────────────────────────────────
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// ── CORS + body parsing ─────────────────────────────────────────────────────
app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Clerk auth middleware ───────────────────────────────────────────────────
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

// ── Apply rate limiters to specific paths ───────────────────────────────────
app.use("/api", generalLimiter);
app.use("/api/teacher", aiLimiter);
app.use("/api/voice-teacher", aiLimiter);
app.use("/api/study-planner", aiLimiter);
app.use("/api/hifdh/ai-coach", aiLimiter);
app.use("/api/exams/:id/evaluate", aiLimiter);

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api", router);

// ── Global error handler ────────────────────────────────────────────────────
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, path: req.path }, "Unhandled error");
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
