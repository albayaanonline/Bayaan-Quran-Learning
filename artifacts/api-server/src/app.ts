import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { existsSync } from "fs";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Trust Replit's reverse proxy so rate-limit can identify clients via X-Forwarded-For
app.set("trust proxy", 1);

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
// publishableKeyFromHost derives a Replit-specific pk_live_ key from the
// domain. We should only use it when x-forwarded-host is explicitly set,
// meaning a real user-facing domain is known (e.g. the Replit preview domain
// forwarded by the Vite dev proxy). When x-forwarded-host is absent — which
// happens when Vercel rewrites /api/* to this backend without forwarding the
// header — the Host header is the internal Replit backend hostname, NOT the
// user-facing domain. Deriving a key from that internal hostname would produce
// a pk_live_ key that doesn't match the pk_test_ key the Vercel-hosted
// frontend used → JWT verification fails → 401. In that case fall back to the
// raw CLERK_PUBLISHABLE_KEY (the test key), which matches the fallback the
// frontend computes via publishableKeyFromHost on non-Replit domains.
app.use(
  clerkMiddleware((req) => {
    const xfh = req.headers["x-forwarded-host"];
    const publishableKey = xfh
      ? publishableKeyFromHost(getClerkProxyHost(req) ?? "", process.env.CLERK_PUBLISHABLE_KEY)
      : process.env.CLERK_PUBLISHABLE_KEY;
    return { publishableKey };
  }),
);

// ── Apply rate limiters to specific paths ───────────────────────────────────
app.use("/api", generalLimiter);
app.use("/api/teacher", aiLimiter);
app.use("/api/voice-teacher", aiLimiter);
app.use("/api/study-planner", aiLimiter);
app.use("/api/hifdh/ai-coach", aiLimiter);
app.use("/api/exams/:id/evaluate", aiLimiter);
app.use("/api/video-teacher", aiLimiter);
app.use("/api/content-generator", aiLimiter);
app.use("/api/tts", rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: "TTS rate limit reached." } }));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api", router);

// ── Serve frontend static files in production ─────────────────────────────
// The frontend is built to artifacts/al-bayaan/dist/public/ during deployment.
// __dirname is set to the directory of the bundled api-server output file
// (artifacts/api-server/dist/), so two levels up lands at artifacts/, then
// we go into al-bayaan/dist/public/.
if (process.env.NODE_ENV === "production") {
  const frontendDist = path.resolve(__dirname, "../../al-bayaan/dist/public");
  if (existsSync(frontendDist)) {
    logger.info({ frontendDist }, "Serving frontend static files");
    app.use(express.static(frontendDist, { maxAge: "1d", etag: true }));
    // SPA fallback — any non-API route returns index.html for client-side routing
    app.get("*", (_req, res) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  } else {
    logger.warn({ frontendDist }, "Frontend dist not found — run the frontend build step");
  }
}

// ── Global error handler ────────────────────────────────────────────────────
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, path: req.path }, "Unhandled error");
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
