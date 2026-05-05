import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

interface TrackedOrder {
  id: number; teamName: string; customerName: string;
  jerseyNumber: string; size: string; totalPrice: number;
  status: string; createdAt: string;
  frontImageUrl?: string | null;
  jerseyColorName?: string | null;
  playerName?: string | null;
  customerCity: string;
}

function StatusTimeline({ status }: { status: string }) {
  const { t } = useTranslation();

  const STAGES = [
    { key: "pending",   label: t("track_stage_pending"),   icon: "📬", color: "#facc15", bg: "#78350f" },
    { key: "confirmed", label: t("track_stage_confirmed"), icon: "✅", color: "#34d399", bg: "#064e3b" },
    { key: "shipped",   label: t("track_stage_shipped"),   icon: "🖨️", color: "#a78bfa", bg: "#3b0764" },
    { key: "delivered", label: t("track_stage_delivered"), icon: "🏆", color: "#fb923c", bg: "#431407" },
  ];

  const stageIdx = (s: string) => {
    if (s === "cancelled") return -1;
    const i = STAGES.findIndex(st => st.key === s);
    return i === -1 ? 0 : i;
  };

  const current = stageIdx(status);
  const cancelled = status === "cancelled";

  if (cancelled) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-950/60 border border-red-500/30">
        <span className="text-lg">❌</span>
        <span className="text-red-400 font-bold text-sm">{t("track_cancelled")}</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-0 w-full">
      {STAGES.map((stage, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <div key={stage.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.12 }}
                className="relative flex items-center justify-center rounded-full text-base transition-all"
                style={{
                  width: active ? 44 : 36,
                  height: active ? 44 : 36,
                  background: done ? stage.bg : "#1a1a1a",
                  border: `2px solid ${done ? stage.color : "#333"}`,
                  boxShadow: active ? `0 0 18px ${stage.color}60` : "none",
                  flexShrink: 0,
                }}
              >
                <span style={{ filter: done ? "none" : "grayscale(1) opacity(0.3)" }}>{stage.icon}</span>
                {active && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: `2px solid ${stage.color}` }}
                    animate={{ scale: [1, 1.35, 1], opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                  />
                )}
              </motion.div>
              <span className="text-[9px] font-bold whitespace-nowrap"
                style={{ color: done ? stage.color : "#444" }}>
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 mb-5 rounded-full overflow-hidden bg-[#222]">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: i < current ? "100%" : "0%" }}
                  transition={{ delay: i * 0.12 + 0.2, duration: 0.5 }}
                  style={{ background: STAGES[i].color }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order }: { order: TrackedOrder }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111] border border-white/[0.07] rounded-2xl overflow-hidden"
    >
      <div className="flex items-start gap-4 p-4">
        <div className="shrink-0 w-16 h-20 rounded-xl overflow-hidden bg-black/50 border border-white/[0.08] flex items-center justify-center">
          {order.frontImageUrl ? (
            <img src={order.frontImageUrl} alt="" className="w-full h-full object-contain" />
          ) : (
            <span className="text-3xl">👕</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <h3 className="font-black text-white text-sm">{order.teamName}</h3>
              {order.playerName && (
                <p className="text-[#bfff00] font-bold text-xs tracking-widest uppercase">
                  {order.playerName} #{order.jerseyNumber}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[#bfff00] font-black text-sm">{order.totalPrice} {t("order_currency")}</p>
              <p className="text-white/30 text-[9px]">#{order.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-white/40 mb-3">
            <span>📐 {order.size}</span>
            <span>📍 {order.customerCity}</span>
            <span>📅 {new Date(order.createdAt).toLocaleDateString()}</span>
          </div>

          <StatusTimeline status={order.status} />
        </div>
      </div>

      <div className="border-t border-white/[0.05] px-4 py-2.5 flex items-center justify-between">
        <span className="text-white/30 text-[10px]">{t("track_need_help")}</span>
        <a
          href={`https://wa.me/962799999999?text=${encodeURIComponent(`Hi, I want to ask about order #${order.id}`)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[10px] font-bold text-[#25d366] hover:text-[#25d366]/80 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.532 5.849L0 24l6.335-1.61A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.662-.504-5.197-1.382l-.373-.22-3.763.957.99-3.671-.242-.388A9.947 9.947 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
          {t("track_contact")}
        </a>
      </div>
    </motion.div>
  );
}

export default function Track() {
  const [, setLocation] = useLocation();
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = phone.trim();
    if (!p) return;
    setLoading(true); setError(""); setSearched(false);
    try {
      const res = await fetch(`/api/orders/by-phone?phone=${encodeURIComponent(p)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data);
      setSearched(true);
    } catch {
      setError(t("track_error"));
    } finally {
      setLoading(false);
    }
  };

  const STAGE_LEGEND = [
    { icon: "📬", label: t("track_stage_pending"),   color: "#facc15" },
    { icon: "✅", label: t("track_stage_confirmed"), color: "#34d399" },
    { icon: "🖨️", label: t("track_stage_shipped"),   color: "#a78bfa" },
    { icon: "🏆", label: t("track_stage_delivered"), color: "#fb923c" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, #bfff0015 0%, transparent 60%)" }} />
        <div className="max-w-lg mx-auto px-4 pt-16 pb-10 text-center relative z-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-6xl mb-4">📦</motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-black mb-2">
            {t("track_title")} <span style={{ color: "#bfff00" }}>{t("track_accent")}</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/40 text-sm">
            {t("track_sub")}
          </motion.p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-20">
        <motion.form
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          onSubmit={handleSearch}
          className="flex gap-2 mb-8"
        >
          <input
            type="tel" dir="ltr"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="07xxxxxxxx"
            className="flex-1 px-4 py-4 bg-white/[0.05] border border-white/[0.10] text-white text-center text-lg font-bold tracking-widest focus:outline-none focus:border-[#bfff00]/60 transition-colors placeholder:text-white/20 rounded-xl"
          />
          <button
            type="submit" disabled={loading || !phone.trim()}
            className="px-6 py-4 font-black text-black rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: phone.trim() ? "#bfff00" : "#333" }}
          >
            {loading ? t("track_searching") : t("track_search")}
          </button>
        </motion.form>

        {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}

        <AnimatePresence mode="wait">
          {searched && orders !== null && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {orders.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-5xl mb-4">🔍</p>
                  <p className="text-white/50 font-bold">{t("track_no_orders")}</p>
                  <p className="text-white/25 text-sm mt-2">{t("track_no_orders_hint")}</p>
                </div>
              ) : (
                <>
                  <p className="text-white/40 text-xs font-bold text-center mb-2">
                    {t("track_count", { count: orders.length })}
                  </p>
                  {orders.map(o => <OrderCard key={o.id} order={o} />)}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!searched && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-center"
          >
            <div className="grid grid-cols-2 gap-3 mb-8">
              {STAGE_LEGEND.map(s => (
                <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3">
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-xs font-bold" style={{ color: s.color }}>{s.label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setLocation("/teams")}
              className="text-white/40 text-sm hover:text-white/70 transition-colors underline underline-offset-4">
              {t("track_no_order_yet")}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
