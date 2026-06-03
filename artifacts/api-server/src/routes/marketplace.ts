import { Router } from "express";
import { supabase, toCamelCaseArr, toCamelCaseSingle } from "../lib/supabase-db";

function parseImages(val: string): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [val];
  } catch {
    return [val];
  }
}

const router = Router();

router.get("/marketplace/shops", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) throw error;
    res.json(toCamelCaseArr(data || []));
  } catch (err) {
    req.log.error({ err }, "marketplace: list shops failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/marketplace/designs", async (req, res) => {
  try {
    const { category, shopId } = req.query as Record<string, string | undefined>;
    let query = supabase
      .from("marketplace_designs")
      .select("*, shops!inner(name, logo)")
      .eq("is_active", true);

    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    if (shopId) {
      query = query.eq("shop_id", Number(shopId));
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;

    const rows = (data || []).map((row: any) => ({
      ...toCamelCaseSingle(row),
      images: parseImages(row.image_url),
      image_url: parseImages(row.image_url)[0] || row.image_url,
      shop_name: row.shops?.name,
      shop_logo: row.shops?.logo,
    }));
    const result = rows.map((r: any) => {
      const { shops, ...rest } = r;
      return rest;
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "marketplace: list designs failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/marketplace/designs/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { data, error } = await supabase
      .from("marketplace_designs")
      .select("*, shops!inner(name, logo, contact_phone)")
      .eq("id", id)
      .eq("is_active", true)
      .single();
    if (error || !data) { res.status(404).json({ error: "not found" }); return; }

    const row = {
      ...toCamelCaseSingle(data),
      images: parseImages(data.image_url),
      shop_name: data.shops?.name,
      shop_logo: data.shops?.logo,
      shop_contact: data.shops?.contact_phone,
    };
    const { shops, ...rest } = row;
    res.json(rest);
  } catch (err) {
    req.log.error({ err }, "marketplace: get design failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/marketplace/orders", async (req, res) => {
  try {
    const { designId, customerName, customerPhone, customerCity, governorate, address, quantity, notes } = req.body;

    if (!designId || !customerName || !customerPhone || !customerCity) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const { data: design, error: designErr } = await supabase
      .from("marketplace_designs")
      .select("id, price, shop_id, title")
      .eq("id", designId)
      .single();
    if (designErr || !design) { res.status(404).json({ error: "Design not found" }); return; }

    const qty = Math.max(1, Math.min(99, Number(quantity) || 1));
    const totalPrice = design.price * qty;

    const { data: order, error: orderErr } = await supabase
      .from("marketplace_orders")
      .insert({
        design_id: design.id,
        shop_id: design.shop_id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_city: customerCity,
        governorate: governorate || "عمان",
        address,
        quantity: qty,
        total_price: totalPrice,
        status: "pending",
        notes,
      })
      .select()
      .single();
    if (orderErr) throw orderErr;

    res.status(201).json(toCamelCaseSingle(order));
  } catch (err) {
    req.log.error({ err }, "marketplace: create order failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/marketplace/orders/by-phone", async (req, res) => {
  try {
    const phone = (req.query.phone as string) ?? "";
    if (!/^07\d{8}$/.test(phone)) {
      res.status(400).json({ error: "Invalid phone number" });
      return;
    }
    const { data, error } = await supabase
      .from("marketplace_orders")
      .select("id, quantity, total_price, status, created_at, marketplace_designs!inner(title, price)")
      .eq("customer_phone", phone)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const rows = (data || []).map((row: any) => toCamelCaseSingle({
      id: row.id,
      quantity: row.quantity,
      total_price: row.total_price,
      status: row.status,
      created_at: row.created_at,
      design_title: row.marketplace_designs?.title,
      price: row.marketplace_designs?.price,
    }));
    const result = rows.map((r: any) => {
      const { marketplace_designs, ...rest } = r;
      return rest;
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "marketplace: order tracking failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/marketplace/categories", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("marketplace_designs")
      .select("category")
      .eq("is_active", true)
      .order("category", { ascending: true });
    if (error) throw error;

    const unique = [...new Set((data || []).map((r: any) => r.category))];
    res.json(unique);
  } catch (err) {
    req.log.error({ err }, "marketplace: categories failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
