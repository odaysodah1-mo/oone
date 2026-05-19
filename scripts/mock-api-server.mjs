import http from "http";
import { readFileSync, existsSync } from "fs";
import crypto from "crypto";

const PORT = process.env.MOCK_API_PORT || 3000;
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "jerseys";
const USE_SUPABASE_STORAGE = !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
const uploadedFiles = new Map();
const JERSEYS_DIR = "C:\\Users\\MSI\\Downloads\\Team-Design (1)\\Team-Design\\artifacts\\basmah\\public\\jerseys";

/* ── Upload to Supabase Storage ── */
async function supabaseUpload(objectPath, buf, contentType) {
  const url = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${objectPath}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": contentType || "image/png",
    },
    body: buf,
  });
  if (!res.ok) throw new Error(`Supabase upload failed: ${res.status}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${objectPath}`;
}

function getBodyBuffer(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

const rawTeams = [
  { id: 1, name: "برشلونة", nameEn: "Barcelona", league: "La Liga", country: "Spain", primaryColor: "#A50044", secondaryColor: "#004D98", availableColors: ["#A50044", "#004D98", "#FFED02"], availableSizes: ["XS", "S", "M", "L", "XL", "XXL"], basePrice: 89, logoUrl: null, orderCount: 120, isPopular: true, discountPercent: 0 },
  { id: 2, name: "ريال مدريد", nameEn: "Real Madrid", league: "La Liga", country: "Spain", primaryColor: "#FEBE10", secondaryColor: "#000000", availableColors: ["#FEBE10", "#000000"], availableSizes: ["XS", "S", "M", "L", "XL", "XXL"], basePrice: 89, logoUrl: null, orderCount: 150, isPopular: true, discountPercent: 0 },
  { id: 3, name: "الأرجنتين", nameEn: "Argentina", league: "International", country: "Argentina", primaryColor: "#75AADB", secondaryColor: "#FFFFFF", availableColors: ["#75AADB", "#FFFFFF"], availableSizes: ["XS", "S", "M", "L", "XL", "XXL"], basePrice: 99, logoUrl: null, orderCount: 200, isPopular: true, discountPercent: 0 },
  { id: 4, name: "البرازيل", nameEn: "Brazil", league: "International", country: "Brazil", primaryColor: "#F7C221", secondaryColor: "#009739", availableColors: ["#F7C221", "#009739", "#003F87"], availableSizes: ["XS", "S", "M", "L", "XL", "XXL"], basePrice: 99, logoUrl: null, orderCount: 180, isPopular: true, discountPercent: 0 },
  { id: 5, name: "ألمانيا", nameEn: "Germany", league: "International", country: "Germany", primaryColor: "#000000", secondaryColor: "#FFFFFF", availableColors: ["#000000", "#FFFFFF"], availableSizes: ["XS", "S", "M", "L", "XL", "XXL"], basePrice: 99, logoUrl: null, orderCount: 95, isPopular: false, discountPercent: 0 },
  { id: 6, name: "فرنسا", nameEn: "France", league: "International", country: "France", primaryColor: "#002395", secondaryColor: "#FFFFFF", availableColors: ["#002395", "#FFFFFF", "#ED2939"], availableSizes: ["XS", "S", "M", "L", "XL", "XXL"], basePrice: 99, logoUrl: null, orderCount: 110, isPopular: true, discountPercent: 0 },
  { id: 7, name: "الهلال", nameEn: "Al Hilal", league: "Saudi League", country: "Saudi Arabia", primaryColor: "#0031A5", secondaryColor: "#FFFFFF", availableColors: ["#0031A5", "#FFFFFF"], availableSizes: ["XS", "S", "M", "L", "XL", "XXL"], basePrice: 79, logoUrl: null, orderCount: 85, isPopular: false, discountPercent: 0 },
  { id: 8, name: "النصر", nameEn: "Al Nassr", league: "Saudi League", country: "Saudi Arabia", primaryColor: "#FCD301", secondaryColor: "#0055A5", availableColors: ["#FCD301", "#0055A5"], availableSizes: ["XS", "S", "M", "L", "XL", "XXL"], basePrice: 79, logoUrl: null, orderCount: 90, isPopular: false, discountPercent: 0 },
];

const teams = rawTeams.map(t => ({ ...t }));

function makeJerseyImageUrl(id, teamId, hexCode, name, isBack) {
  const imgs = TEAM_JERSEY_IMAGES[teamId];
  const file = imgs && (isBack ? imgs.back : imgs.front);
  if (file) {
    return `/api/jersey-file/${file}?name=${encodeURIComponent(name)}&color=${encodeURIComponent(hexCode)}`;
  }
  return `/api/jersey-image/${id}?color=${encodeURIComponent(hexCode)}&name=${encodeURIComponent(name)}`;
}

const TEAM_JERSEY_IMAGES = {
  1: { front: "faisali.png", back: null },          // برشلونة → faisali (blue/red style)
  2: { front: "faisali.png", back: null },           // ريال مدريد
  3: { front: "jordan.png", back: "jordan-back.png" },  // الأرجنتين → jordan (stripes)
  4: { front: "jordan-real.png", back: "jordan-back.png" }, // البرازيل
  5: { front: "wehdat.png", back: null },            // ألمانيا → wehdat (green)
  6: { front: "wehdat.png", back: null },            // فرنسا
  7: { front: "jordan.png", back: "jordan-back.png" },  // الهلال
  8: { front: "faisali.png", back: null },           // النصر
};

const jerseyColors = [
  { id: 1, teamId: 1, name: "أحمر", hexCode: "#A50044", secondaryHexCode: "#004D98", isDefault: true, sortOrder: 0, isSoldOut: false, priceWithCustomization: 89, priceWithoutCustomization: 69 },
  { id: 2, teamId: 2, name: "ذهبي", hexCode: "#FEBE10", secondaryHexCode: "#000000", isDefault: true, sortOrder: 0, isSoldOut: false, priceWithCustomization: 89, priceWithoutCustomization: 69 },
  { id: 3, teamId: 3, name: "أزرق", hexCode: "#75AADB", secondaryHexCode: "#FFFFFF", isDefault: true, sortOrder: 0, isSoldOut: false, priceWithCustomization: 99, priceWithoutCustomization: 79 },
  { id: 4, teamId: 4, name: "أصفر", hexCode: "#F7C221", secondaryHexCode: "#009739", isDefault: true, sortOrder: 0, isSoldOut: false, priceWithCustomization: 99, priceWithoutCustomization: 79 },
  { id: 5, teamId: 6, name: "أزرق", hexCode: "#002395", secondaryHexCode: "#FFFFFF", isDefault: true, sortOrder: 0, isSoldOut: false, priceWithCustomization: 99, priceWithoutCustomization: 79 },
];

// Add computed image URLs
jerseyColors.forEach(c => {
  c.frontImageUrl = makeJerseyImageUrl(c.id, c.teamId, c.hexCode, c.name, false);
  c.backImageUrl = makeJerseyImageUrl(c.id, c.teamId, c.secondaryHexCode, c.name, true);
});

const settings = { phrase_print_price: 15 };
let orders = [];
let orderIdCounter = 1;
const nahfat = [{ id: 1, name: "كلاسيك", nameEn: "Classic", svgContent: "<svg><text>كلاسيك</text></svg>", isActive: true }];
const stickers = [{ id: 1, name: "نجمة", nameEn: "Star", svgContent: "<svg><text>⭐</text></svg>", isActive: true }];

function svgPlaceholder(color, label) {
  const hex = color.replace("#", "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
    <rect width="200" height="240" fill="${color}" rx="16"/>
    <rect x="20" y="20" width="160" height="200" rx="12" fill="rgba(255,255,255,0.15)"/>
    <circle cx="100" cy="60" r="20" fill="rgba(255,255,255,0.3)"/>
    <text x="100" y="140" text-anchor="middle" font-size="16" fill="white" font-weight="bold">${label}</text>
    <text x="100" y="170" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.7)">${hex.toUpperCase()}</text>
  </svg>`;
}

function jerseySvg(req, res, color, label) {
  const svg = svgPlaceholder(color, label);
  const headers = { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" };
  headers["Access-Control-Allow-Origin"] = corsOrigin(req);
  res.writeHead(200, headers);
  res.end(svg);
}

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174,http://localhost:3000").split(",").map(s => s.trim());
function corsOrigin(req) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin;
  return ALLOWED_ORIGINS[0] || "*";
}
const CORS_HEADERS = { "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization,x-admin-key" };
function setCors(req, res) {
  const origin = corsOrigin(req);
  res.setHeader("Access-Control-Allow-Origin", origin);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
}

function json(res, data, status = 200) {
  const body = JSON.stringify(data);
  const headers = { "Content-Type": "application/json" };
  Object.entries(CORS_HEADERS).forEach(([k, v]) => headers[k] = v);
  res.writeHead(status, headers);
  res.end(body);
}

function getBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", c => data += c);
    req.on("end", () => {
      try { resolve(JSON.parse(data || "{}")); }
      catch { resolve({}); }
    });
  });
}

function parseUrl(url) {
  const [path, qs] = url.split("?");
  const params = {};
  if (qs) qs.split("&").forEach(p => { const [k, v] = p.split("="); params[k] = decodeURIComponent(v || ""); });
  return { path, params };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    setCors(req, res);
    res.writeHead(204);
    return res.end();
  }

  const { path, params } = parseUrl(req.url);

  /* ── Admin auth guard for mock server ── */
  if (path.startsWith("/api/admin") || (req.method === "POST" && path === "/api/storage/uploads/request-url")) {
    const key = req.headers["x-admin-key"];
    if (!ADMIN_SECRET || key !== ADMIN_SECRET) {
      json(res, { error: "Unauthorized" }, 401);
      return;
    }
  }

  if (path === "/api/healthz") return json(res, { status: "ok" });

  // Teams
  if (path === "/api/teams" && req.method === "GET") return json(res, teams);
  if (path === "/api/teams/popular" && req.method === "GET") return json(res, teams.filter(t => t.isPopular));
  const teamMatch = path.match(/^\/api\/teams\/(\d+)$/);
  if (teamMatch && req.method === "GET") {
    const t = teams.find(x => x.id === Number(teamMatch[1]));
    return t ? json(res, t) : json(res, { error: "Not found" }, 404);
  }

  // Jersey colors
  const adminColors = path.match(/^\/api\/admin\/teams\/(\d+)\/colors$/);
  if (adminColors && req.method === "GET") return json(res, jerseyColors.filter(c => c.teamId === Number(adminColors[1])));
  if (adminColors && req.method === "POST") {
    const body = await getBody(req);
    const nc = { id: jerseyColors.length + 1, teamId: Number(adminColors[1]), ...body };
    jerseyColors.push(nc);
    return json(res, nc, 201);
  }
  const jerseyMatch = path.match(/^\/api\/teams\/(\d+)\/jersey-colors$/);
  if (jerseyMatch && req.method === "GET") return json(res, jerseyColors.filter(c => c.teamId === Number(jerseyMatch[1])));
  const colorPatch = path.match(/^\/api\/admin\/teams\/(\d+)\/colors\/(\d+)$/);
  if (colorPatch && req.method === "PATCH") {
    const c = jerseyColors.find(x => x.id === Number(colorPatch[2]));
    if (c) Object.assign(c, await getBody(req));
    return json(res, c || { error: "Not found" }, c ? 200 : 404);
  }
  if (colorPatch && req.method === "DELETE") {
    const idx = jerseyColors.findIndex(x => x.id === Number(colorPatch[2]));
    if (idx > -1) jerseyColors.splice(idx, 1);
    res.writeHead(204); return res.end();
  }

  // Orders
  if (path === "/api/orders" && req.method === "GET") return json(res, orders);
  if (path === "/api/orders" && req.method === "POST") {
    const body = await getBody(req);
    const o = { id: orderIdCounter++, ...body, status: "pending", createdAt: new Date().toISOString(), teamName: "Team", totalPrice: 89 };
    orders.push(o);
    return json(res, o, 201);
  }
  if (path === "/api/orders/by-phone" && req.method === "GET") {
    const phone = params.phone;
    if (!phone || !/^07\d{8}$/.test(phone)) return json(res, { error: "Invalid phone" }, 400);
    return json(res, orders.filter(o => o.customerPhone === phone).map(o => ({ id: o.id, status: o.status, createdAt: o.createdAt })));
  }
  if (path === "/api/orders/stats" && req.method === "GET") return json(res, { totalOrders: orders.length, totalRevenue: orders.reduce((s, o) => s + (o.totalPrice || 0), 0), topTeam: "برشلونة", popularSize: "L", popularColor: "#A50044" });

  // Admin orders
  const statusPatch = path.match(/^\/api\/admin\/orders\/(\d+)\/status$/);
  if (statusPatch && req.method === "PATCH") {
    const o = orders.find(x => x.id === Number(statusPatch[1]));
    if (o) o.status = (await getBody(req)).status;
    return json(res, o || { error: "Not found" }, o ? 200 : 404);
  }
  if (path === "/api/admin/orders/delivered" && req.method === "DELETE") {
    orders = orders.filter(o => o.status !== "delivered");
    res.writeHead(204); return res.end();
  }
  if (path === "/api/admin/orders" && req.method === "GET") return json(res, orders);

  // Admin teams
  if (path === "/api/admin/teams" && req.method === "GET") return json(res, teams.map(t => ({ ...t, jerseyColors: jerseyColors.filter(c => c.teamId === t.id) })));
  if (path === "/api/admin/teams" && req.method === "POST") {
    const body = await getBody(req);
    const nt = { id: teams.length + 1, orderCount: 0, isPopular: false, discountPercent: 0, ...body, availableColors: body.availableColors || [], availableSizes: body.availableSizes || [] };
    teams.push(nt);
    return json(res, nt, 201);
  }
  const teamPatch = path.match(/^\/api\/admin\/teams\/(\d+)$/);
  if (teamPatch && req.method === "PATCH") {
    const t = teams.find(x => x.id === Number(teamPatch[1]));
    if (t) Object.assign(t, await getBody(req));
    return json(res, t || { error: "Not found" }, t ? 200 : 404);
  }
  if (teamPatch && req.method === "DELETE") {
    const idx = teams.findIndex(x => x.id === Number(teamPatch[1]));
    if (idx > -1) teams.splice(idx, 1);
    res.writeHead(204); return res.end();
  }

  // Branch
  if (path === "/api/branch/login" && req.method === "POST") return json(res, { token: "mock-token-123", branch: { id: 1, governorate: "عمان", commissionRate: 0.1 } });
  if (path === "/api/branch/orders" && req.method === "GET") return json(res, orders);
  const branchStatus = path.match(/^\/api\/branch\/orders\/(\d+)\/status/);
  if (branchStatus && req.method === "PATCH") {
    const o = orders.find(x => x.id === Number(branchStatus[1]));
    if (o) o.status = (await getBody(req)).status;
    return json(res, o || { error: "Not found" }, o ? 200 : 404);
  }
  if (path === "/api/branch/stats" && req.method === "GET") return json(res, { totalOrders: orders.length, totalRevenue: orders.reduce((s, o) => s + (o.totalPrice || 0), 0), commission: 0 });
  if (path === "/api/admin/branches" && req.method === "GET") return json(res, [{ id: 1, username: "branch1", governorate: "عمان", commissionRate: 0.1, active: true, totalOrders: 5, revenue: 445, commission: 44 }]);
  if (path === "/api/admin/branches" && req.method === "POST") {
    const body = await getBody(req);
    if (body.commissionRate !== undefined) body.commissionRate = Number(body.commissionRate);
    return json(res, { id: 2, ...body }, 201);
  }
  const branchPatch = path.match(/^\/api\/admin\/branches\/(\d+)$/);
  if (branchPatch && req.method === "PATCH") {
    const body = await getBody(req);
    if (body.commissionRate !== undefined) body.commissionRate = Number(body.commissionRate);
    return json(res, { id: Number(branchPatch[1]), ...body });
  }
  if (branchPatch && req.method === "DELETE") { res.writeHead(204); return res.end(); }

  // Nahfat
  if (path === "/api/nahfat" && req.method === "GET") return json(res, nahfat);
  if (path === "/api/admin/nahfat" && req.method === "GET") return json(res, nahfat);
  if (path === "/api/admin/nahfat" && req.method === "POST") {
    const n = { id: nahfat.length + 1, ...await getBody(req) };
    nahfat.push(n); return json(res, n, 201);
  }
  const nahfatMatch = path.match(/^\/api\/admin\/nahfat\/(\d+)$/);
  if (nahfatMatch && req.method === "PUT") {
    const n = nahfat.find(x => x.id === Number(nahfatMatch[1]));
    if (n) Object.assign(n, await getBody(req));
    return json(res, n || { error: "Not found" }, n ? 200 : 404);
  }
  if (nahfatMatch && req.method === "DELETE") {
    const idx = nahfat.findIndex(x => x.id === Number(nahfatMatch[1]));
    if (idx > -1) nahfat.splice(idx, 1);
    res.writeHead(204); return res.end();
  }

  // Stickers
  if (path === "/api/stickers" && req.method === "GET") return json(res, stickers);
  if (path === "/api/admin/stickers" && req.method === "GET") return json(res, stickers);
  if (path === "/api/admin/stickers" && req.method === "POST") {
    const s = { id: stickers.length + 1, ...await getBody(req) };
    stickers.push(s); return json(res, s, 201);
  }
  const stickerMatch = path.match(/^\/api\/admin\/stickers\/(\d+)$/);
  if (stickerMatch && req.method === "PUT") {
    const s = stickers.find(x => x.id === Number(stickerMatch[1]));
    if (s) Object.assign(s, await getBody(req));
    return json(res, s || { error: "Not found" }, s ? 200 : 404);
  }
  if (stickerMatch && req.method === "DELETE") {
    const idx = stickers.findIndex(x => x.id === Number(stickerMatch[1]));
    if (idx > -1) stickers.splice(idx, 1);
    res.writeHead(204); return res.end();
  }

  // Settings
  if (path === "/api/settings" && req.method === "GET") return json(res, settings);
  if (path === "/api/admin/settings" && req.method === "PATCH") {
    Object.assign(settings, await getBody(req));
    return json(res, settings);
  }

  // Stats
  if (path === "/api/admin/stats/charts" && req.method === "GET") return json(res, {
    dailyOrders: [
      { date: "19 مايو", revenue: 445, orders: 5 },
      { date: "18 مايو", revenue: 267, orders: 3 },
      { date: "17 مايو", revenue: 534, orders: 6 },
      { date: "16 مايو", revenue: 178, orders: 2 },
      { date: "15 مايو", revenue: 356, orders: 4 },
      { date: "14 مايو", revenue: 445, orders: 5 },
      { date: "13 مايو", revenue: 89, orders: 1 },
    ],
    byStatus: [
      { status: "pending", label: "قيد الانتظار", count: 2 },
      { status: "confirmed", label: "مؤكد", count: 3 },
      { status: "shipped", label: "تم الشحن", count: 1 },
      { status: "delivered", label: "تم التوصيل", count: 4 },
    ],
    byTeam: [
      { teamName: "برشلونة", orders: 5, revenue: 445 },
      { teamName: "ريال مدريد", orders: 4, revenue: 356 },
      { teamName: "الأرجنتين", orders: 3, revenue: 267 },
      { teamName: "فرنسا", orders: 2, revenue: 178 },
      { teamName: "البرازيل", orders: 1, revenue: 99 },
    ],
  });
  if (path === "/api/admin/stats/visitors" && req.method === "GET") return json(res, { today: 42, thisWeek: 256, thisMonth: 1024, lastMonth: 980, total: 15200, last7: [{ date: "19 مايو", count: 42 }, { date: "18 مايو", count: 38 }, { date: "17 مايو", count: 52 }, { date: "16 مايو", count: 41 }, { date: "15 مايو", count: 39 }, { date: "14 مايو", count: 55 }, { date: "13 مايو", count: 30 }] });
  if (path === "/api/track-visit" && req.method === "POST") { res.writeHead(204); return res.end(); }

  // Storage upload request
  if (path === "/api/storage/uploads/request-url" && req.method === "POST") {
    const body = await getBody(req);
    const uuid = crypto.randomUUID();
    const ext = (body.name || "file.png").split(".").pop() || "png";
    const objectPath = `uploads/${uuid}.${ext}`;

    if (USE_SUPABASE_STORAGE) {
      // Return upload URL pointing directly to Supabase Storage
      const uploadURL = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${objectPath}`;
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${objectPath}`;
      return json(res, { uploadURL, objectPath: `/${objectPath}`, publicUrl, metadata: { name: body.name, size: body.size, contentType: body.contentType } });
    }

    // Fallback: local in-memory upload
    const uploadURL = `http://localhost:${PORT}/api/storage/upload-file/${uuid}.${ext}`;
    uploadedFiles.set(`${uuid}.${ext}`, null);
    return json(res, { uploadURL, objectPath, metadata: { name: body.name, size: body.size, contentType: body.contentType } });
  }

  // Storage file upload (PUT from presigned URL) — local fallback only
  const uploadMatch = path.match(/^\/api\/storage\/upload-file\/(.+)$/);
  if (uploadMatch && req.method === "PUT") {
    const buf = await getBodyBuffer(req);
    const key = uploadMatch[1];

    if (USE_SUPABASE_STORAGE) {
      const publicUrl = await supabaseUpload(key, buf, req.headers["content-type"] || "image/png");
      setCors(req, res);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: true, publicUrl }));
    }

    uploadedFiles.set(key, buf);
    const ctype = req.headers["content-type"] || "image/png";
    setCors(req, res);
    res.writeHead(200, { "Content-Type": ctype });
    return res.end(JSON.stringify({ ok: true }));
  }

  // Serve uploaded files — local fallback only
  const serveUpload = path.match(/^\/api\/storage\/uploads\/(.+)$/);
  if (serveUpload && req.method === "GET") {
    const key = serveUpload[1];

    if (USE_SUPABASE_STORAGE) {
      // Redirect to Supabase public URL
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${key}`;
      res.writeHead(302, { Location: publicUrl });
      return res.end();
    }

    const buf = uploadedFiles.get(key);
    if (buf) {
      const ctype = req.headers["accept"]?.startsWith("image/") ? req.headers["accept"] : "image/png";
      setCors(req, res);
      res.writeHead(200, { "Content-Type": ctype, "Cache-Control": "public, max-age=3600" });
      return res.end(buf);
    }
    res.writeHead(404); return res.end();
  }

  // Public objects / objects fallback  
  const publicMatch = path.match(/^\/api\/storage\/(?:public-)?objects\/(.+)$/);
  if (publicMatch && req.method === "GET") {
    const key = publicMatch[1];

    if (USE_SUPABASE_STORAGE) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${key}`;
      res.writeHead(302, { Location: publicUrl });
      return res.end();
    }

    if (uploadedFiles.has(key)) {
      const buf = uploadedFiles.get(key);
      setCors(req, res);
      res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" });
      return res.end(buf);
    }
    setCors(req, res);
    res.writeHead(404); return res.end();
  }

  // Remove BG - pass through (return original file)
  if (path === "/api/admin/remove-background" && req.method === "POST") {
    const buf = await getBodyBuffer(req);
    setCors(req, res);
    res.writeHead(200, { "Content-Type": "image/png" });
    return res.end(buf);
  }

  // Jersey image placeholder (SVG)
  const jerseyImg = path.match(/^\/api\/jersey-image\/(\d+)$/);
  if (jerseyImg && req.method === "GET") {
    const color = params.color || "#ccc";
    const name = params.name || "Jersey";
    return jerseySvg(req, res, color, name);
  }

  // Serve real jersey image files
  const jerseyFile = path.match(/^\/api\/jersey-file\/(.+)\.(png|jpg|jpeg|webp)$/);
  if (jerseyFile && req.method === "GET") {
    const baseName = jerseyFile[1];
    const ext = jerseyFile[2];
    const fullPath = `${JERSEYS_DIR}\\${baseName}.${ext}`;
    try {
      const data = readFileSync(fullPath);
      const ctype = ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/webp";
      setCors(req, res);
      res.writeHead(200, { "Content-Type": ctype, "Cache-Control": "public, max-age=3600" });
      return res.end(data);
    } catch {
      // Fallback to SVG placeholder
      const color = params.color || "#ccc";
      const name = params.name || "Jersey";
      return jerseySvg(req, res, color, name);
    }
  }

  // Jersey color images
  const jcImages = path.match(/^\/api\/admin\/jersey-colors\/(\d+)\/images$/);
  if (jcImages && req.method === "GET") return json(res, []);
  if (jcImages && req.method === "POST") return json(res, { id: 1, ...await getBody(req) }, 201);
  const jcImageDel = path.match(/^\/api\/admin\/jersey-colors\/(\d+)\/images\/(\d+)$/);
  if (jcImageDel && req.method === "DELETE") { res.writeHead(204); return res.end(); }

  // 404
  json(res, { error: "Not found" }, 404);
});

server.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
});
