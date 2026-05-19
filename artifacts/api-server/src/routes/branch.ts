import { Router, Request } from "express";
import { createHmac } from "crypto";
import bcrypt from "bcryptjs";
import { eq, desc, and, count, sum } from "drizzle-orm";
import { supabase } from "../lib/supabase-db";

const router = Router();

const SECRET = process.env.SESSION_SECRET ?? "basmah_branch_secret_2025";

const JORDAN_GOVERNORATES = [
  "عمان", "إربد", "الزرقاء", "البلقاء", "الكرك", "مادبا",
  "جرش", "عجلون", "المفرق", "الطفيلة", "معان", "العقبة",
] as const;

const BRANCH_STATUSES = ["pending", "confirmed", "shipped", "delivered"] as const;

interface BranchPayload { id: number; username: string; governorate: string; commissionRate: number; iat: number }

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function createToken(payload: BranchPayload): string {
  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(base64).digest("base64url");
  return `${base64}.${sig}`;
}

function verifyToken(token: string): BranchPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const base64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", SECRET).update(base64).digest("base64url");
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(base64, "base64url").toString()) as BranchPayload;
  } catch { return null; }
}

function getBranchFromReq(req: Request): BranchPayload | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}

router.post("/branch/login", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "username and password required" }); return;
  }
  try {
    const { data: branch, error } = await supabase
      .from("branches")
      .select("*")
      .eq("username", username)
      .single();
    if (error || !branch || !branch.active) {
      res.status(401).json({ error: "بيانات غير صحيحة" }); return;
    }
    if (!(await comparePassword(password, branch.password_hash))) {
      res.status(401).json({ error: "بيانات غير صحيحة" }); return;
    }
    const token = createToken({ id: branch.id, username: branch.username, governorate: branch.governorate, commissionRate: branch.commission_rate, iat: Date.now() });
    res.json({ token, governorate: branch.governorate, username: branch.username, commissionRate: branch.commission_rate });
  } catch (err) {
    req.log.error({ err }, "branch: login failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/branch/orders", async (req, res) => {
  const branch = getBranchFromReq(req);
  if (!branch) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("governorate", branch.governorate)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "branch: failed to list orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/branch/orders/:id/status", async (req, res) => {
  const branch = getBranchFromReq(req);
  if (!branch) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { status } = req.body as { status?: string };
  if (!status || !BRANCH_STATUSES.includes(status as typeof BRANCH_STATUSES[number])) {
    res.status(400).json({ error: "Invalid status" }); return;
  }
  try {
    const { data: existing, error: findErr } = await supabase
      .from("orders")
      .select("id")
      .eq("id", id)
      .eq("governorate", branch.governorate)
      .single();
    if (findErr || !existing) { res.status(404).json({ error: "Order not found" }); return; }
    const { data: updated, error: updErr } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (updErr) throw updErr;
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "branch: failed to update order status");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/branch/stats", async (req, res) => {
  const branch = getBranchFromReq(req);
  if (!branch) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("total_price, status")
      .eq("governorate", branch.governorate);
    if (error) throw error;

    const total = orders?.length || 0;
    let revenue = 0;
    const statusCounts: Record<string, number> = { pending: 0, confirmed: 0, shipped: 0, delivered: 0 };

    for (const o of orders || []) {
      if (o.status === "delivered") revenue += o.total_price || 0;
      if (statusCounts[o.status] !== undefined) statusCounts[o.status]++;
    }

    res.json({
      total,
      revenue,
      commission: revenue * branch.commissionRate,
      pending: statusCounts.pending,
      confirmed: statusCounts.confirmed,
      shipped: statusCounts.shipped,
      delivered: statusCounts.delivered,
    });
  } catch (err) {
    req.log.error({ err }, "branch: failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/branches", async (req, res) => {
  try {
    const { data: branches, error } = await supabase
      .from("branches")
      .select("id, username, governorate, commission_rate, active, created_at")
      .order("governorate", { ascending: true });
    if (error) throw error;

    const withStats = await Promise.all((branches || []).map(async (b: any) => {
      const { data: orders } = await supabase
        .from("orders")
        .select("total_price, status")
        .eq("governorate", b.governorate);
      const totalOrders = orders?.length || 0;
      const revenue = (orders || []).reduce((s: number, o: any) => o.status === "delivered" ? s + (o.total_price || 0) : s, 0);
      return {
        id: b.id, username: b.username, governorate: b.governorate,
        commissionRate: b.commission_rate, active: b.active, createdAt: b.created_at,
        totalOrders, revenue, commission: revenue * b.commission_rate,
      };
    }));
    res.json(withStats);
  } catch (err) {
    req.log.error({ err }, "admin: failed to list branches");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/branches", async (req, res) => {
  const { username, password, governorate, commissionRate } = req.body as Record<string, unknown>;
  if (!username || typeof username !== "string") { res.status(400).json({ error: "username required" }); return; }
  if (!password || typeof password !== "string") { res.status(400).json({ error: "password required" }); return; }
  if (!governorate || typeof governorate !== "string" || !JORDAN_GOVERNORATES.includes(governorate as typeof JORDAN_GOVERNORATES[number])) {
    res.status(400).json({ error: "valid governorate required" }); return;
  }
  try {
    const { data: branch, error } = await supabase
      .from("branches")
      .insert({
        username,
        password_hash: await hashPassword(password),
        governorate,
        commission_rate: typeof commissionRate === "number" ? commissionRate : 0.1,
        active: true,
      })
      .select()
      .single();
    if (error) throw error;
    const { password_hash, ...safe } = branch;
    res.status(201).json(safe);
  } catch (err: unknown) {
    const pgErr = err as { code?: string; message?: string };
    if (pgErr.message?.includes("duplicate") || pgErr.code === "23505") {
      res.status(409).json({ error: "اسم المستخدم موجود مسبقاً" }); return;
    }
    req.log.error({ err }, "admin: failed to create branch");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/branches/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { password, commissionRate, active, governorate } = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (typeof password === "string" && password) update.password_hash = await hashPassword(password);
  if (typeof commissionRate === "number") update.commission_rate = commissionRate;
  if (typeof active === "boolean") update.active = active;
  if (typeof governorate === "string" && JORDAN_GOVERNORATES.includes(governorate as typeof JORDAN_GOVERNORATES[number])) update.governorate = governorate;
  if (Object.keys(update).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
  try {
    const { data: updated, error } = await supabase
      .from("branches")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (error || !updated) { res.status(404).json({ error: "Branch not found" }); return; }
    const { password_hash, ...safe } = updated;
    res.json(safe);
  } catch (err) {
    req.log.error({ err }, "admin: failed to update branch");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/branches/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await supabase.from("branches").delete().eq("id", id);
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "admin: failed to delete branch");
    res.status(500).json({ error: "Internal server error" });
  }
});

export { JORDAN_GOVERNORATES };
export default router;
