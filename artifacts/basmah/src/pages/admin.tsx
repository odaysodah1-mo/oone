import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface Order {
  id: number; teamId: number; teamName: string; customerName: string;
  jerseyNumber: string; size: string; color: string; quantity: number;
  totalPrice: number; customerPhone: string; customerCity: string;
  status: string; createdAt: string;
}
interface Team { id: number; name: string; nameEn: string; primaryColor: string; }
interface JerseyColor { id: number; teamId: number; name: string; imageUrl: string; hexCode: string; isDefault: boolean; sortOrder: number; }
interface NahfatPreset { id: number; text: string; category: string; isActive: boolean; sortOrder: number; }

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const BASE = "/api";
const fetchJson = (url: string) => fetch(BASE + url).then(r => r.json());

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار", confirmed: "مؤكد", shipped: "تم الشحن",
  delivered: "تم التسليم", cancelled: "ملغي",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b", confirmed: "#3b82f6", shipped: "#8b5cf6",
  delivered: "#22c55e", cancelled: "#ef4444",
};

/* ══════════════════════════════════════════════════════════
   ADMIN PASSWORD GATE
══════════════════════════════════════════════════════════ */
const ADMIN_PASS = "basmah2025";

function PasswordGate({ onEnter }: { onEnter: () => void }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);
  const check = () => {
    if (val === ADMIN_PASS) onEnter();
    else { setErr(true); setVal(""); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
      <div className="w-full max-w-sm mx-auto p-8 rounded-3xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="text-center mb-8">
          <div className="text-5xl font-black mb-2" style={{ color: "#bfff00" }}>O ONE</div>
          <div className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>لوحة التحكم</div>
        </div>
        <input
          type="password" value={val} onChange={e => { setVal(e.target.value); setErr(false); }}
          onKeyDown={e => e.key === "Enter" && check()}
          placeholder="كلمة المرور"
          className="w-full px-4 py-3 rounded-xl text-center text-lg mb-3"
          style={{ background: "rgba(255,255,255,0.07)", border: err ? "1.5px solid #ef4444" : "1.5px solid rgba(255,255,255,0.12)", color: "#fff", outline: "none", direction: "ltr" }}
        />
        {err && <p className="text-center text-sm mb-3" style={{ color: "#ef4444" }}>كلمة المرور غلط</p>}
        <button onClick={check} className="w-full py-3 rounded-xl font-bold text-base" style={{ background: "#bfff00", color: "#0a0a0a" }}>
          دخول
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB: ORDERS
══════════════════════════════════════════════════════════ */
function OrdersTab() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["admin-orders"],
    queryFn: () => fetchJson("/admin/orders"),
    refetchInterval: 15000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`${BASE}/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  if (isLoading) return <Spinner />;

  return (
    <div>
      {/* Filter chips */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-3 py-1 rounded-full text-sm font-bold transition-all"
            style={{
              background: filter === s ? (s === "all" ? "#bfff00" : STATUS_COLORS[s]) : "rgba(255,255,255,0.06)",
              color: filter === s && s === "all" ? "#0a0a0a" : "#fff",
              border: "none",
            }}>
            {s === "all" ? `الكل (${orders.length})` : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20" style={{ color: "rgba(255,255,255,0.3)" }}>لا توجد طلبات</div>
      )}

      <div className="space-y-3">
        {filtered.map(order => (
          <div key={order.id} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white">#{order.id}</span>
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{order.teamName}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: STATUS_COLORS[order.status] + "33", color: STATUS_COLORS[order.status] }}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <div className="text-sm grid grid-cols-2 gap-x-6 gap-y-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                  <span>👤 {order.customerName}</span>
                  <span>📱 {order.customerPhone}</span>
                  <span>🏙️ {order.customerCity}</span>
                  <span>📏 {order.size} | #{order.jerseyNumber}</span>
                  <span>🛍️ الكمية: {order.quantity}</span>
                  <span style={{ color: "#bfff00" }}>💰 {order.totalPrice.toFixed(2)} JOD</span>
                </div>
                <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {new Date(order.createdAt).toLocaleString("ar-JO")}
                </div>
              </div>
              <select
                value={order.status}
                onChange={e => updateStatus.mutate({ id: order.id, status: e.target.value })}
                className="px-3 py-1.5 rounded-xl text-sm font-bold cursor-pointer"
                style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", outline: "none" }}
              >
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val} style={{ background: "#1a1a1a" }}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB: JERSEY COLORS
══════════════════════════════════════════════════════════ */
function ColorsTab() {
  const qc = useQueryClient();
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["admin-teams"],
    queryFn: () => fetchJson("/admin/teams"),
  });
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", imageUrl: "", hexCode: "#ffffff", isDefault: false });
  const [adding, setAdding] = useState(false);

  const { data: colors = [] } = useQuery<JerseyColor[]>({
    queryKey: ["admin-colors", selectedTeam],
    queryFn: () => fetchJson(`/admin/teams/${selectedTeam}/colors`),
    enabled: selectedTeam !== null,
  });

  const addColor = useMutation({
    mutationFn: (data: typeof form) =>
      fetch(`${BASE}/admin/teams/${selectedTeam}/colors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, sortOrder: colors.length }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-colors", selectedTeam] });
      setForm({ name: "", imageUrl: "", hexCode: "#ffffff", isDefault: false });
      setAdding(false);
    },
  });

  const deleteColor = useMutation({
    mutationFn: (colorId: number) =>
      fetch(`${BASE}/admin/teams/${selectedTeam}/colors/${colorId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-colors", selectedTeam] }),
  });

  return (
    <div>
      {/* Team selector */}
      <div className="mb-5">
        <label className="block text-sm mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>اختر الفريق</label>
        <select
          value={selectedTeam ?? ""}
          onChange={e => setSelectedTeam(Number(e.target.value))}
          className="w-full px-4 py-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", outline: "none" }}
        >
          <option value="" style={{ background: "#1a1a1a" }}>-- اختر فريق --</option>
          {teams.map(t => (
            <option key={t.id} value={t.id} style={{ background: "#1a1a1a" }}>{t.name}</option>
          ))}
        </select>
      </div>

      {selectedTeam !== null && (
        <>
          {/* Add color form */}
          {adding ? (
            <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(191,255,0,0.05)", border: "1px solid rgba(191,255,0,0.2)" }}>
              <div className="text-sm font-bold mb-3" style={{ color: "#bfff00" }}>إضافة لون جديد</div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>اسم اللون (عربي)</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="مثال: أبيض رسمي"
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{ background: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", outline: "none" }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>رابط الصورة (URL)</label>
                  <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://example.com/jersey.png"
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{ background: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", outline: "none", direction: "ltr" }} />
                </div>
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>كود اللون (hex)</label>
                    <div className="flex gap-2">
                      <input type="color" value={form.hexCode} onChange={e => setForm(f => ({ ...f, hexCode: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0.5"
                        style={{ background: "transparent" }} />
                      <input value={form.hexCode} onChange={e => setForm(f => ({ ...f, hexCode: e.target.value }))}
                        className="flex-1 px-3 py-2 rounded-xl text-sm"
                        style={{ background: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", outline: "none", direction: "ltr" }} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-5">
                    <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>افتراضي</span>
                  </label>
                </div>
                {form.imageUrl && (
                  <div className="rounded-xl overflow-hidden" style={{ height: 120 }}>
                    <img src={form.imageUrl} alt="preview" className="w-full h-full object-contain" style={{ background: "rgba(255,255,255,0.05)" }} />
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => addColor.mutate(form)} disabled={!form.name || !form.imageUrl}
                    className="flex-1 py-2 rounded-xl font-bold text-sm disabled:opacity-40"
                    style={{ background: "#bfff00", color: "#0a0a0a" }}>حفظ</button>
                  <button onClick={() => setAdding(false)}
                    className="px-4 py-2 rounded-xl text-sm"
                    style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}>إلغاء</button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)}
              className="w-full py-2.5 rounded-xl text-sm font-bold mb-4"
              style={{ background: "rgba(191,255,0,0.1)", color: "#bfff00", border: "1px dashed rgba(191,255,0,0.3)" }}>
              + إضافة لون جديد
            </button>
          )}

          {/* Colors list */}
          {colors.length === 0 ? (
            <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.3)" }}>لا توجد ألوان لهذا الفريق</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {colors.map(c => (
                <div key={c.id} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="aspect-square" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <img src={c.imageUrl} alt={c.name} className="w-full h-full object-contain p-2" />
                  </div>
                  <div className="p-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-3 h-3 rounded-full inline-block border border-white/20" style={{ background: c.hexCode }} />
                      <span className="text-xs font-bold text-white truncate">{c.name}</span>
                      {c.isDefault && <span className="text-xs px-1 rounded" style={{ background: "rgba(191,255,0,0.2)", color: "#bfff00" }}>افتراضي</span>}
                    </div>
                    <button onClick={() => deleteColor.mutate(c.id)}
                      className="w-full py-1 rounded-lg text-xs"
                      style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>حذف</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB: NAHFAT PRESETS
══════════════════════════════════════════════════════════ */
function NahfatTab() {
  const qc = useQueryClient();
  const { data: presets = [], isLoading } = useQuery<NahfatPreset[]>({
    queryKey: ["admin-nahfat"],
    queryFn: () => fetchJson("/admin/nahfat"),
  });
  const [newText, setNewText] = useState("");
  const [newCat, setNewCat] = useState("عربي");
  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const addPreset = useMutation({
    mutationFn: () => fetch(`${BASE}/admin/nahfat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText, category: newCat, isActive: true, sortOrder: presets.length }),
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-nahfat"] }); setNewText(""); },
  });

  const updatePreset = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<NahfatPreset> }) =>
      fetch(`${BASE}/admin/nahfat/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-nahfat"] }); setEditId(null); },
  });

  const deletePreset = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}/admin/nahfat/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-nahfat"] }),
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      {/* Add new */}
      <div className="rounded-2xl p-4 mb-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="text-sm font-bold mb-3 text-white">إضافة نهفة جديدة</div>
        <div className="flex gap-2 mb-2">
          <input value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => e.key === "Enter" && newText && addPreset.mutate()}
            placeholder="النص المراد إضافته..."
            className="flex-1 px-3 py-2 rounded-xl text-sm"
            style={{ background: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", outline: "none" }} />
          <select value={newCat} onChange={e => setNewCat(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm"
            style={{ background: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", outline: "none" }}>
            {["عربي", "ترند", "أردن", "نص"].map(c => <option key={c} style={{ background: "#1a1a1a" }}>{c}</option>)}
          </select>
        </div>
        <button onClick={() => newText && addPreset.mutate()} disabled={!newText}
          className="w-full py-2 rounded-xl font-bold text-sm disabled:opacity-40"
          style={{ background: "#bfff00", color: "#0a0a0a" }}>إضافة</button>
      </div>

      {/* List */}
      {presets.length === 0 && (
        <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.3)" }}>لا توجد نهفات</div>
      )}
      <div className="space-y-2">
        {presets.map(p => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {editId === p.id ? (
              <>
                <input value={editText} onChange={e => setEditText(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl text-sm"
                  style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", outline: "none" }} />
                <button onClick={() => updatePreset.mutate({ id: p.id, data: { text: editText } })}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: "#bfff00", color: "#0a0a0a" }}>حفظ</button>
                <button onClick={() => setEditId(null)}
                  className="px-3 py-1.5 rounded-xl text-xs" style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}>إلغاء</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-white font-medium">{p.text}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>{p.category}</span>
                <button onClick={() => updatePreset.mutate({ id: p.id, data: { isActive: !p.isActive } })}
                  className="w-8 h-5 rounded-full transition-colors flex items-center"
                  style={{ background: p.isActive ? "#22c55e" : "rgba(255,255,255,0.15)", padding: "2px" }}>
                  <span className="w-4 h-4 rounded-full bg-white block transition-transform"
                    style={{ transform: p.isActive ? "translateX(12px)" : "translateX(0)" }} />
                </button>
                <button onClick={() => { setEditId(p.id); setEditText(p.text); }}
                  className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>تعديل</button>
                <button onClick={() => deletePreset.mutate(p.id)}
                  className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>حذف</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB: DASHBOARD STATS
══════════════════════════════════════════════════════════ */
function DashboardTab() {
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: () => fetchJson("/orders/stats"),
  });
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["admin-orders"],
    queryFn: () => fetchJson("/admin/orders"),
  });

  const pending = orders.filter(o => o.status === "pending").length;
  const confirmed = orders.filter(o => o.status === "confirmed").length;
  const delivered = orders.filter(o => o.status === "delivered").length;

  const statCards = [
    { label: "إجمالي الطلبات", value: stats?.totalOrders ?? 0, icon: "📦", color: "#3b82f6" },
    { label: "الإيرادات", value: `${(stats?.totalRevenue ?? 0).toFixed(2)} JOD`, icon: "💰", color: "#bfff00" },
    { label: "قيد الانتظار", value: pending, icon: "⏳", color: "#f59e0b" },
    { label: "مؤكدة", value: confirmed, icon: "✅", color: "#22c55e" },
    { label: "تم التسليم", value: delivered, icon: "🚀", color: "#8b5cf6" },
    { label: "أشهر فريق", value: stats?.topTeam ?? "—", icon: "⚽", color: "#f97316" },
    { label: "أشهر مقاس", value: stats?.popularSize ?? "—", icon: "📏", color: "#ec4899" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {statCards.map(card => (
          <div key={card.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-xl font-black" style={{ color: card.color }}>{card.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="mt-6">
        <div className="text-sm font-bold mb-3 text-white">آخر 5 طلبات</div>
        <div className="space-y-2">
          {orders.slice(0, 5).map(o => (
            <div key={o.id} className="flex items-center justify-between px-4 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <span className="text-white font-medium text-sm">{o.customerName}</span>
                <span className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.4)" }}>{o.teamName} — {o.size}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ color: "#bfff00" }}>{o.totalPrice.toFixed(2)} JOD</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: STATUS_COLORS[o.status] + "33", color: STATUS_COLORS[o.status] }}>
                  {STATUS_LABELS[o.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SPINNER
══════════════════════════════════════════════════════════ */
function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN ADMIN PAGE
══════════════════════════════════════════════════════════ */
const TABS = [
  { id: "dashboard", label: "الرئيسية", icon: "📊" },
  { id: "orders",    label: "الطلبات",  icon: "📦" },
  { id: "colors",    label: "الألوان",  icon: "🎨" },
  { id: "nahfat",    label: "النهفات",  icon: "✍️" },
];

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState("dashboard");

  if (!authed) return <PasswordGate onEnter={() => setAuthed(true)} />;

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff" }}>
      {/* Header */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black" style={{ color: "#bfff00" }}>O ONE</span>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>/ الأدمن</span>
          </div>
          <button onClick={() => setAuthed(false)} className="text-xs px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            خروج
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5"
              style={{
                background: tab === t.id ? "#bfff00" : "transparent",
                color: tab === t.id ? "#0a0a0a" : "rgba(255,255,255,0.55)",
              }}>
              <span>{t.icon}</span>
              <span className="hidden sm:block">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "dashboard" && <DashboardTab />}
        {tab === "orders"    && <OrdersTab />}
        {tab === "colors"    && <ColorsTab />}
        {tab === "nahfat"    && <NahfatTab />}
      </div>
    </div>
  );
}
