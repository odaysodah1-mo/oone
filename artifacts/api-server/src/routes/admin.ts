import { Router } from "express";
import { db } from "@workspace/db";
import {
  ordersTable,
  jerseyColorsTable,
  nahfatPresetsTable,
  teamsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";

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

router.patch("/admin/teams/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid team id" }); return; }
  const { basePrice, primaryColor, secondaryColor, name, nameEn, isPopular } = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (typeof basePrice === "number" && basePrice > 0) update.basePrice = basePrice;
  if (typeof primaryColor === "string") update.primaryColor = primaryColor;
  if (typeof secondaryColor === "string") update.secondaryColor = secondaryColor;
  if (typeof name === "string" && name) update.name = name;
  if (typeof nameEn === "string" && nameEn) update.nameEn = nameEn;
  if (typeof isPopular === "boolean") update.isPopular = isPopular;
  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "Nothing to update" }); return;
  }
  try {
    const [updated] = await db
      .update(teamsTable).set(update as Parameters<typeof db.update>[0])
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
  const { name, frontImageUrl, backImageUrl, hexCode, secondaryHexCode, isDefault, sortOrder } =
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
  const { name, frontImageUrl, backImageUrl, hexCode, secondaryHexCode, isDefault, sortOrder } =
    req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (typeof name === "string" && name) update.name = name;
  if (typeof frontImageUrl === "string") update.frontImageUrl = frontImageUrl;
  if (typeof backImageUrl === "string" || backImageUrl === null) update.backImageUrl = backImageUrl;
  if (typeof hexCode === "string") update.hexCode = hexCode;
  if (typeof secondaryHexCode === "string") update.secondaryHexCode = secondaryHexCode;
  if (typeof isDefault === "boolean") update.isDefault = isDefault;
  if (typeof sortOrder === "number") update.sortOrder = sortOrder;
  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "Nothing to update" }); return;
  }
  try {
    const [updated] = await db
      .update(jerseyColorsTable)
      .set(update as Parameters<typeof db.update>[0])
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

export default router;
