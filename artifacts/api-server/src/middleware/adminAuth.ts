import type { Request, Response, NextFunction } from "express";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "basmah2025";

if (!process.env.ADMIN_SECRET) {
  process.stderr.write(
    "[SECURITY WARNING] ADMIN_SECRET env var is not set — using default password. Set it in production!\n"
  );
}

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers["x-admin-key"];
  if (!key || key !== ADMIN_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
