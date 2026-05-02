import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, teamsTable } from "@workspace/db";
import { eq, desc, count, sum } from "drizzle-orm";
import { CreateOrderBody } from "@workspace/api-zod";

const router = Router();

router.get("/orders", async (req, res) => {
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
  try {
    const [team] = await db
      .select()
      .from(teamsTable)
      .where(eq(teamsTable.id, data.teamId));
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    const totalPrice = team.basePrice * data.quantity;
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

router.get("/orders/stats", async (req, res) => {
  try {
    const [{ total }] = await db
      .select({ total: count() })
      .from(ordersTable);

    const [{ revenue }] = await db
      .select({ revenue: sum(ordersTable.totalPrice) })
      .from(ordersTable);

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
