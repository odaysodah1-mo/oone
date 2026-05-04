import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetTeam } from "@workspace/api-client-react";
import { getGetTeamQueryKey } from "@workspace/api-client-react";
import { useOrder } from "@/components/order-context";
import { ConfiguratorJersey, FONT_STYLES, type JerseyColors } from "@/components/configurator-jersey";

const BACK_JERSEY_URLS: Record<number, string> = {
  3: "/jerseys/jordan-back.png",
};

const PALETTE = [
  "#000000","#1a1a2e","#16213e","#ffffff","#f5f5f5","#cccccc",
  "#e63946","#c1121f","#ff6b6b","#023e8a","#0077b6","#00b4d8",
  "#2d6a4f","#40916c","#52b788","#ffd60a","#fca311","#e9c46a",
  "#6d6875","#b5838d","#6a4c93","#ff9f1c","#2ec4b6","#e71d36",
];

const SIZE_INFO: Record<string, string> = {
  XS: "< 160 سم", S: "160–170 سم", M: "170–178 سم",
  L: "178–186 سم", XL: "186–194 سم", XXL: "> 194 سم",
};

type Tab = "colors" | "name" | "size";

function ZonePicker({ label, value, onChange, palette }: {
  label: string; value: string; onChange: (c: string) => void; palette: string[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white/70">{label}</span>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border border-white/25" style={{ backgroundColor: value }} />
          <span className="text-[10px] text-white/40 font-mono uppercase">{value}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {palette.map((c) => (
          <button key={c} title={c} onClick={() => onChange(c)}
            className="w-7 h-7 rounded-full transition-all duration-150 hover:scale-110 active:scale-95"
            style={{
              backgroundColor: c,
              border: value === c ? "2.5px solid #bfff00" : "2px solid rgba(255,255,255,0.10)",
              boxShadow: value === c ? "0 0 10px rgba(191,255,0,0.65)" : "none",
              transform: value === c ? "scale(1.2)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function TeamDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data: team, isLoading } = useGetTeam(Number(id), {
    query: { enabled: !!id, queryKey: getGetTeamQueryKey(Number(id)) },
  });
  const { updateOrder } = useOrder();

  const [tab, setTab]     = useState<Tab>("colors");
  const [name, setName]   = useState("");
  const [number, setNumber] = useState("");
  const [size, setSize]   = useState("");
  const [fontId, setFontId] = useState("block");
  const [colors, setColors] = useState<JerseyColors>({
    body: "#cc0000", sleeves: "#ffffff", collar: "#cc0000", trim: "#ffffff",
  });

  useEffect(() => {
    if (team) {
      const primary   = team.availableColors[0] ?? team.primaryColor;
      const secondary = team.secondaryColor ?? "#ffffff";
      setColors({ body: primary, sleeves: secondary, collar: primary, trim: secondary });
    }
  }, [team]);

  const setZone = (zone: keyof JerseyColors) => (c: string) =>
    setColors((prev) => ({ ...prev, [zone]: c }));

  /* ── Flip-based drag (no rotateY box effect) ── */
  const [view, setView]           = useState<"front"|"back">("front");
  const [flipping, setFlipping]   = useState(false);
  const [scaleX, setScaleX]       = useState(1);
  const [tiltY, setTiltY]         = useState(0); // face-on by default
  const isDrag   = useRef(false);
  const lastX    = useRef(0);
  const accumX   = useRef(0);
  const isFront  = view === "front";

  const doFlip = useCallback((nextView: "front"|"back") => {
    if (flipping) return;
    setFlipping(true);
    setScaleX(0);
    setTimeout(() => {
      setView(nextView);
      setScaleX(1);
      setTimeout(() => setFlipping(false), 320);
    }, 280);
  }, [flipping]);

  const onPD = useCallback((e: React.PointerEvent) => {
    isDrag.current = true;
    lastX.current  = e.clientX;
    accumX.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPM = useCallback((e: React.PointerEvent) => {
    if (!isDrag.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    accumX.current += dx;
    // Subtle real-time tilt follows drag
    setTiltY(-8 + accumX.current * 0.06);
    // Flip when dragged far enough
    if (Math.abs(accumX.current) > 110) {
      const nextView = accumX.current < 0
        ? (view === "front" ? "back" : "front")
        : (view === "front" ? "back" : "front");
      doFlip(nextView);
      accumX.current = 0;
    }
  }, [view, doFlip]);

  const onPU = useCallback(() => {
    isDrag.current = false;
    setTiltY(-8); // spring back to neutral
    accumX.current = 0;
  }, []);

  const handleOrder = () => {
    if (!size) { alert("الرجاء اختيار المقاس"); return; }
    updateOrder({
      teamId: team!.id, teamName: team!.name, basePrice: team!.basePrice,
      color: colors.body, size: size as any,
      customerName: name || "BASMAH", jerseyNumber: number || "10",
      quantity: 1, previewColor: colors.body,
      previewName: name || "BASMAH", previewNumber: number || "10",
    });
    setLocation("/order");
  };

  const hasPhoto = !!team?.logoUrl;
  const backPhoto = id ? BACK_JERSEY_URLS[Number(id)] : undefined;

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "colors", icon: "🎨", label: "الألوان" },
    { id: "name",   icon: "✏️",  label: "الاسم"  },
    { id: "size",   icon: "📐",  label: "المقاس" },
  ];

  if (isLoading) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-[#bfff00] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/50 font-bold">جاري التحميل…</p>
      </div>
    </div>
  );

  if (!team) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-black text-white">الفريق غير موجود</h2>
        <button onClick={() => setLocation("/teams")} className="px-6 py-3 bg-[#bfff00] text-black font-black">العودة</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-black">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 shrink-0 z-20 border-b border-white/[0.06] bg-black/80 backdrop-blur-sm">
        <button onClick={() => setLocation("/teams")}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors font-bold">
          <span className="text-base">←</span> الفرق
        </button>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-white/40 mb-0.5">
            <span className="bg-[#bfff00]/20 text-[#bfff00] px-2 py-0.5 rounded text-[10px] font-black">{team.league}</span>
            <span>·</span><span>{team.country}</span>
          </div>
          <h1 className="text-sm md:text-lg font-black text-white leading-tight">{team.name}</h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-white/30">السعر</div>
          <div className="text-xl font-black text-[#bfff00]">{team.basePrice}<span className="text-xs text-white/50 mr-1">د.أ</span></div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT PANEL (desktop) ── */}
        <motion.div
          initial={{ x: -340, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="w-[300px] md:w-[320px] shrink-0 hidden md:flex flex-col bg-[#0a0a0a] border-r border-white/[0.06] z-10 overflow-hidden"
        >
          {/* Tabs */}
          <div className="flex border-b border-white/[0.07]">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center py-3.5 gap-0.5 text-xs font-black transition-all duration-200 ${
                  tab === t.id ? "text-[#bfff00] border-b-2 border-[#bfff00] bg-[#bfff00]/5" : "text-white/30 hover:text-white/70"
                }`}>
                <span className="text-base">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
            <AnimatePresence mode="wait">
              {tab === "colors" && (
                <motion.div key="c" initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} className="space-y-6">
                  {!hasPhoto ? (
                    <>
                      <ZonePicker label="لون الجسم"        value={colors.body}    onChange={setZone("body")}    palette={PALETTE} />
                      <div className="h-px bg-white/[0.06]" />
                      <ZonePicker label="لون الأكمام"      value={colors.sleeves} onChange={setZone("sleeves")} palette={PALETTE} />
                      <div className="h-px bg-white/[0.06]" />
                      <ZonePicker label="لون الطوق"        value={colors.collar}  onChange={setZone("collar")}  palette={PALETTE} />
                      <div className="h-px bg-white/[0.06]" />
                      <ZonePicker label="الاسم والرقم"     value={colors.trim}    onChange={setZone("trim")}    palette={PALETTE} />
                    </>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-white/35 leading-relaxed">هذا القميص بتصميم رسمي — يمكنك تخصيص الاسم والرقم.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {tab === "name" && (
                <motion.div key="n" initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/50 uppercase tracking-widest block">الاسم</label>
                    <input value={name} onChange={(e) => setName(e.target.value.toUpperCase())} placeholder="AHMED" maxLength={12}
                      className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.10] text-white placeholder:text-white/20 font-black text-lg focus:outline-none focus:border-[#bfff00]/50 transition-colors" />
                    <div className="flex justify-between text-[10px] text-white/25">
                      <span>باللغة الإنجليزية</span><span>{name.length}/12</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/50 uppercase tracking-widest block">الرقم</label>
                    <input value={number} onChange={(e) => setNumber(e.target.value.replace(/[^0-9]/g,"").slice(0,2))} placeholder="10" maxLength={2}
                      className="w-full px-4 py-4 bg-white/[0.04] border border-white/[0.10] text-white placeholder:text-white/20 font-black text-5xl text-center focus:outline-none focus:border-[#bfff00]/50 transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/50 uppercase tracking-widest block">نمط الخط</label>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_STYLES.map((f) => (
                        <button key={f.id} onClick={() => setFontId(f.id)}
                          className="px-3 py-3 border text-sm font-bold transition-all duration-200"
                          style={{
                            fontFamily: f.family,
                            fontStyle: (f.style as Record<string,string>).fontStyle ?? "normal",
                            letterSpacing: (f.style as Record<string,string>).letterSpacing ?? "normal",
                            borderColor: fontId === f.id ? "#bfff00" : "rgba(255,255,255,0.08)",
                            background:  fontId === f.id ? "rgba(191,255,0,0.10)" : "rgba(255,255,255,0.02)",
                            color:       fontId === f.id ? "#bfff00" : "rgba(255,255,255,0.35)",
                          }}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {tab === "size" && (
                <motion.div key="s" initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} className="space-y-2">
                  <p className="text-xs text-white/30 mb-4">اختر المقاس المناسب لطولك</p>
                  {team.availableSizes.map((s) => (
                    <button key={s} onClick={() => setSize(s)}
                      className="w-full flex items-center justify-between px-4 py-3.5 border transition-all duration-200 group"
                      style={{
                        borderColor: size === s ? "#bfff00" : "rgba(255,255,255,0.07)",
                        background:  size === s ? "rgba(191,255,0,0.08)" : "rgba(255,255,255,0.02)",
                      }}>
                      <span className={`text-2xl font-black transition-colors ${size === s ? "text-[#bfff00]" : "text-white/50 group-hover:text-white/80"}`}>{s}</span>
                      <span className="text-xs text-white/30">{SIZE_INFO[s] ?? ""}</span>
                      {size === s && <span className="text-[#bfff00] text-lg font-black">✓</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA */}
          <div className="p-4 border-t border-white/[0.06] shrink-0 bg-black/60">
            {!size && <p className="text-[10px] text-center text-amber-400/70 mb-2">⚠ اختر المقاس من تبويب 📐</p>}
            <button onClick={handleOrder} disabled={!size}
              className="w-full py-4 text-lg font-black transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: size ? "linear-gradient(135deg,#bfff00 0%,#7ecf00 100%)" : "#1a1a1a",
                color: size ? "#000" : "#444",
                boxShadow: size ? "0 0 30px rgba(191,255,0,0.30), 0 4px 16px rgba(0,0,0,0.5)" : "none",
              }}>
              {size ? "🛒 إتمام الطلب" : "اختر المقاس أولاً"}
            </button>
          </div>
        </motion.div>

        {/* ── CENTER STAGE ── */}
        <div
          className="flex-1 flex flex-col items-center justify-center relative overflow-hidden min-w-0 select-none"
          style={{ cursor: flipping ? "default" : "ew-resize" }}
          onPointerDown={onPD} onPointerMove={onPM} onPointerUp={onPU} onPointerLeave={onPU}
        >
          {/* Spotlight glow (color-matched) */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(ellipse 65% 60% at 50% 45%, ${colors.body}22 0%, transparent 68%)`,
            transition: "background 0.8s ease",
          }} />
          {/* Subtle floor bounce light */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none" style={{
            background: `radial-gradient(ellipse 70% 40% at 50% 100%, ${colors.body}10 0%, transparent 70%)`,
          }} />

          {/* ── The Jersey (fixed tilt + scaleX flip) ── */}
          <div style={{
            width:  hasPhoto ? "min(360px,68vw)" : "min(420px,78vw)",
            height: hasPhoto ? "min(470px,68vh)" : "min(510px,72vh)",
            transform: tiltY !== 0 ? `perspective(900px) rotateX(2deg) rotateY(${tiltY}deg)` : "none",
            transition: flipping ? "none" : "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            {/* scaleX flip wrapper */}
            <div style={{
              width:"100%", height:"100%",
              transform: `scaleX(${scaleX})`,
              transition: `transform ${flipping ? "0.28s" : "0s"} cubic-bezier(0.4,0,0.6,1)`,
              filter: "drop-shadow(0 28px 52px rgba(0,0,0,0.82))",
            }}>
              {hasPhoto ? (
                <img
                  src={view === "back" && backPhoto ? backPhoto : team.logoUrl!}
                  alt={view}
                  style={{ width:"100%", height:"100%", objectFit:"contain", objectPosition:"center top" }}
                />
              ) : (
                <ConfiguratorJersey
                  colors={colors}
                  name={name || "BASMAH"}
                  number={number || "10"}
                  view={view}
                  fontId={fontId}
                />
              )}
            </div>
          </div>

          {/* Ground shadow */}
          <div style={{
            width:"min(300px,58vw)", height:"14px", marginTop:"4px",
            background:"radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, transparent 72%)",
            pointerEvents:"none", flexShrink:0,
          }} />

          {/* Drag hint */}
          <p className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-white/18 pointer-events-none select-none tracking-widest">
            اسحب لتدوير القميص ↔
          </p>

          {/* Face indicator pill */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/[0.05] px-2.5 py-1 rounded-full border border-white/[0.08]">
            <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-400 ${isFront ? "bg-[#bfff00]" : "bg-white/40"}`} />
            <span className="text-[10px] text-white/30 font-bold">{isFront ? "الأمام" : "الخلف"}</span>
          </div>
        </div>
      </div>

      {/* ── MOBILE BOTTOM ── */}
      <div className="md:hidden border-t border-white/[0.06] bg-black shrink-0 z-20">
        <div className="flex border-b border-white/[0.06]">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-black transition-all ${
                tab === t.id ? "text-[#bfff00] border-t-2 border-[#bfff00]" : "text-white/30"
              }`}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
        <div className="max-h-40 overflow-y-auto p-3">
          <AnimatePresence mode="wait">
            {tab === "colors" && !hasPhoto && (
              <motion.div key="mc" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-3">
                <ZonePicker label="الجسم"   value={colors.body}    onChange={setZone("body")}    palette={PALETTE} />
                <ZonePicker label="الأكمام" value={colors.sleeves} onChange={setZone("sleeves")} palette={PALETTE} />
              </motion.div>
            )}
            {tab === "name" && (
              <motion.div key="mn" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex gap-2">
                <input value={name} onChange={(e) => setName(e.target.value.toUpperCase())} placeholder="الاسم" maxLength={12}
                  className="flex-1 px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] text-white text-sm font-black focus:outline-none focus:border-[#bfff00]/40" />
                <input value={number} onChange={(e) => setNumber(e.target.value.replace(/[^0-9]/g,"").slice(0,2))} placeholder="10" maxLength={2}
                  className="w-20 px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] text-white text-2xl font-black text-center focus:outline-none focus:border-[#bfff00]/40" />
              </motion.div>
            )}
            {tab === "size" && (
              <motion.div key="ms" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-wrap gap-2">
                {team.availableSizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)}
                    className="px-4 py-2 text-sm font-black border transition-all"
                    style={{
                      borderColor: size === s ? "#bfff00" : "rgba(255,255,255,0.10)",
                      background:  size === s ? "rgba(191,255,0,0.12)" : "transparent",
                      color:       size === s ? "#bfff00" : "rgba(255,255,255,0.4)",
                    }}>{s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="px-4 pb-4 pt-2">
          <button onClick={handleOrder} disabled={!size}
            className="w-full py-3.5 text-base font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: size ? "linear-gradient(135deg,#bfff00,#7ecf00)" : "#111",
              color: size ? "#000" : "#444",
              boxShadow: size ? "0 0 24px rgba(191,255,0,0.28)" : "none",
            }}>
            {size ? `🛒 إتمام الطلب — ${team.basePrice} د.أ` : "اختر المقاس أولاً"}
          </button>
        </div>
      </div>
    </div>
  );
}
