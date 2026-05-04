import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetTeam } from "@workspace/api-client-react";
import { getGetTeamQueryKey } from "@workspace/api-client-react";
import { useOrder } from "@/components/order-context";
import { ConfiguratorJersey, FONT_STYLES, type JerseyColors } from "@/components/configurator-jersey";

// Map of team IDs to their back jersey image URL
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
  XS: "< 160 سم",
  S: "160–170 سم",
  M: "170–178 سم",
  L: "178–186 سم",
  XL: "186–194 سم",
  XXL: "> 194 سم",
};

type Tab = "colors" | "name" | "size";

// ---------- Zone color picker row ----------
function ZonePicker({ label, value, onChange, palette }: {
  label: string; value: string; onChange: (c: string) => void; palette: string[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground/80">{label}</span>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: value }} />
          <span className="text-xs text-muted-foreground font-mono uppercase">{value}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {palette.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => onChange(c)}
            className="w-7 h-7 rounded-full transition-all duration-150 hover:scale-110"
            style={{
              backgroundColor: c,
              border: value === c ? "2.5px solid #bfff00" : "2px solid rgba(255,255,255,0.12)",
              boxShadow: value === c ? "0 0 8px rgba(191,255,0,0.6)" : "none",
              transform: value === c ? "scale(1.18)" : "scale(1)",
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

  const [tab, setTab] = useState<Tab>("colors");
  const [view, setView] = useState<"front" | "back">("front");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [size, setSize] = useState("");
  const [fontId, setFontId] = useState("block");
  const [colors, setColors] = useState<JerseyColors>({
    body: "#cc0000",
    sleeves: "#ffffff",
    collar: "#cc0000",
    trim: "#ffffff",
  });

  // init colors from team
  useEffect(() => {
    if (team) {
      const primary = team.availableColors[0] ?? team.primaryColor;
      const secondary = team.secondaryColor ?? "#ffffff";
      setColors({
        body: primary,
        sleeves: secondary,
        collar: primary,
        trim: secondary,
      });
    }
  }, [team]);

  const setZone = (zone: keyof JerseyColors) => (c: string) =>
    setColors((prev) => ({ ...prev, [zone]: c }));

  // 3D drag rotation (for photo jerseys)
  const rotY = useRef(-15);
  const [rotYState, setRotYState] = useState(-15);
  const dragRef = useRef(false);
  const lastX = useRef(0);
  const velRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      if (!dragRef.current && Math.abs(velRef.current) > 0.05) {
        velRef.current *= 0.93;
        rotY.current += velRef.current;
        setRotYState(rotY.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const onPD = (e: React.PointerEvent) => {
    dragRef.current = true;
    lastX.current = e.clientX;
    velRef.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPM = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    velRef.current = dx * 0.55;
    rotY.current += dx * 0.55;
    setRotYState(rotY.current);
  };
  const onPU = () => { dragRef.current = false; };

  const handleOrder = () => {
    if (!size) { alert("الرجاء اختيار المقاس"); return; }
    updateOrder({
      teamId: team!.id,
      teamName: team!.name,
      basePrice: team!.basePrice,
      color: colors.body,
      size: size as any,
      customerName: name || "BASMAH",
      jerseyNumber: number || "10",
      quantity: 1,
      previewColor: colors.body,
      previewName: name || "BASMAH",
      previewNumber: number || "10",
    });
    setLocation("/order");
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-bold">جاري التحميل…</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-black">الفريق غير موجود</h2>
          <button onClick={() => setLocation("/teams")} className="px-6 py-3 bg-primary text-black font-bold">العودة</button>
        </div>
      </div>
    );
  }

  const hasPhoto = !!team.logoUrl;
  const backPhoto = id ? BACK_JERSEY_URLS[Number(id)] : undefined;

  // Lighting for photo 3D mode
  const rad = (rotYState * Math.PI) / 180;
  const brightness = 0.55 + Math.abs(Math.cos(rad)) * 0.45;

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "colors", icon: "🎨", label: "الألوان" },
    { id: "name",   icon: "✏️",  label: "الاسم" },
    { id: "size",   icon: "📐",  label: "المقاس" },
  ];

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: "linear-gradient(135deg,#0a0a0a 0%,#0f1a0f 100%)" }}>

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/8 shrink-0 z-20 bg-black/40 backdrop-blur-sm">
        <button
          onClick={() => setLocation("/teams")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-bold"
        >
          <span className="text-lg">←</span> الفرق
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded font-bold">{team.league}</span>
            <span className="text-border">·</span>
            <span>{team.country}</span>
          </div>
          <h1 className="text-base md:text-xl font-black leading-tight">{team.name}</h1>
        </div>

        <div className="text-left">
          <div className="text-xs text-muted-foreground">السعر</div>
          <div className="text-xl font-black text-primary">{team.basePrice} <span className="text-sm text-foreground/70">د.أ</span></div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT PANEL ── */}
        <motion.div
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-[300px] md:w-[320px] shrink-0 flex flex-col bg-black/60 backdrop-blur border-r border-white/8 z-10 overflow-hidden hidden md:flex"
        >
          {/* Tabs */}
          <div className="flex border-b border-white/8">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-bold transition-all duration-200 ${
                  tab === t.id
                    ? "text-primary border-b-2 border-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-base">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <AnimatePresence mode="wait">
              {tab === "colors" && (
                <motion.div
                  key="colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {!hasPhoto && (
                    <>
                      <ZonePicker label="لون الجسم" value={colors.body} onChange={setZone("body")} palette={PALETTE} />
                      <div className="h-px bg-white/8" />
                      <ZonePicker label="لون الأكمام" value={colors.sleeves} onChange={setZone("sleeves")} palette={PALETTE} />
                      <div className="h-px bg-white/8" />
                      <ZonePicker label="لون الطوق" value={colors.collar} onChange={setZone("collar")} palette={PALETTE} />
                      <div className="h-px bg-white/8" />
                      <ZonePicker label="لون الاسم والرقم" value={colors.trim} onChange={setZone("trim")} palette={PALETTE} />
                    </>
                  )}
                  {hasPhoto && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        هذا القميص بتصميم رسمي ثابت. يمكنك تخصيص الاسم والرقم فقط.
                      </p>
                      <div className="flex flex-col gap-2">
                        {team.availableColors.map((c) => (
                          <button
                            key={c}
                            onClick={() => setColors((p) => ({ ...p, body: c }))}
                            className="flex items-center gap-3 px-3 py-2 rounded border transition-all"
                            style={{
                              borderColor: colors.body === c ? "#bfff00" : "rgba(255,255,255,0.1)",
                              background: colors.body === c ? "rgba(191,255,0,0.08)" : "transparent",
                            }}
                          >
                            <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                            <span className="text-xs font-mono text-muted-foreground">{c}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {tab === "name" && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/80 block">الاسم على القميص</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value.toUpperCase())}
                      placeholder="مثال: AHMED"
                      maxLength={12}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 text-foreground placeholder:text-muted-foreground/50 font-bold text-base focus:outline-none focus:border-primary/60 transition-colors"
                    />
                    <p className="text-xs text-muted-foreground">{name.length}/12 حرف</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/80 block">الرقم</label>
                    <input
                      value={number}
                      onChange={(e) => setNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
                      placeholder="مثال: 10"
                      maxLength={2}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 text-foreground placeholder:text-muted-foreground/50 font-bold text-4xl text-center focus:outline-none focus:border-primary/60 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/80 block">نمط الخط</label>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_STYLES.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFontId(f.id)}
                          className="px-3 py-3 border text-sm transition-all"
                          style={{
                            fontFamily: f.family,
                            fontStyle: (f.style as any).fontStyle ?? "normal",
                            letterSpacing: (f.style as any).letterSpacing ?? "normal",
                            borderColor: fontId === f.id ? "#bfff00" : "rgba(255,255,255,0.12)",
                            background: fontId === f.id ? "rgba(191,255,0,0.1)" : "rgba(255,255,255,0.03)",
                            color: fontId === f.id ? "#bfff00" : "#888",
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {tab === "size" && (
                <motion.div
                  key="size"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <p className="text-xs text-muted-foreground mb-2">اختر المقاس المناسب لطولك</p>
                  {team.availableSizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className="w-full flex items-center justify-between px-4 py-3 border transition-all"
                      style={{
                        borderColor: size === s ? "#bfff00" : "rgba(255,255,255,0.1)",
                        background: size === s ? "rgba(191,255,0,0.1)" : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <span className={`text-xl font-black ${size === s ? "text-primary" : "text-foreground"}`}>{s}</span>
                      <span className="text-xs text-muted-foreground">{SIZE_INFO[s] ?? ""}</span>
                      {size === s && <span className="text-primary text-lg">✓</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA */}
          <div className="p-4 border-t border-white/8 shrink-0">
            {!size && (
              <p className="text-xs text-center text-amber-400 mb-2">⚠ اختر المقاس من تبويب 📐</p>
            )}
            <button
              onClick={handleOrder}
              disabled={!size}
              className="w-full py-4 text-lg font-black transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: size ? "linear-gradient(135deg,#bfff00,#86c800)" : "#333",
                color: size ? "#000" : "#888",
                boxShadow: size ? "0 0 24px rgba(191,255,0,0.35)" : "none",
              }}
            >
              {size ? "🛒 إتمام الطلب" : "اختر المقاس أولاً"}
            </button>
          </div>
        </motion.div>

        {/* ── CENTER: JERSEY STAGE ── */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden min-w-0">

          {/* Spotlight glow behind jersey */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 55% 60% at 50% 48%, ${colors.body}28 0%, transparent 72%)`,
              transition: "background 0.6s ease",
            }}
          />

          {/* View toggle */}
          <div className="flex gap-1 mb-4 md:mb-6 z-10 bg-white/5 rounded p-1 border border-white/10">
            {(["front", "back"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-5 py-2 text-sm font-bold transition-all duration-200 rounded"
                style={{
                  background: view === v ? "rgba(191,255,0,0.18)" : "transparent",
                  color: view === v ? "#bfff00" : "#666",
                  borderBottom: view === v ? "2px solid #bfff00" : "2px solid transparent",
                }}
              >
                {v === "front" ? "⬛ قدام" : "⬜ ورا"}
              </button>
            ))}
          </div>

          {/* Jersey */}
          <div
            className="relative z-10"
            style={{ width: "min(420px, 80vw)", height: "min(520px, 74vh)" }}
          >
            <AnimatePresence mode="wait">
              {hasPhoto ? (
                /* PHOTO MODE: 3D flip with real images */
                <motion.div
                  key={view}
                  initial={{ rotateY: view === "front" ? -90 : 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: view === "front" ? 90 : -90, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="w-full h-full"
                  style={{ perspective: "900px" }}
                  onPointerDown={onPD}
                  onPointerMove={onPM}
                  onPointerUp={onPU}
                  onPointerLeave={onPU}
                >
                  <div
                    className="w-full h-full"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: `rotateX(3deg) rotateY(${rotYState}deg)`,
                      cursor: dragRef.current ? "grabbing" : "ew-resize",
                    }}
                  >
                    {/* Front face */}
                    <div
                      className="absolute inset-0"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        filter: `brightness(${brightness})`,
                        transform: "translateZ(14px)",
                      }}
                    >
                      <img
                        src={team.logoUrl!}
                        alt="front"
                        style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center top", filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.7))" }}
                      />
                    </div>
                    {/* Back face */}
                    <div
                      className="absolute inset-0"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        filter: `brightness(${brightness})`,
                        transform: "rotateY(180deg) translateZ(14px)",
                      }}
                    >
                      {backPhoto ? (
                        <img src={backPhoto} alt="back" style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center top", filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.7))" }} />
                      ) : (
                        <div style={{ transform: "scaleX(-1)", width: "100%", height: "100%" }}>
                          <img src={team.logoUrl!} alt="back" style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center top" }} />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* SVG CONFIGURATOR MODE: live color updates */
                <motion.div
                  key={`svg-${view}`}
                  initial={{ rotateY: view === "front" ? -90 : 90, opacity: 0, scale: 0.97 }}
                  animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                  exit={{ rotateY: view === "front" ? 90 : -90, opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="w-full h-full"
                >
                  <ConfiguratorJersey
                    colors={colors}
                    name={name || "BASMAH"}
                    number={number || "10"}
                    view={view}
                    fontId={fontId}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Ground shadow */}
          <div style={{
            width: "min(260px, 55vw)", height: "18px", marginTop: "2px",
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 72%)",
            pointerEvents: "none",
            flexShrink: 0,
          }} />

          {/* Drag hint for photo mode */}
          {hasPhoto && (
            <p className="text-xs text-muted-foreground/50 mt-2 select-none pointer-events-none">
              ← اسحب لتدوير القميص →
            </p>
          )}
        </div>
      </div>

      {/* ── MOBILE BOTTOM BAR ── */}
      <div className="md:hidden border-t border-white/8 bg-black/70 backdrop-blur shrink-0 z-20">
        {/* Mobile tabs */}
        <div className="flex border-b border-white/8">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-bold transition-all ${
                tab === t.id ? "text-primary border-t-2 border-primary" : "text-muted-foreground"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Mobile tab content */}
        <div className="max-h-48 overflow-y-auto p-3">
          <AnimatePresence mode="wait">
            {tab === "colors" && !hasPhoto && (
              <motion.div key="mcolors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                <ZonePicker label="لون الجسم" value={colors.body} onChange={setZone("body")} palette={PALETTE} />
                <ZonePicker label="لون الأكمام" value={colors.sleeves} onChange={setZone("sleeves")} palette={PALETTE} />
              </motion.div>
            )}
            {tab === "name" && (
              <motion.div key="mname" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  placeholder="الاسم"
                  maxLength={12}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/15 text-foreground text-sm font-bold focus:outline-none focus:border-primary/60"
                />
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
                  placeholder="رقم"
                  maxLength={2}
                  className="w-20 px-3 py-2 bg-white/5 border border-white/15 text-foreground text-xl font-black text-center focus:outline-none focus:border-primary/60"
                />
              </motion.div>
            )}
            {tab === "size" && (
              <motion.div key="msize" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap gap-2">
                {team.availableSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className="px-4 py-2 text-sm font-black border transition-all"
                    style={{
                      borderColor: size === s ? "#bfff00" : "rgba(255,255,255,0.15)",
                      background: size === s ? "rgba(191,255,0,0.15)" : "transparent",
                      color: size === s ? "#bfff00" : "#888",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile CTA */}
        <div className="px-4 pb-4 pt-2">
          <button
            onClick={handleOrder}
            disabled={!size}
            className="w-full py-3.5 text-base font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: size ? "linear-gradient(135deg,#bfff00,#86c800)" : "#333",
              color: size ? "#000" : "#888",
              boxShadow: size ? "0 0 20px rgba(191,255,0,0.3)" : "none",
            }}
          >
            {size ? `🛒 إتمام الطلب — ${team.basePrice} د.أ` : "اختر المقاس أولاً"}
          </button>
        </div>
      </div>
    </div>
  );
}
