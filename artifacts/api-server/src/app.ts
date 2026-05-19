import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const ALLOWED_ORIGINS: string[] = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174,http://localhost:3000")
  .split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Rate limiting ───────────────────────────────────── */
const ordersLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "عدد طلبات كثيرة، حاول لاحقاً" },
  skip: (req) => req.method !== "POST",
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "عدد محاولات تسجيل دخول كثيرة، حاول بعد 15 دقيقة" },
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests" },
});

app.use("/api/orders", ordersLimiter);
app.use("/api/branch/login", loginLimiter);
app.use("/api/admin", adminLimiter);

app.use("/api", router);

const branchDistDir = path.resolve(
  __dirname,
  "../../../artifacts/basmah-branch/dist/public",
);
app.use("/basmah-branch", express.static(branchDistDir));
app.get("/basmah-branch/*splat", (_req, res) => {
  res.sendFile(path.join(branchDistDir, "index.html"));
});

const adminDistDir = path.resolve(
  __dirname,
  "../../../artifacts/basmah-admin/dist/public",
);
app.use("/basmah-admin", express.static(adminDistDir));
app.get("/basmah-admin/*splat", (_req, res) => {
  res.sendFile(path.join(adminDistDir, "index.html"));
});

export default app;
