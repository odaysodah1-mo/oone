import { Router } from "express";
import { createHmac } from "crypto";
import { CreateOrderBody } from "@workspace/api-zod";
import { adminAuth } from "../middleware/adminAuth";
import { sendOrderWhatsApp, makeWaUrl } from "../lib/whatsapp";
import { supabase, toCamelCaseArr, toCamelCaseSingle } from "../lib/supabase-db";

const router = Router();
const SECRET = process.env.SESSION_SECRET ?? "";
const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";

function generateConfirmToken(orderId: number): string {
  const data = `${orderId}:${SECRET}`;
  return createHmac("sha256", SECRET).update(data).digest("hex").slice(0, 16);
}

router.get("/orders", adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(toCamelCaseArr(data || []));
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

  if (!/^07\d{8}$/.test(data.customerPhone)) {
    res.status(400).json({ error: "رقم الهاتف غير صالح" });
    return;
  }

  try {
    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .select("*")
      .eq("id", data.teamId)
      .single();
    if (teamErr || !team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    const teamSnake = team;

    let unitPrice = teamSnake.base_price;
    const jerseyColorId =
      typeof (req.body as Record<string, unknown>).jerseyColorId === "number"
        ? (req.body as Record<string, unknown>).jerseyColorId as number
        : null;

    if (jerseyColorId) {
      const { data: color } = await supabase
        .from("jersey_colors")
        .select("*")
        .eq("id", jerseyColorId)
        .single();
      if (color) {
        const hasCustomization = !!(data.playerName && data.playerName.trim());
        const colorPrice = hasCustomization
          ? color.price_with_customization
          : color.price_without_customization;
        if (colorPrice !== null && colorPrice !== undefined) {
          unitPrice = colorPrice;
        }
      }
    }

    const discount = teamSnake.discount_percent ?? 0;
    const discountedUnitPrice = discount > 0
      ? Math.round(unitPrice * (1 - discount / 100))
      : unitPrice;
    let totalPrice = discountedUnitPrice * data.quantity;
    const rawBody = req.body as Record<string, unknown>;

    const customPhrase = typeof rawBody.customPhrase === "string"
      ? rawBody.customPhrase.trim().slice(0, 60) || null
      : null;
    const notes = typeof rawBody.notes === "string"
      ? rawBody.notes.trim().slice(0, 300) || null
      : null;

    let phrasePrintPrice = 0;
    if (customPhrase) {
      const { data: setting } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "phrase_print_price")
        .single();
      phrasePrintPrice = parseInt(setting?.value ?? "0", 10) || 0;
      totalPrice += phrasePrintPrice;
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        team_id: data.teamId,
        team_name: teamSnake.name,
        customer_name: data.customerName,
        jersey_number: data.jerseyNumber,
        size: data.size,
        color: data.color,
        quantity: data.quantity,
        total_price: totalPrice,
        customer_phone: data.customerPhone,
        customer_city: data.customerCity,
        status: "pending",
        governorate: typeof rawBody.governorate === "string" ? rawBody.governorate : "عمان",
        player_name: data.playerName ?? null,
        front_image_url: data.frontImageUrl ?? null,
        back_image_url: data.backImageUrl ?? null,
        jersey_color_name: data.jerseyColorName ?? null,
        custom_phrase: customPhrase,
        phrase_print_price: phrasePrintPrice || null,
        notes,
        address: typeof rawBody.address === "string" ? rawBody.address.trim().slice(0, 300) || null : null,
      })
      .select()
      .single();
    if (orderErr) throw orderErr;

    await supabase
      .from("teams")
      .update({ order_count: teamSnake.order_count + data.quantity })
      .eq("id", data.teamId);

    const camelOrder = toCamelCaseSingle(order);
    const confirmToken = generateConfirmToken(camelOrder.id);
    const waUrl = makeWaUrl(camelOrder.customerPhone, camelOrder.id, teamSnake.name, confirmToken);

    sendOrderWhatsApp(camelOrder.customerPhone, camelOrder.id, teamSnake.name, confirmToken);

    res.status(201).json({ ...camelOrder, confirmToken, confirmUrl: waUrl.split("?text=")[0], waUrl });
  } catch (err) {
    req.log.error({ err }, "Failed to create order");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/by-phone", async (req, res) => {
  const phone = typeof req.query.phone === "string" ? req.query.phone.trim() : null;
  if (!phone) { res.status(400).json({ error: "phone required" }); return; }
  if (!/^07\d{8}$/.test(phone)) { res.status(400).json({ error: "رقم الهاتف غير صالح" }); return; }
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("id, team_name, jersey_number, size, color, quantity, total_price, status, created_at, jersey_color_name, player_name")
      .eq("customer_phone", phone)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(toCamelCaseArr(data || []));
  } catch (err) {
    req.log.error({ err }, "Failed to track orders by phone");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/stats", async (req, res) => {
  try {
    const { count: total, error: tErr } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });
    if (tErr) throw tErr;

    const { data: revData, error: rErr } = await supabase
      .from("orders")
      .select("total_price");
    if (rErr) throw rErr;

    const totalRevenue = (revData || []).reduce((s: number, r: any) => s + (r.total_price || 0), 0);

    const { data: allOrders, error: aErr } = await supabase
      .from("orders")
      .select("team_name, size, color, quantity");
    if (aErr) throw aErr;

    const teamCounts: Record<string, number> = {};
    const sizeCounts: Record<string, number> = {};
    const colorCounts: Record<string, number> = {};
    for (const o of allOrders || []) {
      teamCounts[o.team_name] = (teamCounts[o.team_name] || 0) + (o.quantity || 1);
      sizeCounts[o.size] = (sizeCounts[o.size] || 0) + 1;
      colorCounts[o.color] = (colorCounts[o.color] || 0) + 1;
    }
    const topTeam = Object.entries(teamCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "ريال مدريد";
    const popularSize = Object.entries(sizeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "L";
    const popularColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "#FFFFFF";

    res.json({
      totalOrders: Number(total) || 0,
      totalRevenue,
      topTeam,
      popularSize,
      popularColor,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/confirm", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const id = parseInt(req.query.id as string, 10);

  if (!token || isNaN(id)) {
    res.status(400).json({ error: "Invalid confirmation link" });
    return;
  }

  const expectedToken = generateConfirmToken(id);
  if (token !== expectedToken) {
    res.status(400).json({ error: "Invalid confirmation link" });
    return;
  }

  try {
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (["confirmed", "shipped", "delivered"].includes(order.status)) {
      res.redirect(`${BASE_URL}/track?phone=${order.customer_phone}&confirmed=already`);
      return;
    }

    await supabase
      .from("orders")
      .update({ status: "confirmed" })
      .eq("id", id);

    res.redirect(`${BASE_URL}/track?phone=${order.customer_phone}&confirmed=ok`);
  } catch (err) {
    req.log.error({ err }, "Failed to confirm order");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
