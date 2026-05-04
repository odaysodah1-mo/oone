import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetTeam } from "@workspace/api-client-react";
import { getGetTeamQueryKey } from "@workspace/api-client-react";
import { useOrder } from "@/components/order-context";
import { FONT_STYLES, type JerseyColors } from "@/components/configurator-jersey";
import { ShirtStickerStage, type ShirtStickerStageHandle } from "@/components/shirt-sticker-stage";
import {
  STICKER_LIBRARY,
  getStickerCanvas,
  type StickerDef,
} from "@/components/sticker-library";

/* ─── Types ──────────────────────────────────────────────── */
interface JerseyColor {
  id: number; teamId: number; name: string;
  frontImageUrl: string; backImageUrl: string | null; isSoldOut?: boolean;
  hexCode: string; secondaryHexCode: string;
  isDefault: boolean; sortOrder: number;
}

/* ─── Palette ─────────────────────────────────────────────── */
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

const STICKER_CATS = Array.from(new Set(STICKER_LIBRARY.map(s => s.category)));

type CustomTab = "colors" | "name" | "size";
type MobileTab = "stickers" | "colors" | "name" | "size";

/* ─── ZonePicker ─────────────────────────────────────────── */
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
        {palette.map(c => (
          <button key={c} title={c} onClick={() => onChange(c)}
            className="w-7 h-7 rounded-full transition-all duration-150 hover:scale-110 active:scale-95"
            style={{
              backgroundColor: c,
              border:    value === c ? "2.5px solid #bfff00" : "2px solid rgba(255,255,255,0.10)",
              boxShadow: value === c ? "0 0 10px rgba(191,255,0,0.65)" : "none",
              transform: value === c ? "scale(1.2)" : "scale(1)",
            }} />
        ))}
      </div>
    </div>
  );
}

/* ─── StickerBtn ─────────────────────────────────────────── */
function StickerBtn({ s, selected, onClick }: {
  s: StickerDef; selected: boolean; onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const img = getStickerCanvas(s);
    if (!img || !canvasRef.current) return;
    const c = canvasRef.current;
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0);
  }, [s]);
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all duration-150 active:scale-90"
      style={{
        background: selected ? "rgba(191,255,0,0.14)" : "rgba(255,255,255,0.03)",
        border:     selected ? "1.5px solid #bfff00"  : "1.5px solid rgba(255,255,255,0.06)",
        boxShadow:  selected ? "0 0 12px rgba(191,255,0,0.35)" : "none",
      }}>
      <canvas ref={canvasRef} width={80} height={80} className="w-10 h-10" />
      <span className="text-[9px] text-white/45 font-bold truncate max-w-[44px] text-center leading-tight">
        {s.label}
      </span>
    </button>
  );
}

/* ─── Jersey Color Picker strip ─────────────────────────── */
function JerseyColorPicker({ colors, selected, onSelect, view, onToggleView }: {
  colors: JerseyColor[];
  selected: JerseyColor | null;
  onSelect: (c: JerseyColor) => void;
  view: "front" | "back";
  onToggleView: () => void;
}) {
  if (colors.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {/* View toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-white/50 uppercase tracking-widest">الكلر</span>
        <button onClick={onToggleView}
          className="flex items-center gap-1.5 bg-white/[0.07] border border-white/[0.10] text-white/60 hover:text-[#bfff00] hover:border-[#bfff00]/40 text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all">
          <span>↔</span>
          {view === "front" ? "رؤية الخلف" : "رؤية الأمام"}
        </button>
      </div>
      {/* Color cards */}
      <div className="flex flex-wrap gap-2">
        {colors.map(c => (
          <button key={c.id}
            onClick={() => !c.isSoldOut && onSelect(c)}
            disabled={!!c.isSoldOut}
            className="relative flex-shrink-0 rounded-xl overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              width: 52, height: 62,
              border: selected?.id === c.id ? "2px solid #bfff00" : "2px solid rgba(255,255,255,0.08)",
              boxShadow: selected?.id === c.id ? "0 0 14px rgba(191,255,0,0.45)" : "none",
              background: "rgba(255,255,255,0.04)",
            }}>
            <img src={view === "front" ? c.frontImageUrl : (c.backImageUrl ?? c.frontImageUrl)}
              alt={c.name}
              style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center top" }}
              onError={e => {
                (e.target as HTMLImageElement).style.display = "none";
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent) parent.style.backgroundColor = c.hexCode;
              }} />
            {/* Sold Out overlay */}
            {c.isSoldOut && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                <span className="text-[7px] font-black text-white bg-red-600 px-1 py-0.5 rounded rotate-[-10deg] leading-none tracking-wide">SOLD OUT</span>
              </div>
            )}
            {selected?.id === c.id && (
              <div className="absolute bottom-0 inset-x-0 bg-[#bfff00]/90 text-black text-[8px] font-black text-center py-0.5 truncate px-1">
                {c.name}
              </div>
            )}
          </button>
        ))}
      </div>
      {selected && (
        <div className="flex items-center gap-2 mt-1">
          <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: selected.hexCode }} />
          <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: selected.secondaryHexCode }} />
          <span className="text-[10px] text-white/40 font-bold">{selected.name}</span>
          {!selected.backImageUrl && (
            <span className="text-[9px] text-amber-400/60">(بدون صورة خلف)</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────── */
export default function TeamDetail() {
  const { id }          = useParams();
  const [, setLocation] = useLocation();
  const { data: team, isLoading } = useGetTeam(Number(id), {
    query: { enabled: !!id, queryKey: getGetTeamQueryKey(Number(id)) },
  });
  const { updateOrder } = useOrder();

  /* jersey colors from API */
  const [jerseyColors, setJerseyColors] = useState<JerseyColor[]>([]);
  const [selectedColor, setSelectedColor] = useState<JerseyColor | null>(null);
  const [view, setView] = useState<"front" | "back">("front");

  /* customization */
  const [tab, setTab]       = useState<CustomTab>("colors");
  const [name, setName]     = useState("");
  const [number, setNumber] = useState("");
  const [size, setSize]     = useState("");
  const [fontId, setFontId] = useState("block");
  const [colors, setColors] = useState<JerseyColors>({
    body: "#cc0000", sleeves: "#ffffff", collar: "#cc0000", trim: "#ffffff",
  });

  /* stickers */
  const [stickerCat, setStickerCat]         = useState(STICKER_CATS[0]);
  const [pendingSticker, setPendingSticker] = useState<StickerDef | null>(null);
  const [placedCount, setPlacedCount]       = useState(0);
  const [nahfaText, setNahfaText]           = useState("");

  /* stage ref for snapshot capture */
  const stageRef = useRef<ShirtStickerStageHandle>(null);

  /* mobile */
  const [mobileTab, setMobileTab] = useState<MobileTab>("stickers");

  /* Load jersey colors */
  useEffect(() => {
    if (!id) return;
    fetch(`/api/teams/${id}/jersey-colors`)
      .then(r => r.ok ? r.json() : [])
      .then((cols: JerseyColor[]) => {
        setJerseyColors(cols);
        const def = cols.find(c => c.isDefault) ?? cols[0] ?? null;
        setSelectedColor(def);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (team) {
      const primary   = team.availableColors[0] ?? team.primaryColor;
      const secondary = team.secondaryColor ?? "#ffffff";
      setColors({ body: primary, sleeves: secondary, collar: primary, trim: secondary });
    }
  }, [team]);

  /* when selected jersey color changes, sync SVG colors */
  useEffect(() => {
    if (selectedColor) {
      setColors(prev => ({ ...prev, body: selectedColor.hexCode, sleeves: selectedColor.secondaryHexCode, trim: selectedColor.secondaryHexCode }));
    }
  }, [selectedColor]);

  const setZone = (zone: keyof JerseyColors) => (c: string) =>
    setColors(prev => ({ ...prev, [zone]: c }));

  const handleOrder = async () => {
    if (!size) { alert("الرجاء اختيار المقاس"); return; }

    let capturedFront: string | undefined = selectedColor?.frontImageUrl ?? undefined;
    let capturedBack:  string | undefined = selectedColor?.backImageUrl  ?? undefined;

    // If there's a photo jersey, capture the customized design (stickers + overlays)
    if (stageRef.current && selectedColor?.frontImageUrl) {
      try {
        const { front, back } = await stageRef.current.captureSnapshot();

        const uploadDataUrl = async (dataUrl: string, label: string): Promise<string | undefined> => {
          const blob = await fetch(dataUrl).then(r => r.blob());
          const file = new File([blob], `design-${label}-${Date.now()}.jpg`, { type: "image/jpeg" });

          // Step 1: Request presigned URL
          const reqRes = await fetch("/api/storage/uploads/request-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
          });
          if (!reqRes.ok) return undefined;
          const { uploadURL, objectPath } = await reqRes.json() as { uploadURL: string; objectPath: string };

          // Step 2: Upload to presigned URL
          const uploadRes = await fetch(uploadURL, {
            method: "PUT", body: file,
            headers: { "Content-Type": file.type },
          });
          if (!uploadRes.ok) return undefined;
          return `/api/storage${objectPath}`;
        };

        const [uploadedFront, uploadedBack] = await Promise.all([
          front ? uploadDataUrl(front, "front") : Promise.resolve(undefined),
          back  ? uploadDataUrl(back,  "back")  : Promise.resolve(undefined),
        ]);
        if (uploadedFront) capturedFront = uploadedFront;
        if (uploadedBack)  capturedBack  = uploadedBack;
      } catch {
        // Fallback to raw jersey photos on error
      }
    }

    updateOrder({
      teamId: team!.id, teamName: team!.name, basePrice: team!.basePrice,
      color: colors.body, size: size as "XS" | "S" | "M" | "L" | "XL" | "XXL",
      customerName: name || "BASMAH", jerseyNumber: number || "10",
      quantity: 1, previewColor: colors.body,
      previewName: name || "BASMAH", previewNumber: number || "10",
      playerName: name || undefined,
      frontImageUrl: capturedFront,
      backImageUrl:  capturedBack,
      jerseyColorName: selectedColor?.name ?? undefined,
    });
    setLocation("/order");
  };

  const selectSticker = useCallback((s: StickerDef) => {
    setPendingSticker(prev => prev?.id === s.id ? null : s);
  }, []);

  const addNahfa = useCallback(() => {
    const txt = nahfaText.trim();
    if (!txt) return;
    const def: StickerDef = {
      id: `nahfa-${Date.now()}`, label: txt, category: "عربي",
      text: txt, textColor: "#bfff00", isArabic: /[\u0600-\u06FF]/.test(txt),
    };
    setPendingSticker(def);
    setNahfaText("");
  }, [nahfaText]);

  const filteredStickers = STICKER_LIBRARY.filter(s => s.category === stickerCat);

  const hasPhoto  = !!selectedColor?.frontImageUrl;
  const photoFront = selectedColor?.frontImageUrl;
  const photoBack  = selectedColor?.backImageUrl ?? undefined;

  const customTabs: { id: CustomTab; icon: string; label: string }[] = [
    { id: "colors", icon: "🎨", label: "الألوان" },
    { id: "name",   icon: "✏️",  label: "الاسم"  },
    { id: "size",   icon: "📐",  label: "المقاس" },
  ];

  /* ── Loading / 404 ──────────────────────────────────────── */
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

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-black" dir="rtl">
      {/* ══ TOP BAR ══ */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 shrink-0 z-20
                      border-b border-white/[0.06] bg-black/80 backdrop-blur-sm">
        <button onClick={() => setLocation("/teams")}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors font-bold">
          <span className="text-base">→</span> الفرق
        </button>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-white/40 mb-0.5">
            <span className="bg-[#bfff00]/20 text-[#bfff00] px-2 py-0.5 rounded text-[10px] font-black">
              {team.league}
            </span>
            <span>·</span><span>{team.country}</span>
          </div>
          <h1 className="text-sm md:text-lg font-black text-white leading-tight">{team.name}</h1>
        </div>
        <div className="text-left">
          <div className="text-[10px] text-white/30">السعر</div>
          <div className="text-xl font-black text-[#bfff00]">
            {team.basePrice}<span className="text-xs text-white/50 ml-1">د.أ</span>
          </div>
        </div>
      </div>
      {/* ══ MAIN ══ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ══ STICKER PANEL ══ */}
        <motion.div
          initial={{ x: 280, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="w-[155px] shrink-0 hidden md:flex flex-col bg-[#090909] border-l border-white/[0.06] z-10 overflow-hidden"
        >
          <div className="px-3 py-2.5 border-b border-white/[0.06] flex items-center gap-1.5">
            <span className="text-base">🎯</span>
            <p className="text-[10px] font-black text-white/35 uppercase tracking-widest">ستيكرات</p>
          </div>
          <div className="flex border-b border-white/[0.06] overflow-x-auto scrollbar-none">
            {STICKER_CATS.map(cat => (
              <button key={cat} onClick={() => setStickerCat(cat)}
                className="shrink-0 px-2.5 py-2 text-[10px] font-black transition-colors"
                style={{
                  color:        stickerCat === cat ? "#bfff00" : "rgba(255,255,255,0.3)",
                  borderBottom: stickerCat === cat ? "2px solid #bfff00" : "2px solid transparent",
                }}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10">
            <div className="grid grid-cols-2 gap-1.5">
              <AnimatePresence mode="wait">
                <motion.div key={stickerCat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="contents">
                  {filteredStickers.map(s => (
                    <StickerBtn key={s.id} s={s} selected={pendingSticker?.id === s.id} onClick={() => selectSticker(s)} />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div className="p-2.5 border-t border-white/[0.06] space-y-2">
            <p className="text-[10px] font-black text-[#bfff00]/60 uppercase tracking-widest">بصمتك ✍️</p>
            <textarea value={nahfaText} onChange={e => setNahfaText(e.target.value)}
              placeholder="اكتب نصك…" maxLength={20} rows={2} dir="auto"
              className="w-full px-2 py-1.5 bg-white/[0.04] border border-white/[0.08] text-white text-xs font-bold resize-none focus:outline-none focus:border-[#bfff00]/40 placeholder:text-white/20" />
            <button onClick={addNahfa} disabled={!nahfaText.trim()}
              className="w-full py-1.5 text-xs font-black disabled:opacity-30 transition-all"
              style={{ background: nahfaText.trim() ? "#bfff00" : "#1a1a1a", color: nahfaText.trim() ? "#000" : "#444" }}>
              إضافة للقميص
            </button>
          </div>
          {pendingSticker && (
            <div className="px-2.5 pb-2.5">
              <div className="bg-[#bfff00]/10 border border-[#bfff00]/25 rounded-lg p-2 text-center">
                <p className="text-[9px] text-[#bfff00] font-black leading-tight">انقر على<br />القميص لوضعه</p>
                <button onClick={() => setPendingSticker(null)} className="mt-1.5 text-[9px] text-white/30 hover:text-white/60 underline">إلغاء</button>
              </div>
            </div>
          )}
          {placedCount > 0 && (
            <div className="px-2.5 pb-2 text-center">
              <span className="text-[9px] text-white/22">{placedCount} ستيكر</span>
            </div>
          )}
        </motion.div>

        {/* ══ CENTER ══ */}
        <div className="flex-1 relative min-w-0 overflow-hidden">
          <ShirtStickerStage
            ref={stageRef}
            colors={colors}
            name={name}
            number={number}
            fontId={fontId}
            photoFront={hasPhoto ? photoFront : undefined}
            photoBack={photoBack}
            pendingSticker={pendingSticker}
            onStickerPlaced={() => { setPendingSticker(null); setPlacedCount(n => n + 1); }}
            accentColor={colors.body}
            view={view}
            onViewChange={setView}
          />
        </div>

        {/* ══ CUSTOMIZATION PANEL ══ */}
        <motion.div
          initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.05 }}
          className="w-[280px] md:w-[300px] shrink-0 hidden md:flex flex-col bg-[#0a0a0a] border-r border-white/[0.06] z-10 overflow-hidden"
        >
          <div className="flex border-b border-white/[0.07]">
            {customTabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center py-3.5 gap-0.5 text-xs font-black transition-all duration-200 ${
                  tab === t.id ? "text-[#bfff00] border-b-2 border-[#bfff00] bg-[#bfff00]/5" : "text-white/30 hover:text-white/70"
                }`}>
                <span className="text-base">{t.icon}</span><span>{t.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
            <AnimatePresence mode="wait">

              {tab === "colors" && (
                <motion.div key="c" initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} className="space-y-6">

                  {/* Jersey selector — if jerseys are uploaded */}
                  {jerseyColors.length > 0 && (
                    <>
                      <JerseyColorPicker
                        colors={jerseyColors}
                        selected={selectedColor}
                        onSelect={c => { setSelectedColor(c); }}
                        view={view}
                        onToggleView={() => setView(v => v === "front" ? "back" : "front")}
                      />
                      <div className="h-px bg-white/[0.06]" />
                    </>
                  )}

                  {/* If no photo, show color pickers */}
                  {!hasPhoto ? (
                    <>
                      <ZonePicker label="لون الجسم"    value={colors.body}    onChange={setZone("body")}    palette={PALETTE} />
                      <div className="h-px bg-white/[0.06]" />
                      <ZonePicker label="لون الأكمام"  value={colors.sleeves} onChange={setZone("sleeves")} palette={PALETTE} />
                      <div className="h-px bg-white/[0.06]" />
                      <ZonePicker label="لون الطوق"    value={colors.collar}  onChange={setZone("collar")}  palette={PALETTE} />
                      <div className="h-px bg-white/[0.06]" />
                      <ZonePicker label="الاسم والرقم" value={colors.trim}    onChange={setZone("trim")}    palette={PALETTE} />
                    </>
                  ) : (
                    <>
                      <ZonePicker label="لون الاسم والرقم" value={colors.trim} onChange={setZone("trim")} palette={PALETTE} />
                    </>
                  )}
                </motion.div>
              )}

              {tab === "name" && (
                <motion.div key="n" initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/50 uppercase tracking-widest block">
                      {hasPhoto ? "الاسم (على القميص)" : "الاسم (على ظهر القميص)"}
                    </label>
                    <input value={name} onChange={e => setName(e.target.value.toUpperCase())}
                      placeholder="AHMED" maxLength={12}
                      className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.10] text-white placeholder:text-white/20 font-black text-lg focus:outline-none focus:border-[#bfff00]/50 transition-colors" />
                    <div className="flex justify-between text-[10px] text-white/25">
                      <span>باللغة الإنجليزية</span><span>{name.length}/12</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/50 uppercase tracking-widest block">الرقم</label>
                    <input value={number}
                      onChange={e => setNumber(e.target.value.replace(/[^0-9]/g,"").slice(0,2))}
                      placeholder="10" maxLength={2}
                      className="w-full px-4 py-4 bg-white/[0.04] border border-white/[0.10] text-white placeholder:text-white/20 font-black text-5xl text-center focus:outline-none focus:border-[#bfff00]/50 transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/50 uppercase tracking-widest block">نمط الخط</label>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_STYLES.map(f => (
                        <button key={f.id} onClick={() => setFontId(f.id)}
                          className="px-3 py-3 border text-sm font-bold transition-all duration-200"
                          style={{
                            fontFamily:    f.family,
                            fontStyle:     (f.style as Record<string,string>).fontStyle ?? "normal",
                            letterSpacing: (f.style as Record<string,string>).letterSpacing ?? "normal",
                            borderColor:   fontId === f.id ? "#bfff00" : "rgba(255,255,255,0.08)",
                            background:    fontId === f.id ? "rgba(191,255,0,0.10)" : "rgba(255,255,255,0.02)",
                            color:         fontId === f.id ? "#bfff00" : "rgba(255,255,255,0.35)",
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
                  {team.availableSizes.map(s => (
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
                color:      size ? "#000" : "#444",
                boxShadow:  size ? "0 0 30px rgba(191,255,0,0.30), 0 4px 16px rgba(0,0,0,0.5)" : "none",
              }}>
              {size ? "🛒 إتمام الطلب" : "اختر المقاس أولاً"}
            </button>
          </div>
        </motion.div>
      </div>
      {/* ══ MOBILE BOTTOM BAR ══ */}
      <div className="md:hidden border-t border-white/[0.06] bg-[#080808] shrink-0 z-20">
        <div className="flex border-b border-white/[0.06]">
          {[
            { id: "stickers" as MobileTab, icon: "🎯", label: "ستيكرات" },
            { id: "colors"   as MobileTab, icon: "🎨", label: "جيرسيه"  },
            { id: "name"     as MobileTab, icon: "✏️",  label: "اسم"    },
            { id: "size"     as MobileTab, icon: "📐",  label: "مقاس"   },
          ].map(t => (
            <button key={t.id} onClick={() => setMobileTab(t.id)}
              className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 text-[10px] font-black transition-all ${
                mobileTab === t.id ? "text-[#bfff00] border-t-2 border-[#bfff00] bg-[#bfff00]/5" : "text-white/25"
              }`}>
              <span className="text-sm">{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="max-h-[220px] overflow-y-auto">
          {mobileTab === "stickers" && (
            <div className="p-3 space-y-3">
              <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-none">
                {STICKER_CATS.map(cat => (
                  <button key={cat} onClick={() => setStickerCat(cat)}
                    className="shrink-0 px-3 py-1.5 text-[10px] font-black rounded-full border transition-colors"
                    style={{
                      color:        stickerCat === cat ? "#000"            : "rgba(255,255,255,0.4)",
                      background:   stickerCat === cat ? "#bfff00"         : "rgba(255,255,255,0.04)",
                      borderColor:  stickerCat === cat ? "#bfff00"         : "rgba(255,255,255,0.06)",
                    }}>
                    {cat}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {filteredStickers.map(s => (
                  <StickerBtn key={s.id} s={s} selected={pendingSticker?.id === s.id} onClick={() => selectSticker(s)} />
                ))}
              </div>
              <div className="flex gap-2">
                <textarea value={nahfaText} onChange={e => setNahfaText(e.target.value)}
                  placeholder="نهفة…" maxLength={20} rows={1} dir="auto"
                  className="flex-1 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] text-white text-xs font-bold resize-none focus:outline-none focus:border-[#bfff00]/40" />
                <button onClick={addNahfa} disabled={!nahfaText.trim()}
                  className="px-3 py-1.5 text-xs font-black disabled:opacity-30"
                  style={{ background: nahfaText.trim() ? "#bfff00" : "#1a1a1a", color: nahfaText.trim() ? "#000" : "#444" }}>
                  إضافة
                </button>
              </div>
            </div>
          )}

          {mobileTab === "colors" && (
            <div className="p-3 space-y-3">
              {jerseyColors.length > 0 ? (
                <JerseyColorPicker
                  colors={jerseyColors} selected={selectedColor}
                  onSelect={setSelectedColor} view={view}
                  onToggleView={() => setView(v => v === "front" ? "back" : "front")}
                />
              ) : (
                <>
                  <ZonePicker label="الجسم"  value={colors.body}    onChange={setZone("body")}    palette={PALETTE} />
                  <ZonePicker label="الأكمام" value={colors.sleeves} onChange={setZone("sleeves")} palette={PALETTE} />
                  <ZonePicker label="الطوق"   value={colors.collar}  onChange={setZone("collar")}  palette={PALETTE} />
                </>
              )}
              <ZonePicker label="لون الاسم والرقم" value={colors.trim} onChange={setZone("trim")} palette={PALETTE} />
            </div>
          )}

          {mobileTab === "name" && (
            <div className="p-3 space-y-3">
              <input value={name} onChange={e => setName(e.target.value.toUpperCase())} placeholder="AHMED" maxLength={12}
                className="w-full px-4 py-2 bg-white/[0.04] border border-white/[0.10] text-white placeholder:text-white/20 font-black text-sm focus:outline-none focus:border-[#bfff00]/50" />
              <input value={number} onChange={e => setNumber(e.target.value.replace(/[^0-9]/g,"").slice(0,2))} placeholder="10" maxLength={2}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.10] text-white placeholder:text-white/20 font-black text-3xl text-center focus:outline-none focus:border-[#bfff00]/50" />
              <div className="grid grid-cols-2 gap-2">
                {FONT_STYLES.map(f => (
                  <button key={f.id} onClick={() => setFontId(f.id)}
                    className="px-2 py-2 border text-xs font-bold transition-all"
                    style={{
                      fontFamily:  f.family,
                      fontStyle:   (f.style as Record<string,string>).fontStyle ?? "normal",
                      borderColor: fontId === f.id ? "#bfff00" : "rgba(255,255,255,0.08)",
                      background:  fontId === f.id ? "rgba(191,255,0,0.10)" : "rgba(255,255,255,0.02)",
                      color:       fontId === f.id ? "#bfff00" : "rgba(255,255,255,0.35)",
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mobileTab === "size" && (
            <div className="p-3 grid grid-cols-3 gap-2">
              {team.availableSizes.map(s => (
                <button key={s} onClick={() => setSize(s)}
                  className="py-3 text-center font-black text-sm border transition-all"
                  style={{
                    borderColor: size === s ? "#bfff00" : "rgba(255,255,255,0.07)",
                    background:  size === s ? "rgba(191,255,0,0.08)" : "rgba(255,255,255,0.02)",
                    color:       size === s ? "#bfff00" : "rgba(255,255,255,0.5)",
                  }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile CTA */}
        <div className="p-3 border-t border-white/[0.06]">
          <button onClick={handleOrder} disabled={!size}
            className="w-full py-3.5 text-base font-black transition-all disabled:opacity-30"
            style={{
              background: size ? "linear-gradient(135deg,#bfff00 0%,#7ecf00 100%)" : "#1a1a1a",
              color:      size ? "#000" : "#444",
            }}>
            {size ? "🛒 إتمام الطلب" : "اختر المقاس أولاً"}
          </button>
        </div>
      </div>
    </div>
  );
}
