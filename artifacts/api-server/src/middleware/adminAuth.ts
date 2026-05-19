import type { Request, Response, NextFunction } from "express";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";
const ADMIN_SECRET_ENV_SET = !!process.env.ADMIN_SECRET;

if (!ADMIN_SECRET_ENV_SET) {
  process.stderr.write(
    "[SECURITY WARNING] ADMIN_SECRET env var is not set — using empty string. Set it in .env in production!\n"
  );
}

if (!ADMIN_SECRET_ENV_SET || ADMIN_SECRET === "") {
  process.stderr.write(
    "[SECURITY FATAL] ADMIN_SECRET is empty — all admin requests will be rejected.\n"
  );
}

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers["x-admin-key"];

  if (!ADMIN_SECRET) {
    res.status(500).json({ error: "Server misconfigured — ADMIN_SECRET not set" });
    return;
  }

  if (!key || key !== ADMIN_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
