import { useState, useEffect, useCallback, useRef } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useUpload } from "@workspace/object-storage-web";
import {
  ShoppingBag, Shirt, Type, LogOut, LayoutDashboard,
  ChevronDown, Plus, Trash2, Pencil, Check, X, Upload,
  BarChart3, Package, TrendingUp, RefreshCw, Eye, EyeOff,
  Star, RotateCcw, Sticker, Link as LinkIcon, MapPin,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const ADMIN_PASSWORD = "basmah2025";

/* ─── Types ─────────────────────────────────────────── */
type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

interface Order {
  id: number; teamId: number; teamName: string; customerName: string;
  jerseyNumber: string; size: string; color: string; quantity: number;
  totalPrice: number; customerPhone: string; customerCity: string;
  status: OrderStatus; createdAt: string;
  playerName?: string | null;
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  jerseyColorName?: string | null;
}

interface Team {
  id: number; name: string; nameEn: string; league: string;
  basePrice: number; primaryColor: string; secondaryColor: string;
  availableColors: string[]; availableSizes: string[];
  orderCount: number; isPopular: boolean;
  logoUrl?: string | null; country?: string;
}

interface JerseyColor {
  id: number; teamId: number; name: string;
  frontImageUrl: string; backImageUrl: string | null;
  hexCode: string; secondaryHexCode: string;
  isDefault: boolean; sortOrder: number;
  isSoldOut: boolean;
  priceWithCustomization: number | null;
  priceWithoutCustomization: number | null;
}

const LEAGUES = [
  "الدوري الأردني",
  "الدوري الإنجليزي (بريميرليغ)",
  "الدوري الإسباني (لاليغا)",
  "الدوري الألماني (بوندسليغا)",
  "الدوري الإيطالي (سيريا أ)",
  "الدوري الفرنسي (ليغ 1)",
  "دوري أبطال أوروبا",
  "المنتخبات",
  "أخرى",
];

interface NahfatPreset {
  id: number; text: string; category: string; isActive: boolean; sortOrder: number;
}

/* ─── API ─────────────────────────────────────────────── */
async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "معلّق", confirmed: "مؤكّد", shipped: "تم الشحن",
  delivered: "تم التسليم", cancelled: "ملغي",
};
const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  shipped:   "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

/* ─── Login ─────────────────────────────────────────── */
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) { sessionStorage.setItem("admin_authed", "1"); onLogin(); }
    else setError("كلمة المرور غير صحيحة");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 mb-4 shadow-lg">
            <Shirt size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">بصمة</h1>
          <p className="text-slate-400 mt-1 text-sm">لوحة التحكم الإدارية</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
          <label className="block text-sm font-medium text-slate-300 mb-2">كلمة المرور</label>
          <div className="relative">
            <input type={showPass ? "text" : "password"} value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="أدخل كلمة المرور" autoFocus />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button type="submit" className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors">
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Sidebar ─────────────────────────────────────────── */
type Section = "dashboard" | "orders" | "teams" | "nahfat" | "stickers" | "branches";

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "لوحة المعلومات", icon: <LayoutDashboard size={18} /> },
  { id: "orders",    label: "الطلبات",          icon: <ShoppingBag size={18} /> },
  { id: "teams",     label: "الفرق",             icon: <Shirt size={18} /> },
  { id: "branches",  label: "الفروع",            icon: <MapPin size={18} /> },
  { id: "nahfat",    label: "النهفات",           icon: <Type size={18} /> },
  { id: "stickers",  label: "الملصقات",          icon: <Sticker size={18} /> },
];

function Sidebar({ active, onSelect, onLogout }: {
  active: Section; onSelect: (s: Section) => void; onLogout: () => void;
}) {
  return (
    <aside className="hidden md:flex w-56 bg-slate-900 border-l border-slate-700 flex-col h-screen sticky top-0" dir="rtl">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
          <Shirt size={20} className="text-white" />
        </div>
        <div><p className="font-bold text-white text-sm">بصمة</p><p className="text-xs text-slate-400">الإدارة</p></div>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => onSelect(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-right ${
              active === item.id
                ? "bg-emerald-500/10 text-emerald-400 border-r-2 border-emerald-500"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}>
            {item.icon}{item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <button onClick={onLogout} className="w-full flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm py-2 transition-colors">
          <LogOut size={16} />خروج
        </button>
      </div>
    </aside>
  );
}

/* ─── Mobile Bottom Nav ──────────────────────────────────── */
function MobileNav({ active, onSelect, onLogout }: {
  active: Section; onSelect: (s: Section) => void; onLogout: () => void;
}) {
  const items = [
    { id: "dashboard" as Section, label: "الرئيسية", icon: <LayoutDashboard size={20} /> },
    { id: "orders"    as Section, label: "الطلبات",  icon: <ShoppingBag size={20} /> },
    { id: "teams"     as Section, label: "الفرق",    icon: <Shirt size={20} /> },
    { id: "nahfat"    as Section, label: "النهفات",  icon: <Type size={20} /> },
    { id: "stickers"  as Section, label: "الملصقات", icon: <Sticker size={20} /> },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-900 border-t border-slate-700 flex" dir="rtl">
      {items.map(item => (
        <button key={item.id} onClick={() => onSelect(item.id)}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${
            active === item.id ? "text-emerald-400" : "text-slate-500"
          }`}>
          <span className={active === item.id ? "text-emerald-400" : "text-slate-500"}>{item.icon}</span>
          {item.label}
        </button>
      ))}
      <button onClick={onLogout}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-bold text-slate-500 hover:text-red-400 transition-colors">
        <LogOut size={20} />خروج
      </button>
    </nav>
  );
}

/* ─── Dashboard ─────────────────────────────────────────── */
interface ChartData {
  dailyOrders: { date: string; orders: number; revenue: number }[];
  byTeam: { team: string; count: number }[];
  byStatus: { status: string; label: string; count: number }[];
  bySizes: { size: string; count: number }[];
}

const PIE_COLORS = ["#6366f1","#22d3ee","#f59e0b","#10b981","#ef4444","#a78bfa"];
const AREA_GRAD_ID = "areaGrad";

function Dashboard() {
  const [stats, setStats] = useState<{ totalOrders: number; totalRevenue: number } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/orders/stats"),
      apiFetch("/orders"),
      apiFetch("/admin/stats/charts"),
    ])
      .then(([s, o, c]) => { setStats(s); setOrders(o); setCharts(c); })
      .catch(() => toast.error("فشل تحميل الإحصائيات"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const pending   = orders.filter(o => o.status === "pending").length;
  const confirmed = orders.filter(o => o.status === "confirmed").length;

  return (
    <div dir="rtl">
      <PageHeader title="لوحة المعلومات" subtitle="نظرة عامة على أداء المنصة" />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="إجمالي الطلبات"   value={stats?.totalOrders ?? 0}                         icon={<Package size={20} />}   color="bg-blue-500" />
        <StatCard label="إجمالي الإيرادات" value={`${(stats?.totalRevenue ?? 0).toFixed(0)} د.أ`} icon={<BarChart3 size={20} />}  color="bg-emerald-500" />
        <StatCard label="طلبات معلّقة"     value={pending}                                          icon={<RefreshCw size={20} />} color="bg-yellow-500" />
        <StatCard label="طلبات مؤكّدة"     value={confirmed}                                        icon={<TrendingUp size={20} />} color="bg-purple-500" />
      </div>

      {/* Charts row */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

          {/* Area chart — daily revenue */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="font-bold text-slate-700 text-sm mb-4">الإيرادات اليومية — آخر 7 أيام</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={charts.dailyOrders} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={AREA_GRAD_ID} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => [`${v} د.أ`, "الإيرادات"]}
                  labelStyle={{ color: "#475569", fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5}
                  fill={`url(#${AREA_GRAD_ID})`} dot={{ r: 3, fill: "#6366f1" }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
            {/* Orders bar under area */}
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-400 font-medium mb-2">عدد الطلبات</p>
              <ResponsiveContainer width="100%" height={60}>
                <BarChart data={charts.dailyOrders} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barCategoryGap="30%">
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#cbd5e1" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 11 }}
                    formatter={(v: number) => [v, "طلبات"]}
                  />
                  <Bar dataKey="orders" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie chart — by status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
            <h3 className="font-bold text-slate-700 text-sm mb-4">توزيع حالات الطلبات</h3>
            {charts.byStatus.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={charts.byStatus} dataKey="count" nameKey="label" cx="50%" cy="50%"
                      innerRadius={45} outerRadius={72} paddingAngle={3} strokeWidth={0}>
                      {charts.byStatus.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-1 flex-1">
                  {charts.byStatus.map((s, i) => (
                    <div key={s.status} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-slate-600">{s.label}</span>
                      </span>
                      <span className="font-bold text-slate-800">{s.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-300 text-sm">لا توجد طلبات بعد</div>
            )}
          </div>
        </div>
      )}

      {/* Bar chart — by team + recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
        {charts && charts.byTeam.length > 0 && (
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="font-bold text-slate-700 text-sm mb-4">الطلبات حسب الفريق</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.byTeam} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}
                barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="team" width={90} tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 11 }}
                  formatter={(v: number) => [v, "طلبات"]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {charts.byTeam.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent orders */}
        <div className={`bg-white border border-slate-200 rounded-2xl overflow-hidden ${charts && charts.byTeam.length > 0 ? "lg:col-span-3" : "lg:col-span-5"}`}>
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">آخر الطلبات</h2>
          </div>
          {/* Mobile list */}
          <div className="md:hidden divide-y divide-slate-100">
            {orders.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between px-4 py-3 gap-3" dir="rtl">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 text-sm truncate">{o.customerName}</p>
                  <p className="text-xs text-slate-500">{o.teamName}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[o.status]}`}>
                    {STATUS_LABELS[o.status]}
                  </span>
                  <span className="font-semibold text-slate-800 text-sm">{o.totalPrice} د.أ</span>
                </div>
              </div>
            ))}
            {orders.length === 0 && <p className="px-4 py-8 text-center text-slate-400 text-sm">لا توجد طلبات بعد</p>}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="text-right px-4 py-3 font-medium">العميل</th>
                  <th className="text-right px-4 py-3 font-medium">الفريق</th>
                  <th className="text-right px-4 py-3 font-medium">المبلغ</th>
                  <th className="text-right px-4 py-3 font-medium">الحالة</th>
                  <th className="text-right px-4 py-3 font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 8).map(o => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{o.customerName}</td>
                    <td className="px-4 py-3 text-slate-600">{o.teamName}</td>
                    <td className="px-4 py-3 text-slate-700">{o.totalPrice} د.أ</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[o.status]}`}>
                        {STATUS_LABELS[o.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString("ar-JO")}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">لا توجد طلبات بعد</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4" dir="rtl">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${color} mb-3`}>
        <span className="text-white">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

/* ─── Design Preview Modal ───────────────────────────────── */
function DesignPreviewModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const hasPhoto = !!order.frontImageUrl;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800">تصميم الطلب #{order.id}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{order.customerName} — {order.teamName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
        </div>

        {/* Jersey Preview */}
        <div className="bg-slate-900 flex items-center justify-center py-8 px-6 relative" style={{ minHeight: 280 }}>
          {hasPhoto ? (
            <div className="relative" style={{ width: 180, height: 230 }}>
              <img src={order.frontImageUrl!} alt="front"
                className="w-full h-full object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              {/* Name overlay */}
              {order.playerName && (
                <div style={{
                  position: "absolute", top: "28%", left: "50%", transform: "translateX(-50%)",
                  fontFamily: "Impact, Arial Black, sans-serif", fontWeight: 900,
                  fontSize: 14, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                  letterSpacing: 2, whiteSpace: "nowrap", textAlign: "center",
                }}>
                  {order.playerName.toUpperCase()}
                </div>
              )}
              {/* Number overlay */}
              {order.jerseyNumber && (
                <div style={{
                  position: "absolute", top: "44%", left: "50%", transform: "translateX(-50%)",
                  fontFamily: "Impact, Arial Black, sans-serif", fontWeight: 900,
                  fontSize: 52, color: "#fff", textShadow: "0 4px 16px rgba(0,0,0,0.95)",
                  letterSpacing: -2, lineHeight: 1, whiteSpace: "nowrap",
                }}>
                  {order.jerseyNumber}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: order.color || "#1a1a2e" }}>
                <Shirt size={36} className="text-white" />
              </div>
              <p className="text-white/60 text-sm">لا توجد صورة للجيرسيه</p>
            </div>
          )}

          {/* Back photo thumbnail */}
          {order.backImageUrl && (
            <div className="absolute bottom-3 left-3">
              <img src={order.backImageUrl} alt="back"
                className="w-16 h-20 object-contain rounded-lg border border-white/20 bg-white/5"
                title="الخلف" />
              <p className="text-white/40 text-[9px] text-center mt-0.5">الخلف</p>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="px-5 py-4 space-y-2" dir="rtl">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-400 text-xs block">الاسم على الجيرسيه</span><span className="font-bold text-slate-800">{order.playerName || "—"}</span></div>
            <div><span className="text-slate-400 text-xs block">الرقم</span><span className="font-bold text-slate-800 text-lg">{order.jerseyNumber}</span></div>
            <div><span className="text-slate-400 text-xs block">لون الجيرسيه</span><span className="font-medium text-slate-700">{order.jerseyColorName || order.color}</span></div>
            <div><span className="text-slate-400 text-xs block">المقاس</span><span className="font-bold text-slate-800">{order.size}</span></div>
            <div><span className="text-slate-400 text-xs block">المدينة</span><span className="font-medium text-slate-700">{order.customerCity}</span></div>
            <div><span className="text-slate-400 text-xs block">الهاتف</span><span className="font-medium text-slate-700" dir="ltr">{order.customerPhone}</span></div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString("ar-JO")}</span>
            <span className="text-lg font-bold text-emerald-600">{order.totalPrice} د.أ</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Orders ─────────────────────────────────────────────── */
function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/admin/orders").then(setOrders).catch(() => toast.error("فشل تحميل الطلبات")).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: number, status: OrderStatus) {
    setUpdatingId(id);
    try {
      await apiFetch(`/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success("تم تحديث الحالة");
    } catch { toast.error("فشل تحديث الحالة"); }
    finally { setUpdatingId(null); }
  }

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl">
      {previewOrder && <DesignPreviewModal order={previewOrder} onClose={() => setPreviewOrder(null)} />}
      <PageHeader title="إدارة الطلبات" subtitle={`${orders.length} طلب`}>
        <button onClick={load} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5">
          <RefreshCw size={14} />تحديث
        </button>
      </PageHeader>
      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {orders.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center text-slate-400 text-sm">لا توجد طلبات بعد</div>
        )}
        {orders.map(o => (
          <div key={o.id} className="bg-white border border-slate-200 rounded-2xl p-4" dir="rtl">
            <div className="flex items-start gap-3">
              <button onClick={() => setPreviewOrder(o)}
                className="w-12 h-14 flex-shrink-0 flex items-center justify-center rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                {o.frontImageUrl ? (
                  <img src={o.frontImageUrl} alt="jersey" className="w-full h-full object-contain"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: o.color || "#1a1a2e" }}>
                    <Shirt size={14} className="text-white" />
                  </div>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-slate-800 truncate">{o.customerName}</span>
                  <span className="font-bold text-emerald-600 flex-shrink-0">{o.totalPrice} د.أ</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">{o.teamName} · رقم {o.jerseyNumber} · {o.size}</p>
                <div className="flex items-center justify-between gap-2">
                  <StatusDropdown status={o.status} disabled={updatingId === o.id} onChange={s => updateStatus(o.id, s)} />
                  <span className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString("ar-JO")}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono" dir="ltr">{o.customerPhone}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr>
                <th className="text-right px-4 py-3 font-medium">#</th>
                <th className="text-right px-4 py-3 font-medium">التصميم</th>
                <th className="text-right px-4 py-3 font-medium">العميل</th>
                <th className="text-right px-4 py-3 font-medium">الهاتف</th>
                <th className="text-right px-4 py-3 font-medium">الفريق / الرقم</th>
                <th className="text-right px-4 py-3 font-medium">المقاس</th>
                <th className="text-right px-4 py-3 font-medium">المبلغ</th>
                <th className="text-right px-4 py-3 font-medium">الحالة</th>
                <th className="text-right px-4 py-3 font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400 font-mono">#{o.id}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => setPreviewOrder(o)}
                      className="group relative w-12 h-14 flex items-center justify-center rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all bg-slate-50">
                      {o.frontImageUrl ? (
                        <img src={o.frontImageUrl} alt="jersey"
                          className="w-full h-full object-contain"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: o.color || "#1a1a2e" }}>
                          <Shirt size={14} className="text-white" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Eye size={14} className="text-emerald-600" />
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{o.customerName}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono" dir="ltr">{o.customerPhone}</td>
                  <td className="px-4 py-3 text-slate-600">{o.teamName} / {o.jerseyNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{o.size}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{o.totalPrice} د.أ</td>
                  <td className="px-4 py-3">
                    <StatusDropdown status={o.status} disabled={updatingId === o.id} onChange={s => updateStatus(o.id, s)} />
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(o.createdAt).toLocaleDateString("ar-JO")}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">لا توجد طلبات بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusDropdown({ status, disabled, onChange }: {
  status: OrderStatus; disabled: boolean; onChange: (s: OrderStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const statuses: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  return (
    <div className="relative">
      <button disabled={disabled} onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status]}`}>
        {STATUS_LABELS[status]}<ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-28">
          {statuses.map(s => (
            <button key={s} onClick={() => { onChange(s); setOpen(false); }}
              className="w-full text-right px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center justify-between gap-2">
              {STATUS_LABELS[s]}{s === status && <Check size={10} className="text-emerald-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Teams + Jerseys ─────────────────────────────────── */

function InlineEdit({ value, onSave, prefix, suffix, type = "text", min, placeholder }: {
  value: string | number; onSave: (v: string) => Promise<void>;
  prefix?: string; suffix?: string; type?: string; min?: number; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  async function save() {
    if (draft === String(value)) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(draft); setEditing(false); }
    catch { toast.error("فشل الحفظ"); }
    finally { setSaving(false); }
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        {prefix && <span className="text-slate-500 text-xs">{prefix}</span>}
        <input ref={inputRef} type={type} value={draft} min={min}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          className="border border-emerald-300 rounded-md px-2 py-0.5 text-sm w-20 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
        {suffix && <span className="text-slate-500 text-xs">{suffix}</span>}
        <button onClick={save} disabled={saving} className="text-emerald-600 hover:text-emerald-700 p-0.5">
          {saving ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
        </button>
        <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600 p-0.5"><X size={12} /></button>
      </span>
    );
  }
  return (
    <button onClick={() => { setDraft(String(value)); setEditing(true); }}
      className="inline-flex items-center gap-1 group hover:text-emerald-700 transition-colors">
      {prefix && <span className="text-slate-500 text-xs">{prefix}</span>}
      {value !== "" && value !== null && value !== undefined
        ? <span className="font-semibold text-slate-800">{value}</span>
        : <span className="text-slate-400 italic text-xs">{placeholder ?? "—"}</span>
      }
      {suffix && <span className="text-slate-500 text-xs">{suffix}</span>}
      <Pencil size={11} className="opacity-0 group-hover:opacity-100 text-emerald-500" />
    </button>
  );
}

function ColorPicker({ value, onSave }: { value: string; onSave: (v: string) => Promise<void> }) {
  const [current, setCurrent] = useState(value);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  async function handleBlur() {
    if (current === value) return;
    setSaving(true);
    try { await onSave(current); }
    catch { toast.error("فشل حفظ اللون"); setCurrent(value); }
    finally { setSaving(false); }
  }
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => ref.current?.click()}
        className="w-7 h-7 rounded-lg border-2 border-white shadow ring-1 ring-slate-200 hover:ring-emerald-400 transition-shadow relative"
        style={{ backgroundColor: current }}>
        {saving && <RefreshCw size={10} className="animate-spin text-white absolute inset-0 m-auto" />}
      </button>
      <input ref={ref} type="color" value={current} onChange={e => setCurrent(e.target.value)}
        onBlur={handleBlur} className="sr-only" />
      <span className="text-xs font-mono text-slate-500">{current}</span>
    </div>
  );
}

/* ── Logo upload row for a team ─────────────────────── */
function LogoUploadRow({ team, onSave }: { team: Team; onSave: (url: string | null) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: async r => {
      const url = `/api/storage${r.objectPath}`;
      setSaving(true);
      try { await onSave(url); toast.success("تم رفع الشعار"); }
      catch { toast.error("فشل حفظ الشعار"); }
      finally { setSaving(false); }
    },
    onError: () => toast.error("فشل رفع الصورة"),
  });

  async function handleRemove() {
    if (!confirm("هل تريد إزالة شعار الفريق؟")) return;
    setSaving(true);
    try { await onSave(null); toast.success("تم حذف الشعار"); }
    catch { toast.error("فشل حذف الشعار"); }
    finally { setSaving(false); }
  }

  const busy = isUploading || saving;

  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
      <span className="text-xs text-slate-500 shrink-0">شعار النادي:</span>

      {team.logoUrl ? (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img src={team.logoUrl} alt="logo" className="w-8 h-8 object-contain rounded border border-slate-200 bg-white p-0.5" />
          <span className="text-[10px] text-slate-400 truncate flex-1">{team.logoUrl.split("/").pop()}</span>
          <button onClick={() => inputRef.current?.click()} disabled={busy}
            className="flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-700 font-medium shrink-0">
            <Upload size={11} />تغيير
          </button>
          <button onClick={handleRemove} disabled={busy}
            className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-600 font-medium shrink-0">
            <Trash2 size={11} />حذف
          </button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={busy}
          className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium border border-dashed border-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors">
          <Upload size={12} />
          {isUploading ? `${progress}%` : "رفع شعار"}
        </button>
      )}

      {isUploading && (
        <div className="flex items-center gap-1.5">
          <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[10px] text-slate-400">{progress}%</span>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
    </div>
  );
}

/* ── Single image upload widget ─────────────────────── */
function ImageUploadSlot({
  label, value, onChange,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: r => onChange(`/api/storage${r.objectPath}`),
    onError: () => toast.error("فشل رفع الصورة"),
  });

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      {value ? (
        <div className="relative group">
          <img src={value} alt={label}
            className="w-24 h-28 object-contain rounded-xl border border-slate-200 bg-slate-50 shadow-sm" />
          <button onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity">
            <X size={10} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-24 h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors bg-white">
          <input type="file" accept="image/*" className="hidden"
            onChange={async e => { const f = e.target.files?.[0]; if (f) await uploadFile(f); }} />
          {isUploading
            ? <div className="text-center"><RefreshCw size={16} className="animate-spin text-emerald-500 mx-auto mb-1" /><p className="text-[10px] text-emerald-600">{progress}%</p></div>
            : <div className="text-center"><Upload size={16} className="text-slate-400 mx-auto mb-1" /><p className="text-[10px] text-slate-400">رفع صورة</p></div>
          }
        </label>
      )}
    </div>
  );
}

/* ── Jersey Color Card ─────────────────────────────── */
function JerseyColorCard({ color, onDelete, onUpdate }: {
  color: JerseyColor;
  onDelete: () => Promise<void>;
  onUpdate: (data: Partial<JerseyColor>) => Promise<void>;
}) {
  const [side, setSide] = useState<"front" | "back">("front");
  const [deleting, setDeleting] = useState(false);

  const currentImg = side === "front" ? color.frontImageUrl : (color.backImageUrl ?? color.frontImageUrl);

  async function handleDelete() {
    if (!confirm(`حذف "${color.name}"؟`)) return;
    setDeleting(true);
    try { await onDelete(); }
    catch { toast.error("فشل الحذف"); setDeleting(false); }
  }

  return (
    <div className={`relative group border rounded-xl overflow-hidden bg-white transition-opacity ${deleting ? "opacity-40" : ""}`}>
      {color.isDefault && (
        <div className="absolute top-2 right-2 z-10 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">افتراضي</div>
      )}
      <button onClick={handleDelete} disabled={deleting}
        className="absolute top-2 left-2 z-10 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
        <Trash2 size={10} />
      </button>

      {/* Jersey image with front/back toggle */}
      <div className="h-32 flex items-center justify-center p-2 bg-slate-50 relative">
        <img src={currentImg} alt={side}
          className="max-h-full max-w-full object-contain transition-opacity duration-200"
          onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='%23e2e8f0'%3E%3Crect width='80' height='80'/%3E%3C/svg%3E"; }} />

        {/* front/back toggle button */}
        {color.backImageUrl && (
          <button onClick={() => setSide(s => s === "front" ? "back" : "front")}
            className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-slate-800/70 text-white text-[9px] px-2 py-1 rounded-full font-medium hover:bg-slate-800 transition-colors">
            <RotateCcw size={9} />
            {side === "front" ? "خلف" : "أمام"}
          </button>
        )}

        {!color.backImageUrl && (
          <div className="absolute bottom-1.5 left-1.5 bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-full">
            بدون خلف
          </div>
        )}
      </div>

      {/* Sold Out overlay */}
      {color.isSoldOut && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 pointer-events-none">
          <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full tracking-wider rotate-[-8deg] shadow-lg">SOLD OUT</span>
        </div>
      )}

      {/* Info */}
      <div className="px-2 pt-1 pb-2 space-y-1.5 border-t border-slate-100">
        <p className="text-xs font-semibold text-slate-700 truncate">{color.name}</p>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full border border-slate-200 flex-shrink-0" style={{ backgroundColor: color.hexCode }} title={`أساسي: ${color.hexCode}`} />
          <div className="w-4 h-4 rounded-full border border-slate-200 flex-shrink-0" style={{ backgroundColor: color.secondaryHexCode }} title={`ثانوي: ${color.secondaryHexCode}`} />
          <button onClick={() => onUpdate({ isDefault: !color.isDefault })}
            className={`mr-auto text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
              color.isDefault ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-300"
            }`}>
            {color.isDefault ? "افتراضي" : "اجعله افتراضي"}
          </button>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <div>
            <p className="text-slate-400 mb-0.5">✏️ مع طباعة (د.أ)</p>
            <InlineEdit
              value={color.priceWithCustomization ?? ""}
              placeholder="سعر الفريق"
              onSave={async v => {
                const n = v === "" ? null : Number(v);
                if (v !== "" && (isNaN(n as number) || (n as number) <= 0)) return;
                await onUpdate({ priceWithCustomization: n });
              }}
              type="number"
            />
          </div>
          <div>
            <p className="text-slate-400 mb-0.5">👕 بدون طباعة (د.أ)</p>
            <InlineEdit
              value={color.priceWithoutCustomization ?? ""}
              placeholder="سعر الفريق"
              onSave={async v => {
                const n = v === "" ? null : Number(v);
                if (v !== "" && (isNaN(n as number) || (n as number) <= 0)) return;
                await onUpdate({ priceWithoutCustomization: n });
              }}
              type="number"
            />
          </div>
        </div>

        {/* Sold Out toggle */}
        <button onClick={() => onUpdate({ isSoldOut: !color.isSoldOut })}
          className={`w-full text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
            color.isSoldOut
              ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
              : "bg-slate-50 text-slate-400 border-slate-200 hover:border-red-300 hover:text-red-500"
          }`}>
          {color.isSoldOut ? "✕ إلغاء Sold Out" : "وضع Sold Out"}
        </button>
      </div>
    </div>
  );
}

/* ── Add Jersey Color Form ────────────────────────────── */
function AddJerseyColorForm({ teamId, colorsCount, onAdd, onCancel }: {
  teamId: number; colorsCount: number;
  onAdd: (color: JerseyColor) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [hexCode, setHexCode] = useState("#ffffff");
  const [secondaryHexCode, setSecondaryHexCode] = useState("#000000");
  const [isDefault, setIsDefault] = useState(false);
  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null);
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null);
  const [priceWithCustomization, setPriceWithCustomization] = useState<string>("");
  const [priceWithoutCustomization, setPriceWithoutCustomization] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || !frontImageUrl) { toast.error("الاسم وصورة الأمام مطلوبان"); return; }
    setSaving(true);
    try {
      const color = await apiFetch(`/admin/teams/${teamId}/colors`, {
        method: "POST",
        body: JSON.stringify({
          name, frontImageUrl, backImageUrl,
          hexCode, secondaryHexCode, isDefault, sortOrder: colorsCount,
          priceWithCustomization: priceWithCustomization ? Number(priceWithCustomization) : null,
          priceWithoutCustomization: priceWithoutCustomization ? Number(priceWithoutCustomization) : null,
        }),
      });
      onAdd(color);
      toast.success("تم إضافة الجيرسيه");
    } catch { toast.error("فشل الحفظ"); }
    finally { setSaving(false); }
  }

  return (
    <div className="border-2 border-dashed border-emerald-200 rounded-xl p-4 bg-emerald-50/40 col-span-full">
      <p className="text-sm font-semibold text-slate-700 mb-4">إضافة جيرسيه جديد</p>

      {/* Two image slots side-by-side */}
      <div className="flex gap-6 mb-4 justify-center">
        <ImageUploadSlot label="الأمام *" value={frontImageUrl} onChange={setFrontImageUrl} />
        <ImageUploadSlot label="الخلف" value={backImageUrl} onChange={setBackImageUrl} />
      </div>

      {/* Name */}
      <div className="mb-3">
        <label className="block text-xs text-slate-500 mb-1">اسم الجيرسيه *</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: أبيض الأساسي، أحمر الاحتياطي..."
          className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
      </div>

      {/* Color pickers */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">لون الجسم (الأساسي)</label>
          <div className="flex items-center gap-2">
            <input type="color" value={hexCode} onChange={e => setHexCode(e.target.value)}
              className="w-8 h-7 rounded-md border border-slate-200 cursor-pointer p-0.5" />
            <input type="text" value={hexCode} onChange={e => setHexCode(e.target.value)}
              className="flex-1 border border-slate-200 rounded-md px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-300 bg-white" />
            <div className="w-6 h-6 rounded-full border border-slate-200 flex-shrink-0" style={{ backgroundColor: hexCode }} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">لون الحواف (الثانوي)</label>
          <div className="flex items-center gap-2">
            <input type="color" value={secondaryHexCode} onChange={e => setSecondaryHexCode(e.target.value)}
              className="w-8 h-7 rounded-md border border-slate-200 cursor-pointer p-0.5" />
            <input type="text" value={secondaryHexCode} onChange={e => setSecondaryHexCode(e.target.value)}
              className="flex-1 border border-slate-200 rounded-md px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-300 bg-white" />
            <div className="w-6 h-6 rounded-full border border-slate-200 flex-shrink-0" style={{ backgroundColor: secondaryHexCode }} />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">✏️ سعر مع طباعة (د.أ)</label>
          <input type="number" min={1} value={priceWithCustomization}
            onChange={e => setPriceWithCustomization(e.target.value)}
            placeholder="مثال: 89"
            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
          <p className="text-[10px] text-slate-400 mt-0.5">اتركه فارغاً لاستخدام سعر الفريق</p>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">👕 سعر بدون طباعة (د.أ)</label>
          <input type="number" min={1} value={priceWithoutCustomization}
            onChange={e => setPriceWithoutCustomization(e.target.value)}
            placeholder="مثال: 65"
            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
          <p className="text-[10px] text-slate-400 mt-0.5">اتركه فارغاً لاستخدام سعر الفريق</p>
        </div>
      </div>

      {/* Default */}
      <div className="flex items-center gap-2 mb-4">
        <input type="checkbox" id={`def-${teamId}`} checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="rounded" />
        <label htmlFor={`def-${teamId}`} className="text-xs text-slate-600">اجعله الجيرسيه الافتراضي</label>
      </div>

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
          <Check size={12} />{saving ? "جاري الحفظ..." : "حفظ"}
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg">
          <X size={12} />إلغاء
        </button>
      </div>
    </div>
  );
}

/* ── Team Card ───────────────────────────────────────── */
function TeamCard({ team, onTeamUpdate, onDelete }: { team: Team; onTeamUpdate: (t: Team) => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [colors, setColors]     = useState<JerseyColor[]>([]);
  const [colorsLoaded, setColorsLoaded] = useState(false);
  const [colorsLoading, setColorsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  async function loadColors() {
    if (colorsLoaded) return;
    setColorsLoading(true);
    try {
      const c = await apiFetch(`/admin/teams/${team.id}/colors`);
      setColors(c);
      setColorsLoaded(true);
    } catch { toast.error("فشل تحميل الجيرسيهات"); }
    finally { setColorsLoading(false); }
  }

  function handleToggle() { if (!expanded) loadColors(); setExpanded(e => !e); }

  async function patchTeam(data: Record<string, unknown>) {
    const updated = await apiFetch(`/admin/teams/${team.id}`, { method: "PATCH", body: JSON.stringify(data) });
    onTeamUpdate(updated);
    toast.success("تم الحفظ");
  }

  async function updateColor(colorId: number, data: Partial<JerseyColor>) {
    const updated = await apiFetch(`/admin/teams/${team.id}/colors/${colorId}`, { method: "PATCH", body: JSON.stringify(data) });
    setColors(prev => prev.map(c => c.id === colorId ? updated : c));
    toast.success("تم التحديث");
  }

  async function deleteColor(colorId: number) {
    await apiFetch(`/admin/teams/${team.id}/colors/${colorId}`, { method: "DELETE" });
    setColors(prev => prev.filter(c => c.id !== colorId));
    toast.success("تم الحذف");
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors" onClick={handleToggle}>
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-xl border-2 border-white shadow" style={{ backgroundColor: team.primaryColor }} />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: team.secondaryColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800">{team.name}</span>
            <span className="text-xs text-slate-400">{team.nameEn}</span>
            <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{team.league}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-slate-500">{team.orderCount} طلب</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">السعر: {team.basePrice} د.أ</span>
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); patchTeam({ isPopular: !team.isPopular }); }}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${team.isPopular ? "text-amber-500 bg-amber-50" : "text-slate-300 hover:text-amber-400"}`}>
          <Star size={16} fill={team.isPopular ? "currentColor" : "none"} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="flex-shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 size={16} />
        </button>
        <div className={`flex-shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}>
          <ChevronDown size={18} />
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-4">
          {/* Team settings */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 bg-slate-50 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">السعر الأساسي:</span>
                <InlineEdit value={team.basePrice} type="number" min={1} suffix="د.أ"
                  onSave={async v => { await patchTeam({ basePrice: parseFloat(v) }); }} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">اللون الأساسي:</span>
                <ColorPicker value={team.primaryColor} onSave={async v => { await patchTeam({ primaryColor: v }); }} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">اللون الثانوي:</span>
                <ColorPicker value={team.secondaryColor} onSave={async v => { await patchTeam({ secondaryColor: v }); }} />
              </div>
            </div>

            {/* Logo upload */}
            <LogoUploadRow team={team} onSave={async url => { await patchTeam({ logoUrl: url }); }} />
          </div>

          {/* Jersey photos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700">
                صور الجيرسيهات ({colors.length})
              </span>
              {!showAddForm && (
                <button onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                  <Plus size={12} />إضافة جيرسيه
                </button>
              )}
            </div>

            {colorsLoading && <div className="flex justify-center py-6"><RefreshCw size={18} className="animate-spin text-emerald-500" /></div>}

            {!colorsLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {colors.map(c => (
                  <JerseyColorCard key={c.id} color={c}
                    onDelete={async () => { await deleteColor(c.id); }}
                    onUpdate={async data => { await updateColor(c.id, data); }} />
                ))}

                {showAddForm && (
                  <AddJerseyColorForm teamId={team.id} colorsCount={colors.length}
                    onAdd={c => { setColors(prev => [...prev, c]); setShowAddForm(false); }}
                    onCancel={() => setShowAddForm(false)} />
                )}

                {colors.length === 0 && !showAddForm && (
                  <div className="col-span-full py-6 text-center">
                    <p className="text-sm text-slate-400 mb-2">لا توجد جيرسيهات بعد</p>
                    <button onClick={() => setShowAddForm(true)} className="text-emerald-600 text-xs hover:underline">أضف أول جيرسيه</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Add Team Form ─────────────────────────────────── */
function AddTeamForm({ onAdd, onCancel }: { onAdd: (t: Team) => void; onCancel: () => void }) {
  const [name, setName]                   = useState("");
  const [nameEn, setNameEn]               = useState("");
  const [league, setLeague]               = useState("الدوري الأردني");
  const [primaryColor, setPrimaryColor]   = useState("#1a1a2e");
  const [secondaryColor, setSecondaryColor] = useState("#ffffff");
  const [basePrice, setBasePrice]         = useState(89);
  const [saving, setSaving]               = useState(false);

  async function handleSave() {
    if (!name.trim() || !nameEn.trim()) { toast.error("الاسم (عربي وإنجليزي) مطلوب"); return; }
    setSaving(true);
    try {
      const team = await apiFetch("/admin/teams", {
        method: "POST",
        body: JSON.stringify({ name, nameEn, league, primaryColor, secondaryColor, basePrice }),
      });
      onAdd(team);
      toast.success("تم إضافة الفريق");
    } catch { toast.error("فشل إضافة الفريق"); }
    finally { setSaving(false); }
  }

  return (
    <div className="bg-white border-2 border-dashed border-emerald-200 rounded-2xl p-5 mb-4">
      <h3 className="font-semibold text-slate-700 mb-4">فريق جديد</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">الاسم بالعربي *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: الوحدات"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">الاسم بالإنجليزي *</label>
          <input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="e.g. Al-Wehdat"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" dir="ltr" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">الدوري / البطولة</label>
          <select value={league} onChange={e => setLeague(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
            {LEAGUES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">السعر الأساسي (د.أ)</label>
          <input type="number" value={basePrice} min={1} onChange={e => setBasePrice(Number(e.target.value))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">اللون الأساسي</label>
          <div className="flex items-center gap-2">
            <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
              className="w-9 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
            <span className="text-xs font-mono text-slate-500">{primaryColor}</span>
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">اللون الثانوي</label>
          <div className="flex items-center gap-2">
            <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
              className="w-9 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
            <span className="text-xs font-mono text-slate-500">{secondaryColor}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Check size={14} />{saving ? "جاري الحفظ..." : "إضافة الفريق"}
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg">
          <X size={14} />إلغاء
        </button>
      </div>
    </div>
  );
}

function TeamsSection() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/admin/teams").then(setTeams).catch(() => toast.error("فشل تحميل الفرق")).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteTeam(id: number, name: string) {
    if (!confirm(`هل أنت متأكد من حذف فريق "${name}"؟ سيتم حذف جميع جيرسيهاته أيضاً.`)) return;
    try {
      await apiFetch(`/admin/teams/${id}`, { method: "DELETE" });
      setTeams(prev => prev.filter(t => t.id !== id));
      toast.success("تم حذف الفريق");
    } catch { toast.error("فشل حذف الفريق"); }
  }

  const filtered = teams.filter(t =>
    !search || t.name.includes(search) || t.nameEn.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl">
      <PageHeader title="الفرق والجيرسيهات" subtitle={`${teams.length} فريق`}>
        <button onClick={load} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5">
          <RefreshCw size={14} />تحديث
        </button>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
          <Plus size={14} />إضافة فريق
        </button>
      </PageHeader>

      {showAdd && (
        <AddTeamForm
          onAdd={t => { setTeams(prev => [t, ...prev]); setShowAdd(false); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <div className="mb-4">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن فريق..."
          className="w-full max-w-xs border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
      </div>
      <div className="space-y-3">
        {filtered.map(team => (
          <TeamCard key={team.id} team={team}
            onTeamUpdate={updated => setTeams(prev => prev.map(t => t.id === updated.id ? updated : t))}
            onDelete={() => deleteTeam(team.id, team.name)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center text-slate-400 text-sm">
            {teams.length === 0 ? "لا توجد فرق بعد — أضف أول فريق!" : "لا توجد فرق مطابقة"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Nahfat ─────────────────────────────────────────────── */
/* ─── Stickers ──────────────────────────────────────────── */
interface StickerItem {
  id: number; name: string; url: string;
  category: string; isActive: boolean; sortOrder: number;
}

function StickersSection() {
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [showAdd, setShowAdd]   = useState(false);
  const [urlMode, setUrlMode]   = useState<"upload" | "link">("upload");

  const [addName, setAddName]   = useState("");
  const [addCat, setAddCat]     = useState("عام");
  const [addUrl, setAddUrl]     = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCat,  setEditCat]  = useState("");

  const { uploadFile, isUploading } = useUpload();

  useEffect(() => {
    apiFetch("/admin/stickers")
      .then(setStickers)
      .catch(() => toast.error("فشل تحميل الملصقات"))
      .finally(() => setLoading(false));
  }, []);

  async function handleFileUpload(file: File) {
    const res = await uploadFile(file);
    if (res) {
      setAddUrl(`/api/storage${res.objectPath}`);
      toast.success("تم رفع الصورة");
    } else {
      toast.error("فشل رفع الصورة");
    }
  }

  async function handleAdd() {
    if (!addName.trim()) { toast.error("أدخل اسم الملصق"); return; }
    if (!addUrl.trim())  { toast.error("ارفع صورة أو أدخل رابطاً"); return; }
    setSaving(true);
    try {
      const s = await apiFetch("/admin/stickers", {
        method: "POST",
        body: JSON.stringify({ name: addName, url: addUrl, category: addCat, isActive: true, sortOrder: stickers.length }),
      });
      setStickers(prev => [...prev, s]);
      setAddName(""); setAddUrl(""); setAddCat("عام"); setShowAdd(false);
      toast.success("تم إضافة الملصق");
    } catch { toast.error("فشل الإضافة"); }
    finally { setSaving(false); }
  }

  async function toggleActive(s: StickerItem) {
    try {
      const updated = await apiFetch(`/admin/stickers/${s.id}`, {
        method: "PUT", body: JSON.stringify({ isActive: !s.isActive }),
      });
      setStickers(prev => prev.map(x => x.id === s.id ? updated : x));
    } catch { toast.error("فشل التحديث"); }
  }

  async function handleEdit(id: number) {
    if (!editName.trim()) { toast.error("الاسم مطلوب"); return; }
    setSaving(true);
    try {
      const updated = await apiFetch(`/admin/stickers/${id}`, {
        method: "PUT", body: JSON.stringify({ name: editName, category: editCat }),
      });
      setStickers(prev => prev.map(x => x.id === id ? updated : x));
      setEditingId(null);
      toast.success("تم التحديث");
    } catch { toast.error("فشل التحديث"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("حذف هذا الملصق؟")) return;
    try {
      await apiFetch(`/admin/stickers/${id}`, { method: "DELETE" });
      setStickers(prev => prev.filter(x => x.id !== id));
      toast.success("تم الحذف");
    } catch { toast.error("فشل الحذف"); }
  }

  const categories = [...new Set(stickers.map(s => s.category))];

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl">
      <PageHeader title="إدارة الملصقات" subtitle={`${stickers.length} ملصق`}>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
          <Plus size={14} /> إضافة ملصق
        </button>
      </PageHeader>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 space-y-4">
          <h3 className="font-semibold text-slate-700">ملصق جديد</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">اسم الملصق *</label>
              <input type="text" value={addName} onChange={e => setAddName(e.target.value)}
                placeholder="مثال: كرة نار، نجمة ذهبية..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">الفئة</label>
              <input type="text" value={addCat} onChange={e => setAddCat(e.target.value)}
                placeholder="رياضة، كوميك، عام..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            </div>
          </div>

          {/* Image source toggle */}
          <div>
            <label className="block text-sm text-slate-600 mb-2">الصورة</label>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setUrlMode("upload")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${urlMode === "upload" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                <Upload size={12} /> رفع صورة
              </button>
              <button onClick={() => setUrlMode("link")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${urlMode === "link" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                <LinkIcon size={12} /> رابط خارجي
              </button>
            </div>

            {urlMode === "upload" ? (
              <div className="flex items-center gap-4">
                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer text-sm transition-colors ${isUploading ? "opacity-50 pointer-events-none" : "border-slate-300 hover:border-emerald-400 hover:bg-emerald-50"}`}>
                  <Upload size={16} className="text-slate-400" />
                  <span className="text-slate-500">{isUploading ? "جاري الرفع..." : "اختر صورة PNG/WebP"}</span>
                  <input type="file" accept="image/png,image/webp,image/gif,image/svg+xml"
                    className="sr-only"
                    onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                </label>
                {addUrl && (
                  <img src={addUrl} alt="preview"
                    className="w-14 h-14 object-contain rounded-lg border border-slate-200 bg-slate-50" />
                )}
              </div>
            ) : (
              <input type="url" value={addUrl} onChange={e => setAddUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            )}
          </div>

          {/* Preview */}
          {addUrl && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <img src={addUrl} alt="preview" className="w-16 h-16 object-contain" />
              <div>
                <p className="font-semibold text-slate-700 text-sm">{addName || "بدون اسم"}</p>
                <p className="text-slate-400 text-xs">{addCat}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={saving || isUploading || !addName || !addUrl}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              حفظ الملصق
            </button>
            <button onClick={() => { setShowAdd(false); setAddName(""); setAddUrl(""); setAddCat("عام"); }}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg">
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {stickers.length === 0 && !showAdd && (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
          <p className="text-5xl mb-3">🎨</p>
          <p className="font-semibold text-slate-600 mb-1">لا توجد ملصقات بعد</p>
          <p className="text-slate-400 text-sm">أضف ملصقات يستطيع العملاء وضعها على جيرسيهاتهم</p>
        </div>
      )}

      {/* Stickers grid by category */}
      {categories.length > 0 && categories.map(cat => {
        const catStickers = stickers.filter(s => s.category === cat);
        return (
          <div key={cat} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{cat}</span>
              <span className="text-xs text-slate-400">({catStickers.length})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {catStickers.map(s => (
                <div key={s.id}
                  className={`bg-white border rounded-2xl overflow-hidden transition-all ${s.isActive ? "border-slate-200" : "border-slate-100 opacity-50"}`}>
                  {/* Image */}
                  <div className="bg-slate-50 flex items-center justify-center p-3 h-24 relative">
                    <img src={s.url} alt={s.name}
                      className="max-w-full max-h-full object-contain"
                      onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E"; }} />
                    {/* Active toggle */}
                    <button onClick={() => toggleActive(s)}
                      className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${s.isActive ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-300"}`}>
                      {s.isActive && <Check size={10} className="text-white" />}
                    </button>
                  </div>

                  {/* Info + actions */}
                  {editingId === s.id ? (
                    <div className="p-2 space-y-1.5">
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                      <input type="text" value={editCat} onChange={e => setEditCat(e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(s.id)} disabled={saving}
                          className="flex-1 bg-emerald-500 text-white text-xs py-1 rounded flex items-center justify-center gap-1">
                          {saving ? <RefreshCw size={10} className="animate-spin" /> : <Check size={10} />} حفظ
                        </button>
                        <button onClick={() => setEditingId(null)} className="px-2 text-slate-400 hover:text-slate-600">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-2 py-2">
                      <p className="text-xs font-semibold text-slate-700 truncate">{s.name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <button onClick={() => { setEditingId(s.id); setEditName(s.name); setEditCat(s.category); }}
                          className="text-slate-400 hover:text-emerald-600 transition-colors p-0.5">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => handleDelete(s.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-0.5">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NahfatSection() {
  const [presets, setPresets] = useState<NahfatPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editCat, setEditCat] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addText, setAddText] = useState("");
  const [addCat, setAddCat] = useState("عربي");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch("/admin/nahfat").then(setPresets).catch(() => toast.error("فشل تحميل النهفات")).finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!addText.trim()) { toast.error("أدخل نص النهفة"); return; }
    setSaving(true);
    try {
      const p = await apiFetch("/admin/nahfat", {
        method: "POST",
        body: JSON.stringify({ text: addText, category: addCat, isActive: true, sortOrder: presets.length }),
      });
      setPresets(prev => [...prev, p]);
      setAddText(""); setAddCat("عربي"); setShowAdd(false);
      toast.success("تم إضافة النهفة");
    } catch { toast.error("فشل الإضافة"); }
    finally { setSaving(false); }
  }

  async function handleEdit(id: number) {
    setSaving(true);
    try {
      const p = await apiFetch(`/admin/nahfat/${id}`, { method: "PUT", body: JSON.stringify({ text: editText, category: editCat }) });
      setPresets(prev => prev.map(x => x.id === id ? p : x));
      setEditingId(null); toast.success("تم التحديث");
    } catch { toast.error("فشل التحديث"); }
    finally { setSaving(false); }
  }

  async function toggleActive(preset: NahfatPreset) {
    try {
      const p = await apiFetch(`/admin/nahfat/${preset.id}`, { method: "PUT", body: JSON.stringify({ isActive: !preset.isActive }) });
      setPresets(prev => prev.map(x => x.id === preset.id ? p : x));
    } catch { toast.error("فشل التحديث"); }
  }

  async function handleDelete(id: number) {
    try {
      await apiFetch(`/admin/nahfat/${id}`, { method: "DELETE" });
      setPresets(prev => prev.filter(x => x.id !== id));
      toast.success("تم الحذف");
    } catch { toast.error("فشل الحذف"); }
  }

  const categories = [...new Set(presets.map(p => p.category))];
  if (loading) return <PageLoader />;

  return (
    <div dir="rtl">
      <PageHeader title="إدارة النهفات" subtitle={`${presets.length} نهفة`}>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg">
          <Plus size={14} />إضافة نهفة
        </button>
      </PageHeader>

      {showAdd && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
          <h3 className="font-semibold text-slate-700 mb-3">نهفة جديدة</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">نص النهفة *</label>
              <input type="text" value={addText} onChange={e => setAddText(e.target.value)} placeholder="مثال: يا محارب ما بتهاب..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">الفئة</label>
              <input type="text" value={addCat} onChange={e => setAddCat(e.target.value)} placeholder="عربي، إنجليزي..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} disabled={saving}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
              <Check size={14} />{saving ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button onClick={() => { setShowAdd(false); setAddText(""); }}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg">
              <X size={14} />إلغاء
            </button>
          </div>
        </div>
      )}

      {(categories.length ? categories : [""]).map(cat => {
        const catPresets = presets.filter(p => cat === "" || p.category === cat);
        if (catPresets.length === 0) return null;
        return (
          <div key={cat} className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-4">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <span className="text-sm font-semibold text-slate-600">{cat || "عام"}</span>
              <span className="text-xs text-slate-400 mr-2">({catPresets.length})</span>
            </div>
            <div className="divide-y divide-slate-100">
              {catPresets.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  {editingId === p.id ? (
                    <>
                      <input type="text" value={editText} onChange={e => setEditText(e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                      <input type="text" value={editCat} onChange={e => setEditCat(e.target.value)}
                        className="w-24 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
                      <button onClick={() => handleEdit(p.id)} disabled={saving} className="text-emerald-600"><Check size={16} /></button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400"><X size={16} /></button>
                    </>
                  ) : (
                    <>
                      <p className={`flex-1 text-sm ${p.isActive ? "text-slate-800" : "text-slate-400 line-through"}`}>{p.text}</p>
                      <button onClick={() => toggleActive(p)}
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${p.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                        {p.isActive ? "مفعّل" : "معطّل"}
                      </button>
                      <button onClick={() => { setEditingId(p.id); setEditText(p.text); setEditCat(p.category); }}
                        className="text-slate-400 hover:text-slate-600"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {presets.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center text-slate-400 text-sm">
          لا توجد نهفات بعد
        </div>
      )}
    </div>
  );
}

/* ─── Branches ─────────────────────────────────────────── */
const JORDAN_GOVERNORATES = [
  "عمان", "إربد", "الزرقاء", "البلقاء", "الكرك", "مادبا",
  "جرش", "عجلون", "المفرق", "الطفيلة", "معان", "العقبة",
];

interface Branch {
  id: number; username: string; governorate: string;
  commissionRate: number; active: boolean; createdAt: string;
  totalOrders: number; revenue: number; commission: number;
}

function BranchesSection() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", governorate: JORDAN_GOVERNORATES[0], commissionRate: "10" });
  const [editForm, setEditForm] = useState({ password: "", commissionRate: "", governorate: "", active: true });

  const load = useCallback(async () => {
    setLoading(true);
    try { setBranches(await apiFetch("/admin/branches")); }
    catch { toast.error("تعذّر تحميل الفروع"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/admin/branches", { method: "POST", body: JSON.stringify({
        username: form.username, password: form.password,
        governorate: form.governorate, commissionRate: parseFloat(form.commissionRate) / 100,
      })});
      toast.success("تم إضافة الفرع");
      setShowAdd(false);
      setForm({ username: "", password: "", governorate: JORDAN_GOVERNORATES[0], commissionRate: "10" });
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message.includes("409") ? "اسم المستخدم موجود مسبقاً" : "تعذّر إضافة الفرع");
    } finally { setSaving(false); }
  }

  function startEdit(b: Branch) {
    setEditingId(b.id);
    setEditForm({ password: "", commissionRate: String(Math.round(b.commissionRate * 100)), governorate: b.governorate, active: b.active });
  }

  async function handleEdit(id: number) {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        commissionRate: parseFloat(editForm.commissionRate) / 100,
        governorate: editForm.governorate,
        active: editForm.active,
      };
      if (editForm.password) body.password = editForm.password;
      await apiFetch(`/admin/branches/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      toast.success("تم تحديث الفرع");
      setEditingId(null);
      load();
    } catch { toast.error("تعذّر تحديث الفرع"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("هل تريد حذف هذا الفرع؟")) return;
    try {
      await apiFetch(`/admin/branches/${id}`, { method: "DELETE" });
      toast.success("تم حذف الفرع");
      load();
    } catch { toast.error("تعذّر حذف الفرع"); }
  }

  const totalRevenue = branches.reduce((s, b) => s + b.revenue, 0);
  const totalCommission = branches.reduce((s, b) => s + b.commission, 0);

  return (
    <div dir="rtl">
      <PageHeader title="الفروع" subtitle="إدارة فروع بصمة في محافظات الأردن">
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <Plus size={16} /> فرع جديد
        </button>
      </PageHeader>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "إجمالي الفروع", value: branches.length, color: "text-slate-800" },
          { label: "الفروع النشطة", value: branches.filter(b => b.active).length, color: "text-emerald-600" },
          { label: "إجمالي الإيراد", value: `${totalRevenue.toLocaleString()} د.أ`, color: "text-blue-600" },
          { label: "إجمالي العمولة", value: `${totalCommission.toLocaleString()} د.أ`, color: "text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white border border-emerald-200 rounded-2xl p-5 mb-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Plus size={16} />إضافة فرع جديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">اسم المستخدم</label>
              <input type="text" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="branch_amman" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">كلمة المرور</label>
              <input type="text" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">المحافظة</label>
              <select value={form.governorate} onChange={e => setForm({ ...form, governorate: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                {JORDAN_GOVERNORATES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">نسبة العمولة %</label>
              <input type="number" required min="0" max="100" step="0.5" value={form.commissionRate}
                onChange={e => setForm({ ...form, commissionRate: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors disabled:opacity-60">
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button type="button" onClick={() => setShowAdd(false)}
              className="text-slate-600 hover:text-slate-900 text-sm px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {loading ? <PageLoader /> : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {branches.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">لا توجد فروع بعد — أضف أول فرع</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["اسم المستخدم","المحافظة","الحالة","الطلبات","الإيراد","العمولة","عمولة%","إجراءات"].map(h => (
                      <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branches.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      {editingId === b.id ? (
                        <td colSpan={8} className="px-4 py-3">
                          <div className="flex flex-wrap gap-3 items-end">
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">كلمة مرور جديدة (اختياري)</label>
                              <input type="text" value={editForm.password}
                                onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-40 focus:outline-none" placeholder="اتركه فارغاً" />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">المحافظة</label>
                              <select value={editForm.governorate} onChange={e => setEditForm({ ...editForm, governorate: e.target.value })}
                                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
                                {JORDAN_GOVERNORATES.map(g => <option key={g}>{g}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">عمولة %</label>
                              <input type="number" min="0" max="100" step="0.5" value={editForm.commissionRate}
                                onChange={e => setEditForm({ ...editForm, commissionRate: e.target.value })}
                                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-20 focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">الحالة</label>
                              <select value={editForm.active ? "active" : "inactive"}
                                onChange={e => setEditForm({ ...editForm, active: e.target.value === "active" })}
                                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
                                <option value="active">نشط</option>
                                <option value="inactive">معطّل</option>
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleEdit(b.id)} disabled={saving}
                                className="bg-emerald-500 text-white rounded-lg px-3 py-1.5 text-sm hover:bg-emerald-600 disabled:opacity-60">
                                <Check size={14} />
                              </button>
                              <button onClick={() => setEditingId(null)}
                                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50">
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-mono text-slate-800 font-medium">{b.username}</td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1.5">
                              <MapPin size={13} className="text-slate-400" />{b.governorate}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              b.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                            }`}>{b.active ? "نشط" : "معطّل"}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{b.totalOrders}</td>
                          <td className="px-4 py-3 text-slate-700">{b.revenue.toLocaleString()} د.أ</td>
                          <td className="px-4 py-3 text-purple-700 font-medium">{b.commission.toLocaleString()} د.أ</td>
                          <td className="px-4 py-3 text-slate-500">{Math.round(b.commissionRate * 100)}%</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <button onClick={() => startEdit(b)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => handleDelete(b.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Shared ─────────────────────────────────────────── */
function PageLoader() {
  return <div className="flex items-center justify-center py-16"><RefreshCw size={24} className="animate-spin text-emerald-500" /></div>;
}

function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5" dir="rtl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-800">{title}</h1>
          {subtitle && <p className="text-xs md:text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {children && <div className="flex gap-2 flex-shrink-0">{children}</div>}
      </div>
    </div>
  );
}

/* ─── App ─────────────────────────────────────────────── */
export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("admin_authed") === "1");
  const [section, setSection] = useState<Section>("dashboard");

  if (!authed) return (
    <>
      <LoginScreen onLogin={() => setAuthed(true)} />
      <Toaster position="top-center" richColors />
    </>
  );

  const handleLogout = () => { sessionStorage.removeItem("admin_authed"); setAuthed(false); };

  return (
    <div className="flex min-h-screen bg-slate-100" dir="rtl">
      <Sidebar active={section} onSelect={setSection} onLogout={handleLogout} />
      <main className="flex-1 p-3 md:p-6 overflow-y-auto min-h-screen pb-24 md:pb-6">
        {section === "dashboard" && <Dashboard />}
        {section === "orders" && <OrdersSection />}
        {section === "teams" && <TeamsSection />}
        {section === "nahfat" && <NahfatSection />}
        {section === "stickers" && <StickersSection />}
        {section === "branches" && <BranchesSection />}
      </main>
      <MobileNav active={section} onSelect={setSection} onLogout={handleLogout} />
      <Toaster position="top-center" richColors />
    </div>
  );
}
