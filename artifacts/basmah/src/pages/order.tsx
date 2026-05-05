import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateOrder, getListOrdersQueryKey, getGetOrderStatsQueryKey, getGetPopularTeamsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrder } from "@/components/order-context";
import { useTranslation } from "react-i18next";

/* ── Success screen ──────────────────────────────── */
function SuccessScreen({ orderId, phone, teamName, playerName, jerseyNumber, totalPrice, frontImageUrl, onTrack }: {
  orderId: number; phone: string; teamName: string;
  playerName?: string; jerseyNumber?: string; totalPrice: number;
  frontImageUrl?: string; onTrack: () => void;
}) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const whatsappText = encodeURIComponent(
    isAr
      ? `🏆 طلبت تيشيرت ${teamName}${playerName ? ` — ${playerName} #${jerseyNumber}` : ""} من O ONE!\nرقم الطلب: #${orderId}`
      : `🏆 I ordered a ${teamName} jersey${playerName ? ` — ${playerName} #${jerseyNumber}` : ""} from O ONE!\nOrder #${orderId}`
  );
  const igText = isAr
    ? `طلبت تيشيرتي من O ONE 🔥 #OONE #الأردن #${teamName.replace(/\s/g,"_")}`
    : `Got my custom jersey from O ONE 🔥 #OONE #Jordan #${teamName.replace(/\s/g,"_")}`;

  const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.6,
    color: ["#bfff00","#fff","#facc15","#60a5fa","#f472b6"][i % 5],
    size: 6 + Math.random() * 8,
  }));

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {PARTICLES.map(p => (
        <motion.div key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{ left: `${p.x}%`, top: -20, width: p.size, height: p.size, background: p.color }}
          animate={{ y: ["0vh", "110vh"], rotate: [0, 720], opacity: [1, 0.4] }}
          transition={{ delay: p.delay, duration: 2.2 + Math.random(), ease: "easeIn" }}
        />
      ))}

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, #bfff0012 0%, transparent 60%)" }} />

      <div className="relative z-10 w-full max-w-sm text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="text-7xl mb-4"
        >🏆</motion.div>

        <motion.h1
          initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-3xl font-black mb-1"
        >
          {t("success_title")} <span style={{ color: "#bfff00" }}>{t("success_accent")}</span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-white/40 text-sm mb-6"
        >
          {t("success_sub", { phone })}
        </motion.p>

        <motion.div
          initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
          className="bg-[#111] border border-white/[0.08] rounded-2xl p-4 mb-6 text-right"
        >
          <div className="flex items-center gap-4 mb-4">
            {frontImageUrl ? (
              <img src={frontImageUrl} alt="jersey"
                className="w-16 h-20 object-contain rounded-xl bg-black/50 border border-white/[0.08]" />
            ) : (
              <div className="w-16 h-20 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-3xl">
                👕
              </div>
            )}
            <div className="flex-1">
              <p className="font-black text-white text-sm">{teamName}</p>
              {playerName && (
                <p className="text-[#bfff00] font-bold text-xs tracking-widest uppercase mt-0.5">
                  {playerName} {jerseyNumber ? `#${jerseyNumber}` : ""}
                </p>
              )}
              <p className="text-white/40 text-xs mt-1">
                {t("order_order_num")}: <span className="text-white/70 font-bold">#{orderId}</span>
              </p>
            </div>
            <div className="text-left">
              <p className="text-[#bfff00] font-black text-lg">{totalPrice}</p>
              <p className="text-white/30 text-xs">{t("order_currency")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#bfff00]/10 border border-[#bfff00]/20 rounded-xl px-3 py-2">
            <span className="text-base">📬</span>
            <span className="text-[#bfff00] text-xs font-bold">{t("success_status")}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-black text-sm transition-all active:scale-95"
            style={{ background: "#25d366", color: "#000" }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.532 5.849L0 24l6.335-1.61A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.662-.504-5.197-1.382l-.373-.22-3.763.957.99-3.671-.242-.388A9.947 9.947 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            {t("success_whatsapp")}
          </a>

          <button
            onClick={() => { navigator.clipboard.writeText(igText); }}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-black text-sm transition-all active:scale-95 bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#dc2743] text-white"
          >
            <span>📸</span> {t("success_ig")}
          </button>

          <button
            onClick={onTrack}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm border border-white/[0.10] text-white/60 hover:text-white hover:border-white/20 transition-all"
          >
            {t("success_track")}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Main order page ─────────────────────────────── */
export default function Order() {
  const [, setLocation] = useLocation();
  const { order, clearOrder } = useOrder();
  const queryClient = useQueryClient();
  const createOrder = useCreateOrder();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [city, setCity] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const GOVERNORATES = [
    "عمان", "إربد", "الزرقاء", "البلقاء", "الكرك", "مادبا",
    "جرش", "عجلون", "المفرق", "الطفيلة", "معان", "العقبة",
  ] as const;

  const isValidPhone = /^07\d{8}$/.test(phone);
  const showPhoneError = phoneTouched && phone.length > 0 && !isValidPhone;
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card" | "wallet">("cod");
  const [successData, setSuccessData] = useState<{ orderId: number; totalPrice: number } | null>(null);

  const PAYMENT_METHODS = [
    { id: "cod",    icon: "💵", label: t("order_pay_cod"),    sublabel: t("order_pay_cod_sub"),    available: true  },
    { id: "card",   icon: "💳", label: t("order_pay_card"),   sublabel: t("order_pay_card_sub"),   available: false },
    { id: "wallet", icon: "📱", label: t("order_pay_wallet"), sublabel: t("order_pay_wallet_sub"), available: false },
  ] as const;

  if (!order.teamId && !successData) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center px-4">
        <span className="text-6xl mb-4">🛒</span>
        <h2 className="text-2xl font-black text-white mb-2">{t("order_empty_title")}</h2>
        <p className="text-white/40 text-sm mb-6">{t("order_empty_sub")}</p>
        <button
          onClick={() => setLocation("/teams")}
          className="px-8 py-3 font-black text-black rounded-xl text-sm"
          style={{ background: "#bfff00" }}
        >
          {t("order_browse_teams")}
        </button>
      </div>
    );
  }

  if (successData) {
    return (
      <SuccessScreen
        orderId={successData.orderId}
        totalPrice={successData.totalPrice}
        phone={phone}
        teamName={order.teamName || ""}
        playerName={order.playerName}
        jerseyNumber={order.jerseyNumber}
        frontImageUrl={order.frontImageUrl}
        onTrack={() => setLocation(`/track`)}
      />
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone || !city || !governorate) return;
    createOrder.mutate({
      data: {
        teamId: order.teamId!,
        customerName: order.customerName || "BASMAH",
        jerseyNumber: order.jerseyNumber || "10",
        size: order.size as "XS" | "S" | "M" | "L" | "XL" | "XXL",
        color: order.color!,
        quantity: 1,
        customerPhone: phone,
        customerCity: city,
        governorate: governorate as string,
        playerName: order.playerName || undefined,
        frontImageUrl: order.frontImageUrl || undefined,
        backImageUrl: order.backImageUrl || undefined,
        jerseyColorName: order.jerseyColorName || undefined,
        jerseyColorId: order.jerseyColorId ?? undefined,
        customPhrase: order.customPhrase || undefined,
        notes: notes.trim() || undefined,
        address: address.trim() || undefined,
      } as Parameters<typeof createOrder.mutate>[0]["data"]
    }, {
      onSuccess: (data: { id: number; totalPrice: number }) => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetOrderStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPopularTeamsQueryKey() });
        setSuccessData({ orderId: data.id, totalPrice: data.totalPrice });
        clearOrder();
      },
      onError: () => alert(t("order_error")),
    });
  };

  const basePrice = order.basePrice ?? 89;
  const delivery = 3;
  const phrasePrice = order.phrasePrintPrice ?? 0;
  const grandTotal = basePrice + delivery + phrasePrice;

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-16">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 40% at 50% 0%, #bfff0010 0%, transparent 60%)" }} />
        <div className="max-w-2xl mx-auto px-4 pt-12 pb-6 relative z-10">
          <motion.h1
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-black text-center mb-1"
          >
            {t("order_confirm_title")} <span style={{ color: "#bfff00" }}>{t("order_confirm_accent")}</span>
          </motion.h1>
          <p className="text-white/30 text-center text-sm">{t("order_confirm_sub")}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-5">

        {/* Jersey design preview */}
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="bg-[#111] border border-white/[0.08] rounded-2xl overflow-hidden"
        >
          <div className="flex items-center gap-4 p-4">
            <div className="w-20 h-24 rounded-xl overflow-hidden bg-black/50 border border-white/[0.08] flex items-center justify-center shrink-0">
              {order.frontImageUrl ? (
                <img src={order.frontImageUrl} alt="jersey" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"
                  style={{ background: order.color || "#1a1a1a" }}>
                  <span className="text-3xl">👕</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-0.5">{t("order_team_label")}</p>
              <p className="font-black text-white text-lg leading-tight">{order.teamName}</p>
              {order.playerName && (
                <p className="text-[#bfff00] font-bold text-sm tracking-widest uppercase mt-1">
                  {order.playerName}
                  {order.jerseyNumber && ` #${order.jerseyNumber}`}
                </p>
              )}
              {order.jerseyColorName && (
                <p className="text-white/30 text-xs mt-1">🎨 {order.jerseyColorName} — {order.size}</p>
              )}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="border-t border-white/[0.06] px-4 py-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">{t("order_jersey_price")}</span>
              <span className="text-white font-bold">{basePrice} {t("order_currency")}</span>
            </div>
            {phrasePrice > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-white/40">✍️ طباعة عبارة مخصصة</span>
                <span className="text-white font-bold">{phrasePrice} {t("order_currency")}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-white/40">{t("order_delivery")}</span>
              <span className="text-white font-bold">{delivery} {t("order_currency")}</span>
            </div>
            <div className="flex justify-between text-sm pt-1.5 border-t border-white/[0.06]">
              <span className="text-white font-black">{t("order_total")}</span>
              <span className="font-black text-lg" style={{ color: "#bfff00" }}>{grandTotal} {t("order_currency")}</span>
            </div>
          </div>
          {/* Custom phrase preview */}
          {order.customPhrase && (
            <div className="border-t border-white/[0.04] px-4 py-2">
              <p className="text-[10px] text-white/30 font-bold">✍️ العبارة المراد طباعتها:</p>
              <p className="text-sm text-[#bfff00] font-black mt-0.5" dir="auto">{order.customPhrase}</p>
            </div>
          )}
        </motion.div>

        {/* Payment method */}
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-[#111] border border-white/[0.08] rounded-2xl p-4"
        >
          <h3 className="font-black text-white text-sm mb-3 flex items-center gap-2">
            {t("order_payment_title")}
          </h3>
          <div className="space-y-2">
            {PAYMENT_METHODS.map(m => (
              <button
                key={m.id}
                onClick={() => m.available && setPaymentMethod(m.id as "cod")}
                disabled={!m.available}
                className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: paymentMethod === m.id ? "#bfff00" : "rgba(255,255,255,0.08)",
                  background: paymentMethod === m.id ? "rgba(191,255,0,0.08)" : "rgba(255,255,255,0.02)",
                  textAlign: isAr ? "right" : "left",
                }}
              >
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-white">{m.label}</p>
                  <p className="text-white/35 text-xs">{m.sublabel}</p>
                </div>
                {m.available && (
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: paymentMethod === m.id ? "#bfff00" : "#444" }}>
                    {paymentMethod === m.id && (
                      <div className="w-2 h-2 rounded-full" style={{ background: "#bfff00" }} />
                    )}
                  </div>
                )}
                {!m.available && (
                  <span className="text-[9px] font-bold text-white/30 border border-white/[0.10] px-1.5 py-0.5 rounded-full shrink-0">
                    {t("order_coming_soon")}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Delivery info */}
        <motion.form
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="bg-[#111] border border-white/[0.08] rounded-2xl p-4 space-y-4"
        >
          <h3 className="font-black text-white text-sm flex items-center gap-2">
            {t("order_delivery_title")}
          </h3>

          <div className="space-y-1.5">
            <label className="text-white/50 text-xs font-bold">{t("order_phone_label")}</label>
            <input
              required type="tel" dir="ltr"
              value={phone}
              onChange={e => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setPhoneTouched(true); }}
              onBlur={() => setPhoneTouched(true)}
              placeholder="07xxxxxxxx"
              className="w-full px-4 py-3.5 bg-white/[0.04] text-white font-bold text-lg text-center focus:outline-none transition-colors tracking-widest rounded-xl placeholder:text-white/20 border"
              style={{ borderColor: showPhoneError ? "#f87171" : "rgba(255,255,255,0.10)" }}
            />
            {showPhoneError
              ? <p className="text-red-400 text-[11px]">{t("order_phone_invalid")}</p>
              : <p className="text-white/25 text-[10px]">{t("order_phone_hint")}</p>
            }
          </div>

          <div className="space-y-1.5">
            <label className="text-white/50 text-xs font-bold">{t("order_city_label")}</label>
            <input
              required
              value={city} onChange={e => setCity(e.target.value)}
              placeholder={t("order_city_placeholder")}
              className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.10] text-white font-bold focus:outline-none focus:border-[#bfff00]/50 transition-colors rounded-xl placeholder:text-white/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-white/50 text-xs font-bold">المحافظة</label>
            <select
              required
              value={governorate}
              onChange={e => setGovernorate(e.target.value)}
              className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.10] text-white font-bold focus:outline-none focus:border-[#bfff00]/50 transition-colors rounded-xl appearance-none"
              style={{ colorScheme: "dark" }}
            >
              <option value="" disabled className="bg-[#111]">اختر محافظتك</option>
              {GOVERNORATES.map(g => (
                <option key={g} value={g} className="bg-[#111]">{g}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-white/50 text-xs font-bold">موقع السكن بالضبط</label>
            <textarea
              required
              value={address}
              onChange={e => setAddress(e.target.value.slice(0, 300))}
              placeholder="مثال: شارع الرينبو، بناية الياسمين، طابق 3، شقة 7..."
              rows={2}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.10] text-white font-medium focus:outline-none focus:border-[#bfff00]/50 transition-colors rounded-xl placeholder:text-white/20 resize-none text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-white/50 text-xs font-bold">ملاحظات (اختياري)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value.slice(0, 300))}
              placeholder="أي طلب خاص أو ملاحظة للتوصيل..."
              rows={3}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.10] text-white font-medium focus:outline-none focus:border-[#bfff00]/50 transition-colors rounded-xl placeholder:text-white/20 resize-none text-sm"
            />
            <div className="flex justify-end">
              <span className="text-[10px] text-white/20">{notes.length}/300</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={createOrder.isPending || !isValidPhone || !city || !governorate || !address.trim()}
            className="w-full py-4 font-black text-xl rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: (!isValidPhone || !city) ? "#1a1a1a" : "linear-gradient(135deg,#bfff00 0%,#7ecf00 100%)",
              color: (!isValidPhone || !city) ? "#444" : "#000",
              boxShadow: (isValidPhone && city) ? "0 0 30px rgba(191,255,0,0.25)" : "none",
            }}
          >
            {createOrder.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="inline-block">⟳</motion.span>
                {t("order_submitting")}
              </span>
            ) : t("order_submit")}
          </button>
        </motion.form>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="flex justify-around text-center py-2"
        >
          {[
            ["🔒", t("order_trust_secure")],
            ["🚚", t("order_trust_delivery")],
            ["✅", t("order_trust_quality")],
          ].map(([icon, label]) => (
            <div key={label}>
              <p className="text-lg">{icon}</p>
              <p className="text-white/30 text-[9px] font-bold">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
