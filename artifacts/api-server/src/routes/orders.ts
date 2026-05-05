import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, teamsTable, jerseyColorsTable } from "@workspace/db";
import { eq, desc, count, sum } from "drizzle-orm";
import { CreateOrderBody } from "@workspace/api-zod";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

/* GET /orders — full list with customer data, admin-only */
router.get("/orders", adminAuth, async (req, res) => {
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt));
    res.json(orders);
  } catch (err) {
    req.log.error({ err }, "Failed to list orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/orders", async (req, res) => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const data = parsed.data;

  /* Server-side phone validation (Jordanian format) */
  if (!/^07\d{8}$/.test(data.customerPhone)) {
    res.status(400).json({ error: "رقم الهاتف غير صالح" });
    return;
  }

  try {
    const [team] = await db
      .select()
      .from(teamsTable)
      .where(eq(teamsTable.id, data.teamId));
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    /* ── Price calculation using jersey color pricing when available ── */
    let unitPrice = team.basePrice;
    const jerseyColorId =
      typeof (req.body as Record<string, unknown>).jerseyColorId === "number"
        ? (req.body as Record<string, unknown>).jerseyColorId as number
        : null;

    if (jerseyColorId) {
      const [color] = await db
        .select()
        .from(jerseyColorsTable)
        .where(eq(jerseyColorsTable.id, jerseyColorId));
      if (color) {
        const hasCustomization = !!(data.playerName && data.playerName.trim());
        const colorPrice = hasCustomization
          ? color.priceWithCustomization
          : color.priceWithoutCustomization;
        if (colorPrice !== null && colorPrice !== undefined) {
          unitPrice = colorPrice;
        }
      }
    }

    const totalPrice = unitPrice * data.quantity;

    const [order] = await db
      .insert(ordersTable)
      .values({
        teamId: data.teamId,
        teamName: team.name,
        customerName: data.customerName,
        jerseyNumber: data.jerseyNumber,
        size: data.size,
        color: data.color,
        quantity: data.quantity,
        totalPrice,
        customerPhone: data.customerPhone,
        customerCity: data.customerCity,
        status: "pending",
        governorate: (data as Record<string, unknown>).governorate as string ?? null,
        playerName: data.playerName ?? null,
        frontImageUrl: data.frontImageUrl ?? null,
        backImageUrl: data.backImageUrl ?? null,
        jerseyColorName: data.jerseyColorName ?? null,
      })
      .returning();

    await db
      .update(teamsTable)
      .set({ orderCount: team.orderCount + data.quantity })
      .where(eq(teamsTable.id, data.teamId));

    res.status(201).json(order);
  } catch (err) {
    req.log.error({ err }, "Failed to create order");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* Track orders by phone number — public */
router.get("/orders/by-phone", async (req, res) => {
  const phone = typeof req.query.phone === "string" ? req.query.phone.trim() : null;
  if (!phone) { res.status(400).json({ error: "phone required" }); return; }
  if (!/^07\d{8}$/.test(phone)) { res.status(400).json({ error: "رقم الهاتف غير صالح" }); return; }
  try {
    const orders = await db
      .select({
        id: ordersTable.id,
        teamName: ordersTable.teamName,
        jerseyNumber: ordersTable.jerseyNumber,
        size: ordersTable.size,
        color: ordersTable.color,
        quantity: ordersTable.quantity,
        totalPrice: ordersTable.totalPrice,
        status: ordersTable.status,
        createdAt: ordersTable.createdAt,
        jerseyColorName: ordersTable.jerseyColorName,
        playerName: ordersTable.playerName,
      })
      .from(ordersTable)
      .where(eq(ordersTable.customerPhone, phone))
      .orderBy(desc(ordersTable.createdAt));
    res.json(orders);
  } catch (err) {
    req.log.error({ err }, "Failed to track orders by phone");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* Public aggregate stats */
router.get("/orders/stats", async (req, res) => {
  try {
    const [{ total }] = await db.select({ total: count() }).from(ordersTable);
    const [{ revenue }] = await db.select({ revenue: sum(ordersTable.totalPrice) }).from(ordersTable);

    const topTeamRows = await db
      .select({ teamName: ordersTable.teamName, cnt: count() })
      .from(ordersTable)
      .groupBy(ordersTable.teamName)
      .orderBy(desc(count()))
      .limit(1);

    const popularSizeRows = await db
      .select({ size: ordersTable.size, cnt: count() })
      .from(ordersTable)
      .groupBy(ordersTable.size)
      .orderBy(desc(count()))
      .limit(1);

    const popularColorRows = await db
      .select({ color: ordersTable.color, cnt: count() })
      .from(ordersTable)
      .groupBy(ordersTable.color)
      .orderBy(desc(count()))
      .limit(1);

    res.json({
      totalOrders: Number(total) || 0,
      totalRevenue: Number(revenue) || 0,
      topTeam: topTeamRows[0]?.teamName || "ريال مدريد",
      popularSize: popularSizeRows[0]?.size || "L",
      popularColor: popularColorRows[0]?.color || "#FFFFFF",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
