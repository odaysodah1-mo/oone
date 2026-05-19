import { Router } from "express";
import { supabase, toCamelCaseArr, toCamelCaseSingle } from "../lib/supabase-db";

const router = Router();
const VALID_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

/* ── helper: fetch images array for a color (front + back + extras) ── */
async function getColorImages(colorId: number, frontUrl: string, backUrl: string | null): Promise<string[]> {
  const { data: extras } = await supabase
    .from("jersey_color_images")
    .select("*")
    .eq("jersey_color_id", colorId)
    .order("sort_order", { ascending: true });
  const base = [frontUrl, ...(backUrl ? [backUrl] : [])];
  const extraUrls = (extras || []).map(e => e.image_url).filter((u: string) => !base.includes(u));
  return [...base, ...extraUrls];
}

router.get("/admin/orders", async (req, res) => {
  try {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(toCamelCaseArr(data || []));
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
    const { data: updated, error } = await supabase
      .from("orders").update({ status }).eq("id", id).select().single();
    if (error || !updated) { res.status(404).json({ error: "Order not found" }); return; }
    res.json(toCamelCaseSingle(updated));
  } catch (err) {
    req.log.error({ err }, "admin: failed to update order status");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/orders/delivered", async (req, res) => {
  try {
    const { data: toDelete, error: findErr } = await supabase
      .from("orders").select("id").in("status", ["delivered", "cancelled"]);
    if (findErr) throw findErr;
    if (!toDelete || toDelete.length === 0) { res.json({ deleted: 0 }); return; }
    const ids = toDelete.map(r => r.id);
    const { error: delErr } = await supabase.from("orders").delete().in("id", ids);
    if (delErr) throw delErr;
    req.log.info({ count: ids.length }, "admin: purged delivered/cancelled orders");
    res.json({ deleted: ids.length });
  } catch (err) {
    req.log.error({ err }, "admin: failed to purge delivered orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/teams", async (req, res) => {
  try {
    const { data, error } = await supabase.from("teams").select("*").order("name", { ascending: true });
    if (error) throw error;
    res.json(toCamelCaseArr(data || []).map((t: any) => ({
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
    const { data: team, error } = await supabase.from("teams").insert({
      name,
      name_en: nameEn,
      league: typeof league === "string" && league ? league : "الدوري الأردني",
      country: typeof country === "string" && country ? country : "الأردن",
      primary_color: typeof primaryColor === "string" ? primaryColor : "#1a1a2e",
      secondary_color: typeof secondaryColor === "string" ? secondaryColor : "#ffffff",
      available_colors: JSON.stringify([]),
      available_sizes: JSON.stringify(sizes),
      base_price: typeof basePrice === "number" && basePrice > 0 ? basePrice : 89,
      is_popular: Boolean(isPopular),
    }).select().single();
    if (error) throw error;
    const camel = toCamelCaseSingle(team);
    res.status(201).json({
      ...camel,
      availableColors: JSON.parse(camel.availableColors),
      availableSizes: JSON.parse(camel.availableSizes),
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
    await supabase.from("teams").delete().eq("id", id);
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "admin: failed to delete team");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/teams/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid team id" }); return; }
  const { basePrice, primaryColor, secondaryColor, name, nameEn, isPopular, logoUrl, discountPercent } = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (typeof basePrice === "number" && basePrice > 0) update.base_price = basePrice;
  if (typeof primaryColor === "string") update.primary_color = primaryColor;
  if (typeof secondaryColor === "string") update.secondary_color = secondaryColor;
  if (typeof name === "string" && name) update.name = name;
  if (typeof nameEn === "string" && nameEn) update.name_en = nameEn;
  if (typeof isPopular === "boolean") update.is_popular = isPopular;
  if (logoUrl === null || typeof logoUrl === "string") update.logo_url = logoUrl || null;
  if (typeof discountPercent === "number" && discountPercent >= 0 && discountPercent <= 100)
    update.discount_percent = Math.round(discountPercent);
  if (Object.keys(update).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
  try {
    const { data: updated, error } = await supabase.from("teams").update(update).eq("id", id).select().single();
    if (error || !updated) { res.status(404).json({ error: "Team not found" }); return; }
    const camel = toCamelCaseSingle(updated);
    res.json({
      ...camel,
      availableColors: JSON.parse(camel.availableColors),
      availableSizes: JSON.parse(camel.availableSizes),
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
    const { data, error } = await supabase
      .from("jersey_colors")
      .select("*")
      .eq("team_id", teamId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    res.json(toCamelCaseArr(data || []));
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
    const { data: color, error } = await supabase.from("jersey_colors").insert({
      team_id: teamId,
      name,
      front_image_url: frontImageUrl,
      back_image_url: typeof backImageUrl === "string" ? backImageUrl : null,
      hex_code: typeof hexCode === "string" ? hexCode : "#ffffff",
      secondary_hex_code: typeof secondaryHexCode === "string" ? secondaryHexCode : "#000000",
      is_default: Boolean(isDefault),
      sort_order: typeof sortOrder === "number" ? sortOrder : 0,
      price_with_customization: typeof priceWithCustomization === "number" ? priceWithCustomization : null,
      price_without_customization: typeof priceWithoutCustomization === "number" ? priceWithoutCustomization : null,
    }).select().single();
    if (error) throw error;
    res.status(201).json(toCamelCaseSingle(color));
  } catch (err) {
    req.log.error({ err }, "admin: failed to create jersey color");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/teams/:teamId/colors/:colorId", async (req, res) => {
  const colorId = parseInt(req.params.colorId, 10);
  if (isNaN(colorId)) { res.status(400).json({ error: "Invalid color id" }); return; }
  const body = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name) update.name = body.name;
  if (typeof body.frontImageUrl === "string") update.front_image_url = body.frontImageUrl;
  if (typeof body.backImageUrl === "string" || body.backImageUrl === null) update.back_image_url = body.backImageUrl;
  if (typeof body.hexCode === "string") update.hex_code = body.hexCode;
  if (typeof body.secondaryHexCode === "string") update.secondary_hex_code = body.secondaryHexCode;
  if (typeof body.isDefault === "boolean") update.is_default = body.isDefault;
  if (typeof body.sortOrder === "number") update.sort_order = body.sortOrder;
  if (typeof body.isSoldOut === "boolean") update.is_sold_out = body.isSoldOut;
  if (typeof body.priceWithCustomization === "number" || body.priceWithCustomization === null)
    update.price_with_customization = body.priceWithCustomization;
  if (typeof body.priceWithoutCustomization === "number" || body.priceWithoutCustomization === null)
    update.price_without_customization = body.priceWithoutCustomization;
  if (Object.keys(update).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
  try {
    const { data: updated, error } = await supabase
      .from("jersey_colors").update(update).eq("id", colorId).select().single();
    if (error || !updated) { res.status(404).json({ error: "Color not found" }); return; }
    res.json(toCamelCaseSingle(updated));
  } catch (err) {
    req.log.error({ err }, "admin: failed to update jersey color");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/teams/:teamId/colors/:colorId", async (req, res) => {
  const colorId = parseInt(req.params.colorId, 10);
  if (isNaN(colorId)) { res.status(400).json({ error: "Invalid color id" }); return; }
  try {
    await supabase.from("jersey_colors").delete().eq("id", colorId);
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "admin: failed to delete jersey color");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* Public — jersey colors for a team (with images array) */
router.get("/teams/:id/jersey-colors", async (req, res) => {
  const teamId = parseInt(req.params.id, 10);
  if (isNaN(teamId)) { res.status(400).json({ error: "Invalid team id" }); return; }
  try {
    const { data: colors, error } = await supabase
      .from("jersey_colors")
      .select("*")
      .eq("team_id", teamId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    const withImages = await Promise.all(
      (colors || []).map(async (c: any) => ({
        ...toCamelCaseSingle(c),
        images: await getColorImages(c.id, c.front_image_url, c.back_image_url),
      }))
    );
    res.json(withImages);
  } catch (err) {
    req.log.error({ err }, "failed to list jersey colors");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* Admin — add extra image to a jersey color */
router.post("/admin/jersey-colors/:colorId/images", async (req, res) => {
  const colorId = parseInt(req.params.colorId, 10);
  if (isNaN(colorId)) { res.status(400).json({ error: "Invalid color id" }); return; }
  const { imageUrl, sortOrder } = req.body as Record<string, unknown>;
  if (!imageUrl || typeof imageUrl !== "string") {
    res.status(400).json({ error: "imageUrl is required" }); return;
  }
  try {
    const { data: img, error } = await supabase.from("jersey_color_images").insert({
      jersey_color_id: colorId,
      image_url: imageUrl,
      sort_order: typeof sortOrder === "number" ? sortOrder : 99,
    }).select().single();
    if (error) throw error;
    res.status(201).json(toCamelCaseSingle(img));
  } catch (err) {
    req.log.error({ err }, "admin: failed to add jersey color image");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* Admin — delete extra image */
router.delete("/admin/jersey-colors/:colorId/images/:imageId", async (req, res) => {
  const imageId = parseInt(req.params.imageId, 10);
  if (isNaN(imageId)) { res.status(400).json({ error: "Invalid image id" }); return; }
  try {
    await supabase.from("jersey_color_images").delete().eq("id", imageId);
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "admin: failed to delete jersey color image");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* Admin — get extra images for a color */
router.get("/admin/jersey-colors/:colorId/images", async (req, res) => {
  const colorId = parseInt(req.params.colorId, 10);
  if (isNaN(colorId)) { res.status(400).json({ error: "Invalid color id" }); return; }
  try {
    const { data: imgs, error } = await supabase
      .from("jersey_color_images")
      .select("*")
      .eq("jersey_color_id", colorId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    res.json(toCamelCaseArr(imgs || []));
  } catch (err) {
    req.log.error({ err }, "admin: failed to list jersey color images");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ════════════════════════════════════════════════════
   NAHFAT PRESETS
════════════════════════════════════════════════════ */
router.get("/admin/nahfat", async (req, res) => {
  try {
    const { data, error } = await supabase.from("nahfat_presets").select("*").order("sort_order", { ascending: true });
    if (error) throw error;
    res.json(toCamelCaseArr(data || []));
  } catch (err) {
    req.log.error({ err }, "admin: failed to list nahfat");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/nahfat", async (req, res) => {
  const { text, category, isActive, sortOrder } = req.body as Record<string, unknown>;
  if (!text || typeof text !== "string") { res.status(400).json({ error: "text is required" }); return; }
  try {
    const { data: preset, error } = await supabase.from("nahfat_presets").insert({
      text,
      category: typeof category === "string" ? category : "عربي",
      is_active: isActive !== false,
      sort_order: typeof sortOrder === "number" ? sortOrder : 0,
    }).select().single();
    if (error) throw error;
    res.status(201).json(toCamelCaseSingle(preset));
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
  if (typeof isActive === "boolean") update.is_active = isActive;
  if (typeof sortOrder === "number") update.sort_order = sortOrder;
  if (Object.keys(update).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
  try {
    const { data: updated, error } = await supabase
      .from("nahfat_presets").update(update).eq("id", id).select().single();
    if (error || !updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toCamelCaseSingle(updated));
  } catch (err) {
    req.log.error({ err }, "admin: failed to update nahfat");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/nahfat/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await supabase.from("nahfat_presets").delete().eq("id", id);
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "admin: failed to delete nahfat");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* Public — active nahfat */
router.get("/nahfat", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("nahfat_presets")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    res.json(toCamelCaseArr(data || []));
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
    const { data, error } = await supabase.from("stickers").select("*").order("sort_order", { ascending: true });
    if (error) throw error;
    res.json(toCamelCaseArr(data || []));
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
    const { data: sticker, error } = await supabase.from("stickers").insert({
      name,
      url,
      category: typeof category === "string" && category ? category : "عام",
      is_active: typeof isActive === "boolean" ? isActive : true,
      sort_order: typeof sortOrder === "number" ? sortOrder : 0,
    }).select().single();
    if (error) throw error;
    res.status(201).json(toCamelCaseSingle(sticker));
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
  if (typeof isActive === "boolean") update.is_active = isActive;
  if (typeof sortOrder=== "number")  update.sort_order= sortOrder;
  if (Object.keys(update).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
  try {
    const { data: updated, error } = await supabase
      .from("stickers").update(update).eq("id", id).select().single();
    if (error || !updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toCamelCaseSingle(updated));
  } catch (err) {
    req.log.error({ err }, "admin: failed to update sticker");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/stickers/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await supabase.from("stickers").delete().eq("id", id);
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "admin: failed to delete sticker");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* Public — active stickers */
router.get("/stickers", async (req, res) => {
  try {
    const { data, error } = await supabase.from("stickers")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    res.json(toCamelCaseArr(data || []));
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
    const { data: orders, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    const all = toCamelCaseArr(orders || []);

    /* daily orders + revenue — last 7 days */
    const now = new Date();
    const dailyOrders = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
      const dayOrders = all.filter((o: any) => {
        const od = new Date(o.createdAt);
        return od.getFullYear() === y && od.getMonth() === m && od.getDate() === day;
      });
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      return { date: label, orders: dayOrders.length, revenue: Math.round(dayOrders.reduce((s: number, o: any) => s + o.totalPrice, 0)) };
    });

    /* orders by team — top 6 */
    const teamMap: Record<string, number> = {};
    all.forEach((o: any) => { teamMap[o.teamName] = (teamMap[o.teamName] || 0) + 1; });
    const byTeam = Object.entries(teamMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([team, count]) => ({ team: team.length > 12 ? team.slice(0, 12) + "…" : team, count }));

    /* by status */
    const statusLabels: Record<string, string> = {
      pending: "معلّق", confirmed: "مؤكّد", shipped: "شُحن",
      delivered: "مُسلَّم", cancelled: "ملغي",
    };
    const statusMap: Record<string, number> = {};
    all.forEach((o: any) => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
    const byStatus = Object.entries(statusMap)
      .map(([status, count]) => ({ status, label: statusLabels[status] || status, count }));

    /* by size */
    const sizeMap: Record<string, number> = {};
    all.forEach((o: any) => { sizeMap[o.size] = (sizeMap[o.size] || 0) + 1; });
    const bySizes = Object.entries(sizeMap)
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => b.count - a.count);

    res.json({ dailyOrders, byTeam, byStatus, bySizes });
  } catch (err) {
    req.log.error({ err }, "admin: failed to get chart stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ════════════════════════════════════════════════════
   VISITOR TRACKING
════════════════════════════════════════════════════ */

/* Public — called by customer app on each new session */
router.post("/track-visit", async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const { data: existing } = await supabase
      .from("visitors").select("date, count").eq("date", today).maybeSingle();
    if (existing) {
      await supabase.from("visitors").update({ count: existing.count + 1 }).eq("date", today);
    } else {
      await supabase.from("visitors").insert({ date: today, count: 1 });
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "track-visit failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* Admin — returns today + last 7 days */
router.get("/admin/stats/visitors", async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from("visitors")
      .select("*")
      .order("date", { ascending: false })
      .limit(30);
    if (error) throw error;

    const today = new Date().toISOString().slice(0, 10);
    const todayRow  = rows?.find(r => r.date === today);
    const todayCount = todayRow?.count ?? 0;
    const totalCount = (rows || []).reduce((s, r) => s + r.count, 0);

    const last7: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const row = rows?.find(r => r.date === key);
      last7.push({ date: key.slice(5), count: row?.count ?? 0 });
    }

    res.json({ today: todayCount, total: totalCount, last7 });
  } catch (err) {
    req.log.error({ err }, "admin: visitors stats failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ═══════════════════════════════════════════════════
   MARKETPLACE — Shops
═══════════════════════════════════════════════════ */

router.get("/admin/marketplace/shops", async (req, res) => {
  try {
    const { data, error } = await supabase.from("shops").select("*").order("name", { ascending: true });
    if (error) throw error;
    res.json(toCamelCaseArr(data || []));
  } catch (err) {
    req.log.error({ err }, "admin: shops list failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/marketplace/shops", async (req, res) => {
  try {
    const { name, slug, description, logo, contactPhone, commissionPercent, isActive } = req.body;
    if (!name || !slug) { res.status(400).json({ error: "Name and slug required" }); return; }
    const { data: shop, error } = await supabase.from("shops").insert({
      name, slug, description, logo,
      contact_phone: contactPhone,
      commission_percent: commissionPercent ?? 15,
      is_active: isActive ?? true,
    }).select().single();
    if (error) throw error;
    res.status(201).json(toCamelCaseSingle(shop));
  } catch (err) {
    req.log.error({ err }, "admin: create shop failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/marketplace/shops/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body;
    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.slug !== undefined) update.slug = body.slug;
    if (body.description !== undefined) update.description = body.description;
    if (body.logo !== undefined) update.logo = body.logo;
    if (body.contactPhone !== undefined) update.contact_phone = body.contactPhone;
    if (body.commissionPercent !== undefined) update.commission_percent = body.commissionPercent;
    if (body.isActive !== undefined) update.is_active = body.isActive;
    const { data: shop, error } = await supabase.from("shops").update(update).eq("id", id).select().single();
    if (error || !shop) { res.status(404).json({ error: "not found" }); return; }
    res.json(toCamelCaseSingle(shop));
  } catch (err) {
    req.log.error({ err }, "admin: update shop failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/marketplace/shops/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await supabase.from("shops").delete().eq("id", id);
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "admin: delete shop failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ═══════════════════════════════════════════════════
   MARKETPLACE — Designs
═══════════════════════════════════════════════════ */

router.get("/admin/marketplace/designs", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("marketplace_designs")
      .select("id, shop_id, title, description, image_url, price, category, tags, is_active, created_at, shops!inner(name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const mapped = (data || []).map((d: any) => ({
      id: d.id,
      shopId: d.shop_id,
      title: d.title,
      description: d.description,
      imageUrl: d.image_url,
      price: d.price,
      category: d.category,
      tags: d.tags,
      isActive: d.is_active,
      createdAt: d.created_at,
      shopName: d.shops?.name,
    }));
    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "admin: designs list failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/marketplace/designs", async (req, res) => {
  try {
    const { shopId, title, description, imageUrl, price, category, tags, isActive } = req.body;
    if (!shopId || !title || !imageUrl || !price) {
      res.status(400).json({ error: "Missing required fields" }); return;
    }
    const { data: design, error } = await supabase.from("marketplace_designs").insert({
      shop_id: shopId,
      title, description,
      image_url: imageUrl,
      price,
      category: category ?? "عام", tags, is_active: isActive ?? true,
    }).select().single();
    if (error) throw error;
    res.status(201).json(toCamelCaseSingle(design));
  } catch (err) {
    req.log.error({ err }, "admin: create design failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/marketplace/designs/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body;
    const update: Record<string, unknown> = {};
    if (body.shopId !== undefined) update.shop_id = body.shopId;
    if (body.title !== undefined) update.title = body.title;
    if (body.description !== undefined) update.description = body.description;
    if (body.imageUrl !== undefined) update.image_url = body.imageUrl;
    if (body.price !== undefined) update.price = body.price;
    if (body.category !== undefined) update.category = body.category;
    if (body.tags !== undefined) update.tags = body.tags;
    if (body.isActive !== undefined) update.is_active = body.isActive;
    const { data: design, error } = await supabase
      .from("marketplace_designs").update(update).eq("id", id).select().single();
    if (error || !design) { res.status(404).json({ error: "not found" }); return; }
    res.json(toCamelCaseSingle(design));
  } catch (err) {
    req.log.error({ err }, "admin: update design failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/marketplace/designs/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await supabase.from("marketplace_designs").delete().eq("id", id);
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "admin: delete design failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ═══════════════════════════════════════════════════
   MARKETPLACE — Orders
═══════════════════════════════════════════════════ */

router.get("/admin/marketplace/orders", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("marketplace_orders")
      .select("id, design_id, shop_id, customer_name, customer_phone, customer_city, governorate, quantity, total_price, status, notes, created_at, marketplace_designs!inner(title), shops!inner(name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const mapped = (data || []).map((d: any) => ({
      id: d.id,
      designTitle: d.marketplace_designs?.title,
      shopName: d.shops?.name,
      customerName: d.customer_name,
      customerPhone: d.customer_phone,
      customerCity: d.customer_city,
      governorate: d.governorate,
      quantity: d.quantity,
      totalPrice: d.total_price,
      status: d.status,
      notes: d.notes,
      createdAt: d.created_at,
    }));
    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "admin: marketplace orders list failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/marketplace/orders/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!status) { res.status(400).json({ error: "Status required" }); return; }
    const { data: order, error } = await supabase
      .from("marketplace_orders").update({ status }).eq("id", id).select().single();
    if (error) throw error;
    res.json(toCamelCaseSingle(order));
  } catch (err) {
    req.log.error({ err }, "admin: update marketplace order status failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ═══════════════════════════════════════════════════
   SITE SETTINGS
═══════════════════════════════════════════════════ */

/* Public — get all settings as key→value map */
router.get("/settings", async (req, res) => {
  try {
    const { data: rows, error } = await supabase.from("settings").select("*");
    if (error) throw error;
    const map: Record<string, string> = {};
    for (const r of (rows || [])) map[r.key] = r.value;
    res.json(map);
  } catch (err) {
    req.log.error({ err }, "settings: list failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* Admin — upsert settings */
router.patch("/admin/settings", async (req, res) => {
  const body = req.body as Record<string, string>;
  try {
    for (const [key, value] of Object.entries(body)) {
      if (typeof key !== "string" || typeof value !== "string") continue;
      const { data: existing } = await supabase
        .from("settings").select("key").eq("key", key).maybeSingle();
      if (existing) {
        await supabase.from("settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
      } else {
        await supabase.from("settings").insert({ key, value, updated_at: new Date().toISOString() });
      }
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "settings: update failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
