import { Router } from "express";
import { db } from "@workspace/db";
import {
  ordersTable,
  jerseyColorsTable,
  nahfatPresetsTable,
  teamsTable,
  stickersTable,
} from "@workspace/db";
import { eq, desc, inArray } from "drizzle-orm";

const router = Router();

const VALID_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

/* ════════════════════════════════════════════════════
   ORDERS
════════════════════════════════════════════════════ */
router.get("/admin/orders", async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    res.json(orders);
  } catch (err) {
    req.log.error({ err }, "admin: failed to list orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/orders/:id/status", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { status } = req.body as { status?: string };
  if (!status || !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    res.status(400).json({ error: "Invalid status" }); return;
  }
  try {
    const [updated] = await db
      .update(ordersTable).set({ status }).where(eq(ordersTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Order not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "admin: failed to update order status");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* DELETE /admin/orders/delivered — bulk-purge completed orders */
router.delete("/admin/orders/delivered", async (req, res) => {
  try {
    const toDelete = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(inArray(ordersTable.status, ["delivered", "cancelled"]));
    if (toDelete.length === 0) {
      res.json({ deleted: 0 }); return;
    }
    const ids = toDelete.map(r => r.id);
    await db.delete(ordersTable).where(inArray(ordersTable.id, ids));
    req.log.info({ count: ids.length }, "admin: purged delivered/cancelled orders");
    res.json({ deleted: ids.length });
  } catch (err) {
    req.log.error({ err }, "admin: failed to purge delivered orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ════════════════════════════════════════════════════
   TEAMS
════════════════════════════════════════════════════ */
router.get("/admin/teams", async (req, res) => {
  try {
    const teams = await db.select().from(teamsTable).orderBy(teamsTable.name);
    res.json(teams.map(t => ({
      ...t,
      availableColors: JSON.parse(t.availableColors),
      availableSizes: JSON.parse(t.availableSizes),
    })));
  } catch (err) {
    req.log.error({ err }, "admin: failed to list teams");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/teams", async (req, res) => {
  const { name, nameEn, league, country, primaryColor, secondaryColor, basePrice, availableSizes, isPopular } =
    req.body as Record<string, unknown>;
  if (!name || typeof name !== "string" || !nameEn || typeof nameEn !== "string") {
    res.status(400).json({ error: "name and nameEn are required" }); return;
  }
  try {
    const sizes = Array.isArray(availableSizes) ? availableSizes : ["S", "M", "L", "XL", "XXL"];
    const [team] = await db.insert(teamsTable).values({
      name: name as string,
      nameEn: nameEn as string,
      league: typeof league === "string" && league ? league : "الدوري الأردني",
      country: typeof country === "string" && country ? country : "الأردن",
      primaryColor: typeof primaryColor === "string" ? primaryColor : "#1a1a2e",
      secondaryColor: typeof secondaryColor === "string" ? secondaryColor : "#ffffff",
      availableColors: JSON.stringify([]),
      availableSizes: JSON.stringify(sizes),
      basePrice: typeof basePrice === "number" && basePrice > 0 ? basePrice : 89,
      isPopular: Boolean(isPopular),
    }).returning();
    res.status(201).json({
      ...team,
      availableColors: JSON.parse(team.availableColors),
      availableSizes: JSON.parse(team.availableSizes),
    });
  } catch (err) {
    req.log.error({ err }, "admin: failed to create team");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/teams/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid team id" }); return; }
  try {
    await db.delete(teamsTable).where(eq(teamsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "admin: failed to delete team");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/teams/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid team id" }); return; }
  const { basePrice, primaryColor, secondaryColor, name, nameEn, isPopular, logoUrl } = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (typeof basePrice === "number" && basePrice > 0) update.basePrice = basePrice;
  if (typeof primaryColor === "string") update.primaryColor = primaryColor;
  if (typeof secondaryColor === "string") update.secondaryColor = secondaryColor;
  if (typeof name === "string" && name) update.name = name;
  if (typeof nameEn === "string" && nameEn) update.nameEn = nameEn;
  if (typeof isPopular === "boolean") update.isPopular = isPopular;
  if (logoUrl === null || typeof logoUrl === "string") update.logoUrl = logoUrl || null;
  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "Nothing to update" }); return;
  }
  try {
    const [updated] = await db
      .update(teamsTable).set(update as Partial<typeof teamsTable.$inferInsert>)
      .where(eq(teamsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Team not found" }); return; }
    res.json({
      ...updated,
      availableColors: JSON.parse(updated.availableColors),
      availableSizes: JSON.parse(updated.availableSizes),
    });
  } catch (err) {
    req.log.error({ err }, "admin: failed to update team");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ════════════════════════════════════════════════════
   JERSEY COLORS
════════════════════════════════════════════════════ */
router.get("/admin/teams/:id/colors", async (req, res) => {
  const teamId = parseInt(req.params.id, 10);
  if (isNaN(teamId)) { res.status(400).json({ error: "Invalid team id" }); return; }
  try {
    const colors = await db
      .select().from(jerseyColorsTable)
      .where(eq(jerseyColorsTable.teamId, teamId))
      .orderBy(jerseyColorsTable.sortOrder);
    res.json(colors);
  } catch (err) {
    req.log.error({ err }, "admin: failed to list jersey colors");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/teams/:id/colors", async (req, res) => {
  const teamId = parseInt(req.params.id, 10);
  if (isNaN(teamId)) { res.status(400).json({ error: "Invalid team id" }); return; }
  const { name, frontImageUrl, backImageUrl, hexCode, secondaryHexCode, isDefault, sortOrder,
          priceWithCustomization, priceWithoutCustomization } =
    req.body as Record<string, unknown>;
  if (!name || typeof name !== "string" || !frontImageUrl || typeof frontImageUrl !== "string") {
    res.status(400).json({ error: "name and frontImageUrl are required" }); return;
  }
  try {
    const [color] = await db.insert(jerseyColorsTable).values({
      teamId,
      name,
      frontImageUrl,
      backImageUrl: typeof backImageUrl === "string" ? backImageUrl : null,
      hexCode: typeof hexCode === "string" ? hexCode : "#ffffff",
      secondaryHexCode: typeof secondaryHexCode === "string" ? secondaryHexCode : "#000000",
      isDefault: Boolean(isDefault),
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      priceWithCustomization: typeof priceWithCustomization === "number" ? priceWithCustomization : null,
      priceWithoutCustomization: typeof priceWithoutCustomization === "number" ? priceWithoutCustomization : null,
    }).returning();
    res.status(201).json(color);
  } catch (err) {
    req.log.error({ err }, "admin: failed to create jersey color");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/teams/:teamId/colors/:colorId", async (req, res) => {
  const colorId = parseInt(req.params.colorId, 10);
  if (isNaN(colorId)) { res.status(400).json({ error: "Invalid color id" }); return; }
  const body = req.body as Record<string, unknown>;
  const { name, frontImageUrl, backImageUrl, hexCode, secondaryHexCode, isDefault, sortOrder } = body;
  const update: Record<string, unknown> = {};
  if (typeof name === "string" && name) update.name = name;
  if (typeof frontImageUrl === "string") update.frontImageUrl = frontImageUrl;
  if (typeof backImageUrl === "string" || backImageUrl === null) update.backImageUrl = backImageUrl;
  if (typeof hexCode === "string") update.hexCode = hexCode;
  if (typeof secondaryHexCode === "string") update.secondaryHexCode = secondaryHexCode;
  if (typeof isDefault === "boolean") update.isDefault = isDefault;
  if (typeof sortOrder === "number") update.sortOrder = sortOrder;
  if (typeof body.isSoldOut === "boolean") update.isSoldOut = body.isSoldOut;
  if (typeof body.priceWithCustomization === "number" || body.priceWithCustomization === null)
    update.priceWithCustomization = body.priceWithCustomization;
  if (typeof body.priceWithoutCustomization === "number" || body.priceWithoutCustomization === null)
    update.priceWithoutCustomization = body.priceWithoutCustomization;
  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "Nothing to update" }); return;
  }
  try {
    const [updated] = await db
      .update(jerseyColorsTable)
      .set(update as Partial<typeof jerseyColorsTable.$inferInsert>)
      .where(eq(jerseyColorsTable.id, colorId)).returning();
    if (!updated) { res.status(404).json({ error: "Color not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "admin: failed to update jersey color");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/teams/:teamId/colors/:colorId", async (req, res) => {
  const colorId = parseInt(req.params.colorId, 10);
  if (isNaN(colorId)) { res.status(400).json({ error: "Invalid color id" }); return; }
  try {
    await db.delete(jerseyColorsTable).where(eq(jerseyColorsTable.id, colorId));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "admin: failed to delete jersey color");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* Public — jersey colors for a team */
router.get("/teams/:id/jersey-colors", async (req, res) => {
  const teamId = parseInt(req.params.id, 10);
  if (isNaN(teamId)) { res.status(400).json({ error: "Invalid team id" }); return; }
  try {
    const colors = await db
      .select().from(jerseyColorsTable)
      .where(eq(jerseyColorsTable.teamId, teamId))
      .orderBy(jerseyColorsTable.sortOrder);
    res.json(colors);
  } catch (err) {
    req.log.error({ err }, "failed to list jersey colors");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ════════════════════════════════════════════════════
   NAHFAT PRESETS
════════════════════════════════════════════════════ */
router.get("/admin/nahfat", async (req, res) => {
  try {
    const presets = await db.select().from(nahfatPresetsTable).orderBy(nahfatPresetsTable.sortOrder);
    res.json(presets);
  } catch (err) {
    req.log.error({ err }, "admin: failed to list nahfat");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/nahfat", async (req, res) => {
  const { text, category, isActive, sortOrder } = req.body as Record<string, unknown>;
  if (!text || typeof text !== "string") { res.status(400).json({ error: "text is required" }); return; }
  try {
    const [preset] = await db.insert(nahfatPresetsTable).values({
      text,
      category: typeof category === "string" ? category : "عربي",
      isActive: isActive !== false,
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
    }).returning();
    res.status(201).json(preset);
  } catch (err) {
    req.log.error({ err }, "admin: failed to create nahfat");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/nahfat/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { text, category, isActive, sortOrder } = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (typeof text === "string") update.text = text;
  if (typeof category === "string") update.category = category;
  if (typeof isActive === "boolean") update.isActive = isActive;
  if (typeof sortOrder === "number") update.sortOrder = sortOrder;
  if (Object.keys(update).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
  try {
    const [updated] = await db
      .update(nahfatPresetsTable)
      .set(update as { text?: string; category?: string; isActive?: boolean; sortOrder?: number })
      .where(eq(nahfatPresetsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "admin: failed to update nahfat");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/nahfat/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(nahfatPresetsTable).where(eq(nahfatPresetsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "admin: failed to delete nahfat");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* Public — active nahfat */
router.get("/nahfat", async (req, res) => {
  try {
    const presets = await db
      .select().from(nahfatPresetsTable)
      .where(eq(nahfatPresetsTable.isActive, true))
      .orderBy(nahfatPresetsTable.sortOrder);
    res.json(presets);
  } catch (err) {
    req.log.error({ err }, "failed to list nahfat");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ════════════════════════════════════════════════════
   STICKERS
════════════════════════════════════════════════════ */
router.get("/admin/stickers", async (req, res) => {
  try {
    const rows = await db.select().from(stickersTable).orderBy(stickersTable.sortOrder);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "admin: failed to list stickers");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/stickers", async (req, res) => {
  const { name, url, category, isActive, sortOrder } = req.body as Record<string, unknown>;
  if (!name || typeof name !== "string") { res.status(400).json({ error: "name is required" }); return; }
  if (!url  || typeof url  !== "string") { res.status(400).json({ error: "url is required"  }); return; }
  try {
    const [sticker] = await db.insert(stickersTable).values({
      name,
      url,
      category: typeof category === "string" && category ? category : "عام",
      isActive: typeof isActive === "boolean" ? isActive : true,
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
    }).returning();
    res.status(201).json(sticker);
  } catch (err) {
    req.log.error({ err }, "admin: failed to create sticker");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/stickers/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name, url, category, isActive, sortOrder } = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (typeof name     === "string")  update.name      = name;
  if (typeof url      === "string")  update.url       = url;
  if (typeof category === "string")  update.category  = category;
  if (typeof isActive === "boolean") update.isActive  = isActive;
  if (typeof sortOrder=== "number")  update.sortOrder = sortOrder;
  if (Object.keys(update).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
  try {
    const [updated] = await db.update(stickersTable)
      .set(update as Partial<typeof stickersTable.$inferInsert>)
      .where(eq(stickersTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "admin: failed to update sticker");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/stickers/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(stickersTable).where(eq(stickersTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "admin: failed to delete sticker");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* Public — active stickers */
router.get("/stickers", async (req, res) => {
  try {
    const rows = await db.select().from(stickersTable)
      .where(eq(stickersTable.isActive, true))
      .orderBy(stickersTable.sortOrder);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "failed to list stickers");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ════════════════════════════════════════════════════
   CHARTS / ANALYTICS
════════════════════════════════════════════════════ */
router.get("/admin/stats/charts", async (req, res) => {
  try {
    const all = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));

    /* daily orders + revenue — last 7 days */
    const now = new Date();
    const dailyOrders = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
      const dayOrders = all.filter(o => {
        const od = new Date(o.createdAt);
        return od.getFullYear() === y && od.getMonth() === m && od.getDate() === day;
      });
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      return { date: label, orders: dayOrders.length, revenue: Math.round(dayOrders.reduce((s, o) => s + o.totalPrice, 0)) };
    });

    /* orders by team — top 6 */
    const teamMap: Record<string, number> = {};
    all.forEach(o => { teamMap[o.teamName] = (teamMap[o.teamName] || 0) + 1; });
    const byTeam = Object.entries(teamMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([team, count]) => ({ team: team.length > 12 ? team.slice(0, 12) + "…" : team, count }));

    /* by status */
    const statusLabels: Record<string, string> = {
      pending: "معلّق", confirmed: "مؤكّد", shipped: "شُحن",
      delivered: "مُسلَّم", cancelled: "ملغي",
    };
    const statusMap: Record<string, number> = {};
    all.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
    const byStatus = Object.entries(statusMap)
      .map(([status, count]) => ({ status, label: statusLabels[status] || status, count }));

    /* by size */
    const sizeMap: Record<string, number> = {};
    all.forEach(o => { sizeMap[o.size] = (sizeMap[o.size] || 0) + 1; });
    const bySizes = Object.entries(sizeMap)
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => b.count - a.count);

    res.json({ dailyOrders, byTeam, byStatus, bySizes });
  } catch (err) {
    req.log.error({ err }, "admin: failed to get chart stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
