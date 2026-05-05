import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetTeam } from "@workspace/api-client-react";
import { getGetTeamQueryKey } from "@workspace/api-client-react";
import { useOrder } from "@/components/order-context";
import { FONT_STYLES, type JerseyColors } from "@/components/configurator-jersey";
import { ShirtViewer3D } from "@/components/virtual-tryon";
import {
  getStickerCanvas,
  type StickerDef,
} from "@/components/sticker-library";
import { useTranslation } from "react-i18next";

/* ─── Types ──────────────────────────────────────────────── */
interface JerseyColor {
  id: number; teamId: number; name: string;
  frontImageUrl: string; backImageUrl: string | null; isSoldOut?: boolean;
  hexCode: string; secondaryHexCode: string;
  isDefault: boolean; sortOrder: number;
  priceWithCustomization?: number | null;
  priceWithoutCustomization?: number | null;
}

const SIZE_INFO: Record<string, string> = {
  XS: "كتف 38–40 سم", S: "كتف 40–42 سم", M: "كتف 42–44 سم",
  L: "كتف 44–46 سم", XL: "كتف 46–49 سم", XXL: "كتف 49+ سم",
};

/* API sticker shape from /api/stickers */
interface ApiSticker { id: number; name: string; url: string; category: string; }

type CustomTab = "colors" | "name" | "size";
type MobileTab = "stickers" | "colors" | "name" | "size";

/* ─── StickerBtn ─────────────────────────────────────────── */
function StickerBtn({ s, selected, onClick }: {
  s: StickerDef; selected: boolean; onClick: () => void;
}) {
  /* Hooks must be at the top — called unconditionally */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (s.url) return; // URL stickers use <img>, no canvas needed
    const img = getStickerCanvas(s);
    if (!img || !canvasRef.current) return;
    const c = canvasRef.current;
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0);
  }, [s]);

  const btnStyle = {
    background: selected ? "rgba(191,255,0,0.14)" : "rgba(255,255,255,0.03)",
    border:     selected ? "1.5px solid #bfff00"  : "1.5px solid rgba(255,255,255,0.06)",
    boxShadow:  selected ? "0 0 12px rgba(191,255,0,0.35)" : "none",
  };

  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all duration-150 active:scale-90"
      style={btnStyle}>
      {s.url
        ? <img src={s.url} alt={s.label} className="w-10 h-10 object-contain" />
        : <canvas ref={canvasRef} width={80} height={80} className="w-10 h-10" />
      }
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
  const { t } = useTranslation();
  if (colors.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {/* View toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-white/50 uppercase tracking-widest">{t("td_jersey_color")}</span>
        <button onClick={onToggleView}
          className="flex items-center gap-1.5 bg-white/[0.07] border border-white/[0.10] text-white/60 hover:text-[#bfff00] hover:border-[#bfff00]/40 text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all">
          <span>↔</span>
          {view === "front" ? t("td_view_back") : t("td_view_front")}
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
            <span className="text-[9px] text-amber-400/60">{t("td_no_back_image")}</span>
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

  /* stickers — fetched from API (admin-managed) */
  const [apiStickers, setApiStickers]       = useState<StickerDef[]>([]);
  const [stickerCat, setStickerCat]         = useState<string>("");
  const [pendingSticker, setPendingSticker] = useState<StickerDef | null>(null);
  const [placedCount, setPlacedCount]       = useState(0);
  const [nahfaText, setNahfaText]           = useState("");

  /* customization mode: with printing (name+number) or without */
  const [withCustomization, setWithCustomization] = useState(true);

  /* effective price based on mode and selected color */
  const effectivePrice = (() => {
    if (!team) return 0;
    if (withCustomization) {
      return selectedColor?.priceWithCustomization ?? team.basePrice;
    } else {
      return selectedColor?.priceWithoutCustomization ?? team.basePrice;
    }
  })();

  /* mobile */
  const [mobileTab, setMobileTab] = useState<MobileTab>("stickers");

  /* Load active stickers from API (admin-managed) */
  useEffect(() => {
    fetch("/api/stickers")
      .then(r => r.ok ? r.json() : [])
      .then((rows: ApiSticker[]) => {
        const defs: StickerDef[] = rows.map(r => ({
          id: String(r.id),
          label: r.name,
          category: r.category,
          url: r.url,
        }));
        setApiStickers(defs);
        /* Set first category as default */
        if (defs.length > 0) setStickerCat(defs[0].category);
      })
      .catch(() => {});
  }, []);

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

  const handleOrder = async () => {
    if (!size) { alert(t("td_select_size_alert")); return; }

    /* Use the admin-uploaded jersey images directly */
    const capturedFront: string | undefined = selectedColor?.frontImageUrl ?? undefined;
    const capturedBack:  string | undefined = selectedColor?.backImageUrl  ?? undefined;

    updateOrder({
      teamId: team!.id, teamName: team!.name, basePrice: effectivePrice,
      color: colors.body, size: size as "XS" | "S" | "M" | "L" | "XL" | "XXL",
      customerName: withCustomization ? (name || "BASMAH") : "BASMAH",
      jerseyNumber: withCustomization ? (number || "10") : "—",
      quantity: 1, previewColor: colors.body,
      previewName: withCustomization ? (name || "BASMAH") : "BASMAH",
      previewNumber: withCustomization ? (number || "10") : "—",
      playerName: withCustomization ? (name || undefined) : undefined,
      frontImageUrl: capturedFront,
      backImageUrl:  capturedBack,
      jerseyColorName: selectedColor?.name ?? undefined,
      jerseyColorId: selectedColor?.id ?? undefined,
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

  const stickerCats = Array.from(new Set(apiStickers.map(s => s.category)));
  const filteredStickers = apiStickers.filter(s => s.category === stickerCat);

  const { t } = useTranslation();

  const SIZE_INFO_T: Record<string, string> = {
    XS: t("td_size_xs"), S: t("td_size_s"), M: t("td_size_m"),
    L: t("td_size_l"), XL: t("td_size_xl"), XXL: t("td_size_xxl"),
  };

  const customTabs: { id: CustomTab; icon: string; label: string }[] = [
    { id: "colors", icon: "🎨", label: t("td_tab_colors") },
    { id: "name",   icon: "✏️",  label: t("td_tab_name")   },
    { id: "size",   icon: "📐",  label: t("td_tab_size")   },
  ];

  /* ── Loading / 404 ──────────────────────────────────────── */
  if (isLoading) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-[#bfff00] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/50 font-bold">…</p>
      </div>
    </div>
  );

  if (!team) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-black text-white">404</h2>
        <button onClick={() => setLocation("/teams")} className="px-6 py-3 bg-[#bfff00] text-black font-black">{t("nav_teams")}</button>
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
          <span className="text-base">→</span> {t("nav_teams")}
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
          <div className="text-[10px] text-white/30">{withCustomization ? t("td_price_label_with") : t("td_price_label_without")}</div>
          <div className="text-xl font-black text-[#bfff00]">
            {effectivePrice}<span className="text-xs text-white/50 ml-1">{t("td_currency")}</span>
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
            <p className="text-[10px] font-black text-white/35 uppercase tracking-widest">{t("td_stickers_panel")}</p>
          </div>
          <div className="flex border-b border-white/[0.06] overflow-x-auto scrollbar-none">
            {stickerCats.map(cat => (
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
            {apiStickers.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[10px] text-white/20">لا توجد ملصقات مفعّلة</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                <AnimatePresence mode="wait">
                  <motion.div key={stickerCat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="contents">
                    {filteredStickers.map(s => (
                      <StickerBtn key={s.id} s={s} selected={pendingSticker?.id === s.id} onClick={() => selectSticker(s)} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>
          <div className="p-2.5 border-t border-white/[0.06] space-y-2">
            <p className="text-[10px] font-black text-[#bfff00]/60 uppercase tracking-widest">{t("td_your_mark")}</p>
            <textarea value={nahfaText} onChange={e => setNahfaText(e.target.value)}
              placeholder={t("td_nahfa_placeholder")} maxLength={20} rows={2} dir="auto"
              className="w-full px-2 py-1.5 bg-white/[0.04] border border-white/[0.08] text-white text-xs font-bold resize-none focus:outline-none focus:border-[#bfff00]/40 placeholder:text-white/20" />
            <button onClick={addNahfa} disabled={!nahfaText.trim()}
              className="w-full py-1.5 text-xs font-black disabled:opacity-30 transition-all"
              style={{ background: nahfaText.trim() ? "#bfff00" : "#1a1a1a", color: nahfaText.trim() ? "#000" : "#444" }}>
              {t("td_add_to_jersey")}
            </button>
          </div>
          {pendingSticker && (
            <div className="px-2.5 pb-2.5">
              <div className="bg-[#bfff00]/10 border border-[#bfff00]/25 rounded-lg p-2 text-center">
                <p className="text-[9px] text-[#bfff00] font-black leading-tight">{t("td_click_jersey_hint")}</p>
                <button onClick={() => setPendingSticker(null)} className="mt-1.5 text-[9px] text-white/30 hover:text-white/60 underline">{t("td_cancel")}</button>
              </div>
            </div>
          )}
          {placedCount > 0 && (
            <div className="px-2.5 pb-2 text-center">
              <span className="text-[9px] text-white/22">{t("td_sticker_count", { count: placedCount })}</span>
            </div>
          )}
        </motion.div>

        {/* ══ CENTER — 3D Shirt Viewer ══ */}
        <div className="flex-1 relative min-w-0 overflow-hidden bg-[#080808]">
          <ShirtViewer3D
            frontImageUrl={selectedColor?.frontImageUrl ?? null}
            backImageUrl={selectedColor?.backImageUrl  ?? null}
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

            {/* Customization mode toggle */}
            <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
              <button onClick={() => setWithCustomization(true)}
                className="flex-1 py-2.5 text-xs font-black transition-all"
                style={{
                  background: withCustomization ? "#bfff00" : "transparent",
                  color:      withCustomization ? "#000"    : "rgba(255,255,255,0.35)",
                }}>
                ✏️ {t("td_with_print")}
              </button>
              <button onClick={() => setWithCustomization(false)}
                className="flex-1 py-2.5 text-xs font-black transition-all"
                style={{
                  background: !withCustomization ? "#bfff00" : "transparent",
                  color:      !withCustomization ? "#000"    : "rgba(255,255,255,0.35)",
                }}>
                👕 {t("td_without_print")}
              </button>
            </div>

            <AnimatePresence mode="wait">

              {tab === "colors" && (
                <motion.div key="c" initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} className="space-y-5">

                  {/* Jersey color selector */}
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

                  {/* Color info note */}
                  <div className="rounded-xl border border-[#bfff00]/20 bg-[#bfff00]/[0.04] p-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl shrink-0 mt-0.5">🖨️</span>
                      <div>
                        <p className="text-[13px] font-black text-[#bfff00]/90 leading-snug">{t("td_color_note_title")}</p>
                        <p className="text-[11px] text-white/40 mt-1 leading-relaxed">{t("td_color_note_body")}</p>
                      </div>
                    </div>

                    {selectedColor ? (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="flex items-center gap-2.5 bg-white/[0.04] rounded-lg px-3 py-2.5 border border-white/[0.07]">
                          <div className="w-8 h-8 rounded-md border border-white/20 shadow-lg shrink-0"
                            style={{ backgroundColor: selectedColor.hexCode }} />
                          <div className="min-w-0">
                            <p className="text-[9px] text-white/35 font-bold uppercase tracking-widest">{t("td_color_primary")}</p>
                            <p className="text-xs font-black text-white/80 font-mono uppercase truncate">{selectedColor.hexCode}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 bg-white/[0.04] rounded-lg px-3 py-2.5 border border-white/[0.07]">
                          <div className="w-8 h-8 rounded-md border border-white/20 shadow-lg shrink-0"
                            style={{ backgroundColor: selectedColor.secondaryHexCode }} />
                          <div className="min-w-0">
                            <p className="text-[9px] text-white/35 font-bold uppercase tracking-widest">{t("td_color_secondary")}</p>
                            <p className="text-xs font-black text-white/80 font-mono uppercase truncate">{selectedColor.secondaryHexCode}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-white/30 text-center py-1">{t("td_color_no_selection")}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {tab === "name" && (
                <motion.div key="n" initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/50 uppercase tracking-widest block">
                      {t("td_name_label")}
                    </label>
                    <input value={name} onChange={e => setName(e.target.value.toUpperCase())}
                      placeholder={t("td_name_placeholder")} maxLength={12}
                      className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.10] text-white placeholder:text-white/20 font-black text-lg focus:outline-none focus:border-[#bfff00]/50 transition-colors" />
                    <div className="flex justify-between text-[10px] text-white/25">
                      <span></span><span>{name.length}/12</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/50 uppercase tracking-widest block">{t("td_number_label")}</label>
                    <input value={number}
                      onChange={e => setNumber(e.target.value.replace(/[^0-9]/g,"").slice(0,2))}
                      placeholder={t("td_number_placeholder")} maxLength={2}
                      className="w-full px-4 py-4 bg-white/[0.04] border border-white/[0.10] text-white placeholder:text-white/20 font-black text-5xl text-center focus:outline-none focus:border-[#bfff00]/50 transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/50 uppercase tracking-widest block">{t("td_font_style")}</label>
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
                  {/* Shoulder measurement hint */}
                  <div className="flex items-start gap-2.5 bg-[#bfff00]/[0.04] border border-[#bfff00]/20 rounded-xl p-3 mb-4">
                    <span className="text-lg shrink-0">📏</span>
                    <div>
                      <p className="text-[11px] font-black text-[#bfff00]/80 leading-snug">القياس من الكتف</p>
                      <p className="text-[10px] text-white/35 mt-0.5 leading-relaxed">قس المسافة بين طرفي الكتفين من الأعلى. اختر المقاس المطابق لقياسك.</p>
                    </div>
                  </div>
                  {team.availableSizes.map(s => (
                    <button key={s} onClick={() => setSize(s)}
                      className="w-full flex items-center justify-between px-4 py-3.5 border transition-all duration-200 group"
                      style={{
                        borderColor: size === s ? "#bfff00" : "rgba(255,255,255,0.07)",
                        background:  size === s ? "rgba(191,255,0,0.08)" : "rgba(255,255,255,0.02)",
                      }}>
                      <span className={`text-2xl font-black transition-colors ${size === s ? "text-[#bfff00]" : "text-white/50 group-hover:text-white/80"}`}>{s}</span>
                      <span className="text-xs text-white/30">{SIZE_INFO_T[s] ?? ""}</span>
                      {size === s && <span className="text-[#bfff00] text-lg font-black">✓</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA */}
          <div className="p-4 border-t border-white/[0.06] shrink-0 bg-black/60">
            {!size && <p className="text-[10px] text-center text-amber-400/70 mb-2">{t("td_select_size_hint")}</p>}
            <button onClick={handleOrder} disabled={!size}
              className="w-full py-4 text-lg font-black transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: size ? "linear-gradient(135deg,#bfff00 0%,#7ecf00 100%)" : "#1a1a1a",
                color:      size ? "#000" : "#444",
                boxShadow:  size ? "0 0 30px rgba(191,255,0,0.30), 0 4px 16px rgba(0,0,0,0.5)" : "none",
              }}>
              {size ? t("td_order_btn") : t("td_select_size_first")}
            </button>
          </div>
        </motion.div>
      </div>
      {/* ══ MOBILE BOTTOM BAR ══ */}
      <div className="md:hidden border-t border-white/[0.06] bg-[#080808] shrink-0 z-20">
        <div className="flex border-b border-white/[0.06]">
          {[
            { id: "stickers" as MobileTab, icon: "🎯", label: t("td_tab_stickers") },
            { id: "colors"   as MobileTab, icon: "🎨", label: t("td_tab_colors")   },
            { id: "name"     as MobileTab, icon: "✏️",  label: t("td_tab_name")    },
            { id: "size"     as MobileTab, icon: "📐",  label: t("td_tab_size")    },
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
                {stickerCats.map(cat => (
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
                  placeholder={t("td_nahfa_placeholder")} maxLength={20} rows={1} dir="auto"
                  className="flex-1 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] text-white text-xs font-bold resize-none focus:outline-none focus:border-[#bfff00]/40" />
                <button onClick={addNahfa} disabled={!nahfaText.trim()}
                  className="px-3 py-1.5 text-xs font-black disabled:opacity-30"
                  style={{ background: nahfaText.trim() ? "#bfff00" : "#1a1a1a", color: nahfaText.trim() ? "#000" : "#444" }}>
                  {t("td_nahfa_add")}
                </button>
              </div>
            </div>
          )}

          {mobileTab === "colors" && (
            <div className="p-3 space-y-3">
              {jerseyColors.length > 0 && (
                <JerseyColorPicker
                  colors={jerseyColors} selected={selectedColor}
                  onSelect={setSelectedColor} view={view}
                  onToggleView={() => setView(v => v === "front" ? "back" : "front")}
                />
              )}
              {/* Color note */}
              <div className="rounded-xl border border-[#bfff00]/20 bg-[#bfff00]/[0.04] p-3 space-y-2.5">
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0">🖨️</span>
                  <div>
                    <p className="text-[11px] font-black text-[#bfff00]/90 leading-snug">{t("td_color_note_title")}</p>
                    <p className="text-[10px] text-white/35 mt-0.5 leading-relaxed">{t("td_color_note_body")}</p>
                  </div>
                </div>
                {selectedColor ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-2.5 py-2 border border-white/[0.07]">
                      <div className="w-6 h-6 rounded shrink-0 border border-white/20"
                        style={{ backgroundColor: selectedColor.hexCode }} />
                      <div className="min-w-0">
                        <p className="text-[8px] text-white/30 font-bold uppercase">{t("td_color_primary")}</p>
                        <p className="text-[10px] font-black text-white/70 font-mono uppercase truncate">{selectedColor.hexCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-2.5 py-2 border border-white/[0.07]">
                      <div className="w-6 h-6 rounded shrink-0 border border-white/20"
                        style={{ backgroundColor: selectedColor.secondaryHexCode }} />
                      <div className="min-w-0">
                        <p className="text-[8px] text-white/30 font-bold uppercase">{t("td_color_secondary")}</p>
                        <p className="text-[10px] font-black text-white/70 font-mono uppercase truncate">{selectedColor.secondaryHexCode}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-white/25 text-center">{t("td_color_no_selection")}</p>
                )}
              </div>
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
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2 bg-[#bfff00]/[0.04] border border-[#bfff00]/20 rounded-xl px-3 py-2 mb-1">
                <span className="text-sm">📏</span>
                <p className="text-[10px] text-white/40 leading-tight">القياس من طرف الكتف للطرف الثاني</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {team.availableSizes.map(s => (
                  <button key={s} onClick={() => setSize(s)}
                    className="py-3 text-center font-black text-sm border transition-all flex flex-col items-center gap-0.5"
                    style={{
                      borderColor: size === s ? "#bfff00" : "rgba(255,255,255,0.07)",
                      background:  size === s ? "rgba(191,255,0,0.08)" : "rgba(255,255,255,0.02)",
                      color:       size === s ? "#bfff00" : "rgba(255,255,255,0.5)",
                    }}>
                    <span>{s}</span>
                    <span className="text-[8px] font-normal opacity-50">{SIZE_INFO_T[s]?.replace("كتف ", "") ?? ""}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile CTA */}
        <div className="p-3 border-t border-white/[0.06] space-y-2">
          {/* Customization mode toggle — mobile */}
          <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
            <button onClick={() => setWithCustomization(true)}
              className="flex-1 py-2 text-[11px] font-black transition-all"
              style={{
                background: withCustomization ? "#bfff00" : "transparent",
                color:      withCustomization ? "#000"    : "rgba(255,255,255,0.35)",
              }}>
              ✏️ {t("td_with_print")}
            </button>
            <button onClick={() => setWithCustomization(false)}
              className="flex-1 py-2 text-[11px] font-black transition-all"
              style={{
                background: !withCustomization ? "#bfff00" : "transparent",
                color:      !withCustomization ? "#000"    : "rgba(255,255,255,0.35)",
              }}>
              👕 {t("td_without_print")}
            </button>
          </div>
          <button onClick={handleOrder} disabled={!size}
            className="w-full py-3.5 text-base font-black transition-all disabled:opacity-30"
            style={{
              background: size ? "linear-gradient(135deg,#bfff00 0%,#7ecf00 100%)" : "#1a1a1a",
              color:      size ? "#000" : "#444",
            }}>
            {size ? t("td_order_price", { price: effectivePrice }) : t("td_select_size_first")}
          </button>
        </div>
      </div>
    </div>
  );
}
