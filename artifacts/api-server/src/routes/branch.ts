import { Router, Request } from "express";
import { createHmac, createHash } from "crypto";
import { db } from "@workspace/db";
import { branchesTable, ordersTable } from "@workspace/db";
import { eq, desc, and, count, sum } from "drizzle-orm";

const router = Router();

const SECRET = process.env.SESSION_SECRET ?? "basmah_branch_secret_2025";

const JORDAN_GOVERNORATES = [
  "عمان", "إربد", "الزرقاء", "البلقاء", "الكرك", "مادبا",
  "جرش", "عجلون", "المفرق", "الطفيلة", "معان", "العقبة",
] as const;

const BRANCH_STATUSES = ["pending", "confirmed", "shipped", "delivered"] as const;

/* ── Token helpers ───────────────────────────────────────── */
interface BranchPayload { id: number; username: string; governorate: string; commissionRate: number; iat: number }

function hashPassword(password: string): string {
  return createHash("sha256").update(password + SECRET).digest("hex");
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

/* ════════════════════════════════════════════════════
   BRANCH AUTH
════════════════════════════════════════════════════ */
router.post("/branch/login", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "username and password required" }); return;
  }
  try {
    const [branch] = await db.select().from(branchesTable)
      .where(eq(branchesTable.username, username));
    if (!branch || !branch.active) {
      res.status(401).json({ error: "بيانات غير صحيحة" }); return;
    }
    if (branch.passwordHash !== hashPassword(password)) {
      res.status(401).json({ error: "بيانات غير صحيحة" }); return;
    }
    const token = createToken({ id: branch.id, username: branch.username, governorate: branch.governorate, commissionRate: branch.commissionRate, iat: Date.now() });
    res.json({ token, governorate: branch.governorate, username: branch.username, commissionRate: branch.commissionRate });
  } catch (err) {
    req.log.error({ err }, "branch: login failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ════════════════════════════════════════════════════
   BRANCH ORDERS
════════════════════════════════════════════════════ */
router.get("/branch/orders", async (req, res) => {
  const branch = getBranchFromReq(req);
  if (!branch) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const orders = await db.select().from(ordersTable)
      .where(eq(ordersTable.governorate, branch.governorate))
      .orderBy(desc(ordersTable.createdAt));
    res.json(orders);
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
    const [existing] = await db.select().from(ordersTable)
      .where(and(eq(ordersTable.id, id), eq(ordersTable.governorate, branch.governorate)));
    if (!existing) { res.status(404).json({ error: "Order not found" }); return; }
    const [updated] = await db.update(ordersTable).set({ status })
      .where(eq(ordersTable.id, id)).returning();
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
    const [{ total }] = await db.select({ total: count() }).from(ordersTable)
      .where(eq(ordersTable.governorate, branch.governorate));
    const [{ revenue }] = await db.select({ revenue: sum(ordersTable.totalPrice) }).from(ordersTable)
      .where(and(eq(ordersTable.governorate, branch.governorate), eq(ordersTable.status, "delivered")));
    const pending   = await db.select({ c: count() }).from(ordersTable).where(and(eq(ordersTable.governorate, branch.governorate), eq(ordersTable.status, "pending")));
    const confirmed = await db.select({ c: count() }).from(ordersTable).where(and(eq(ordersTable.governorate, branch.governorate), eq(ordersTable.status, "confirmed")));
    const shipped   = await db.select({ c: count() }).from(ordersTable).where(and(eq(ordersTable.governorate, branch.governorate), eq(ordersTable.status, "shipped")));
    const delivered = await db.select({ c: count() }).from(ordersTable).where(and(eq(ordersTable.governorate, branch.governorate), eq(ordersTable.status, "delivered")));
    res.json({
      total: Number(total) || 0,
      revenue: Number(revenue) || 0,
      commission: (Number(revenue) || 0) * branch.commissionRate,
      pending: Number(pending[0]?.c) || 0,
      confirmed: Number(confirmed[0]?.c) || 0,
      shipped: Number(shipped[0]?.c) || 0,
      delivered: Number(delivered[0]?.c) || 0,
    });
  } catch (err) {
    req.log.error({ err }, "branch: failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ════════════════════════════════════════════════════
   ADMIN → BRANCH MANAGEMENT
════════════════════════════════════════════════════ */

router.get("/admin/branches", async (req, res) => {
  try {
    const branches = await db.select({
      id: branchesTable.id, username: branchesTable.username,
      governorate: branchesTable.governorate, commissionRate: branchesTable.commissionRate,
      active: branchesTable.active, createdAt: branchesTable.createdAt,
    }).from(branchesTable).orderBy(branchesTable.governorate);
    const withStats = await Promise.all(branches.map(async b => {
      const [{ total }]   = await db.select({ total: count() }).from(ordersTable).where(eq(ordersTable.governorate, b.governorate));
      const [{ revenue }] = await db.select({ revenue: sum(ordersTable.totalPrice) }).from(ordersTable)
        .where(and(eq(ordersTable.governorate, b.governorate), eq(ordersTable.status, "delivered")));
      return { ...b, totalOrders: Number(total) || 0, revenue: Number(revenue) || 0, commission: (Number(revenue) || 0) * b.commissionRate };
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
    const [branch] = await db.insert(branchesTable).values({
      username,
      passwordHash: hashPassword(password),
      governorate,
      commissionRate: typeof commissionRate === "number" ? commissionRate : 0.1,
      active: true,
    }).returning();
    const { passwordHash: _, ...safe } = branch;
    res.status(201).json(safe);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23505") { res.status(409).json({ error: "اسم المستخدم موجود مسبقاً" }); return; }
    req.log.error({ err }, "admin: failed to create branch");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/branches/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { password, commissionRate, active, governorate } = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (typeof password === "string" && password) update.passwordHash = hashPassword(password);
  if (typeof commissionRate === "number") update.commissionRate = commissionRate;
  if (typeof active === "boolean") update.active = active;
  if (typeof governorate === "string" && JORDAN_GOVERNORATES.includes(governorate as typeof JORDAN_GOVERNORATES[number])) update.governorate = governorate;
  if (Object.keys(update).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
  try {
    const [updated] = await db.update(branchesTable).set(update as Partial<typeof branchesTable.$inferInsert>)
      .where(eq(branchesTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Branch not found" }); return; }
    const { passwordHash: _, ...safe } = updated;
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
    await db.delete(branchesTable).where(eq(branchesTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "admin: failed to delete branch");
    res.status(500).json({ error: "Internal server error" });
  }
});

export { JORDAN_GOVERNORATES };
export default router;
