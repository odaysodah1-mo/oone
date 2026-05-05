import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, CheckCircle, Clock, Truck, LogOut,
  RefreshCw, MapPin, Phone, User, Shirt, Hash,
  Eye, EyeOff, TrendingUp, ShoppingBag,
  XCircle, ArrowRight, AlertCircle,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */
type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

interface Order {
  id: number; teamId: number; teamName: string; customerName: string;
  jerseyNumber: string; size: string; color: string; quantity: number;
  totalPrice: number; customerPhone: string; customerCity: string;
  governorate: string; status: OrderStatus; createdAt: string;
  playerName?: string | null;
  frontImageUrl?: string | null;
  jerseyColorName?: string | null;
}

interface BranchStats {
  total: number; revenue: number; commission: number;
  pending: number; confirmed: number; shipped: number; delivered: number;
}

interface BranchSession {
  token: string; governorate: string; username: string; commissionRate: number;
}

/* ─── Constants ─────────────────────────────────────── */
const STATUS_META: Record<OrderStatus, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  pending:   { label: "طلب جديد",       icon: <Clock size={13} />,       color: "#facc15", bg: "rgba(250,204,21,0.08)",  border: "rgba(250,204,21,0.25)" },
  confirmed: { label: "قيد الطباعة",    icon: <Shirt size={13} />,       color: "#60a5fa", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.25)" },
  shipped:   { label: "خارج للتسليم",   icon: <Truck size={13} />,       color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)" },
  delivered: { label: "تم التسليم",     icon: <CheckCircle size={13} />, color: "#34d399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.25)" },
  cancelled: { label: "ملغي",            icon: <XCircle size={13} />,     color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)" },
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed", confirmed: "shipped", shipped: "delivered",
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: "تأكيد الطلب", confirmed: "إرسال للتسليم", shipped: "تم التسليم",
};

/* ─── API helper ─────────────────────────────────────── */
function apiFetch(path: string, token: string, opts?: RequestInit) {
  return fetch(`/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
  }).then(async r => {
    if (!r.ok) { const t = await r.text(); throw new Error(t); }
    if (r.status === 204) return null;
    return r.json();
  });
}

/* ─── Login ──────────────────────────────────────────── */
function LoginScreen({ onLogin }: { onLogin: (s: BranchSession) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/branch/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "بيانات غير صحيحة"); return; }
      localStorage.setItem("branch_session", JSON.stringify(data));
      onLogin(data as BranchSession);
    } catch { setError("تعذر الاتصال بالخادم"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg,#bfff00 0%,#7ecf00 100%)" }}>
            <Package size={30} className="text-black" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">بصمة</h1>
          <p className="text-white/35 mt-1 text-sm">لوحة تحكم الفرع</p>
        </motion.div>

        <motion.form initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }} onSubmit={handleSubmit}
          className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-white/40 text-xs font-bold">اسم المستخدم</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="branch_amman" required
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.10] text-white rounded-xl focus:outline-none focus:border-[#bfff00]/50 transition-colors text-sm"
              autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="text-white/40 text-xs font-bold">كلمة المرور</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.10] text-white rounded-xl focus:outline-none focus:border-[#bfff00]/50 transition-colors text-sm pl-10" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} />{error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 font-black text-black rounded-xl transition-all disabled:opacity-50 text-sm tracking-wide"
            style={{ background: "linear-gradient(135deg,#bfff00 0%,#7ecf00 100%)" }}>
            {loading ? <RefreshCw size={16} className="animate-spin mx-auto" /> : "دخول ←"}
          </button>
        </motion.form>
      </div>
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────── */
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: color + "20", color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-white/35 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-white font-black text-xl leading-none">{value}</p>
      </div>
    </div>
  );
}

/* ─── Order Card ─────────────────────────────────────── */
function OrderCard({ order, token, onStatusUpdate }: {
  order: Order; token: string; onStatusUpdate: (id: number, status: OrderStatus) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const meta = STATUS_META[order.status] ?? STATUS_META.pending;
  const next = NEXT_STATUS[order.status];
  const date = new Date(order.createdAt).toLocaleDateString("ar-JO", { day: "numeric", month: "short", year: "numeric" });

  async function advance() {
    if (!next) return;
    setUpdating(true);
    try {
      await apiFetch(`/branch/orders/${order.id}/status`, token, {
        method: "PATCH", body: JSON.stringify({ status: next }),
      });
      onStatusUpdate(order.id, next);
    } catch { alert("فشل تحديث حالة الطلب"); }
    finally { setUpdating(false); }
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="border rounded-2xl p-4 space-y-3"
      style={{ background: meta.bg, borderColor: meta.border }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full"
          style={{ background: "rgba(0,0,0,0.3)", color: meta.color, border: `1px solid ${meta.border}` }}>
          {meta.icon}{meta.label}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-white/20 text-[10px] font-mono">{date}</span>
          <span className="text-white/30 text-xs font-mono">#{order.id}</span>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5">
          <User size={11} className="shrink-0" style={{ color: meta.color }} />
          <span className="text-white/75 font-bold text-xs truncate">{order.playerName || order.customerName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone size={11} className="shrink-0" style={{ color: meta.color }} />
          <span className="text-white/60 font-mono text-xs" dir="ltr">{order.customerPhone}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shirt size={11} className="shrink-0" style={{ color: meta.color }} />
          <span className="text-white/70 text-xs truncate">{order.teamName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Hash size={11} className="shrink-0" style={{ color: meta.color }} />
          <span className="font-black text-xs" style={{ color: meta.color }}>{order.jerseyNumber}</span>
          <span className="text-white/35 text-[10px]">· {order.size}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={11} className="shrink-0" style={{ color: meta.color }} />
          <span className="text-white/55 text-xs">{order.customerCity}</span>
        </div>
        <div className="text-left">
          <span className="font-black text-sm" style={{ color: "#bfff00" }}>{order.totalPrice} د.أ</span>
        </div>
      </div>

      {order.jerseyColorName && (
        <div className="text-[10px] text-white/25 border-t border-white/[0.06] pt-2 flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full inline-block border border-white/20" style={{ backgroundColor: order.color }} />
          {order.jerseyColorName}
        </div>
      )}

      {/* Action button */}
      {next && NEXT_LABEL[order.status] && (
        <button onClick={advance} disabled={updating}
          className="w-full py-2.5 text-xs font-black rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#bfff00 0%,#7ecf00 100%)", color: "#000" }}>
          {updating
            ? <RefreshCw size={13} className="animate-spin" />
            : <>{NEXT_LABEL[order.status]} <ArrowRight size={13} /></>}
        </button>
      )}
    </motion.div>
  );
}

/* ─── Dashboard ──────────────────────────────────────── */
function Dashboard({ session, onLogout }: { session: BranchSession; onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats,  setStats]  = useState<BranchStats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<OrderStatus | "all">("all");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [o, s] = await Promise.all([
        apiFetch("/branch/orders", session.token),
        apiFetch("/branch/stats",  session.token),
      ]);
      setOrders(o ?? []);
      setStats(s);
      setLastRefresh(new Date());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "خطأ";
      if (msg.includes("401")) { onLogout(); return; }
      alert("فشل تحميل البيانات");
    }
    finally { setLoading(false); }
  }, [session.token, onLogout]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusUpdate = (id: number, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    setTimeout(fetchData, 800);
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  const FILTER_TABS: { key: OrderStatus | "all"; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "all",       label: "الكل",        icon: <ShoppingBag size={13} />, count: stats?.total },
    { key: "pending",   label: "جديد",         icon: <Clock size={13} />,       count: stats?.pending },
    { key: "confirmed", label: "طباعة",        icon: <Shirt size={13} />,       count: stats?.confirmed },
    { key: "shipped",   label: "للتسليم",      icon: <Truck size={13} />,       count: stats?.shipped },
    { key: "delivered", label: "مكتمل",        icon: <CheckCircle size={13} />, count: stats?.delivered },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white" dir="rtl">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-[#050505]/95 backdrop-blur-md border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#bfff00 0%,#7ecf00 100%)" }}>
            <Package size={15} className="text-black" />
          </div>
          <div>
            <p className="font-black text-white text-sm leading-none">فرع {session.governorate}</p>
            <p className="text-[10px] text-white/30 mt-0.5">
              آخر تحديث: {lastRefresh.toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={fetchData} disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/[0.05] transition-all">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={onLogout}
            className="flex items-center gap-1 text-white/25 hover:text-red-400 text-xs transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-400/10">
            <LogOut size={13} />خروج
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5 space-y-5">
        {/* Stats grid */}
        {stats && (
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard icon={<ShoppingBag size={16} />} label="إجمالي الطلبات"      value={stats.total}                        color="#bfff00" />
            <StatCard icon={<Clock size={16} />}       label="طلبات جديدة"          value={stats.pending}                      color="#facc15" />
            <StatCard icon={<Shirt size={16} />}       label="قيد الطباعة"          value={stats.confirmed}                    color="#60a5fa" />
            <StatCard icon={<CheckCircle size={16} />} label="مكتملة"               value={stats.delivered}                    color="#34d399" />
            <div className="col-span-2">
              <StatCard icon={<TrendingUp size={16} />}
                label={`عمولتك (${Math.round(session.commissionRate * 100)}%)`}
                value={`${stats.commission.toFixed(2)} د.أ`}
                color="#a78bfa" />
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map(tab => {
            const active = filter === tab.key;
            return (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={active
                  ? { background: "#bfff00", color: "#000" }
                  : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-[10px] font-black rounded-full px-1.5 py-0.5 ${active ? "bg-black/20" : "bg-white/10"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <RefreshCw size={28} className="animate-spin text-[#bfff00]/60" />
            <p className="text-white/25 text-sm">جاري التحميل...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Package size={44} className="mx-auto text-white/10 mb-3" />
            <p className="text-white/25 font-bold text-sm">لا توجد طلبات في هذا القسم</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-white/25 text-xs">{filtered.length} طلب</p>
            <AnimatePresence mode="popLayout">
              {filtered.map(o => (
                <OrderCard key={o.id} order={o} token={session.token} onStatusUpdate={handleStatusUpdate} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── App ────────────────────────────────────────────── */
export default function App() {
  const [session, setSession] = useState<BranchSession | null>(() => {
    try { return JSON.parse(localStorage.getItem("branch_session") || "null"); }
    catch { return null; }
  });

  const handleLogout = () => { localStorage.removeItem("branch_session"); setSession(null); };

  if (!session) return <LoginScreen onLogin={s => setSession(s)} />;
  return <Dashboard session={session} onLogout={handleLogout} />;
}
