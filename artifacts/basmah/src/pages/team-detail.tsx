import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetTeam } from "@workspace/api-client-react";
import { getGetTeamQueryKey } from "@workspace/api-client-react";
import { useOrder } from "@/components/order-context";
import { type JerseyColors } from "@/components/configurator-jersey";
import { JerseyPhotoViewer, TEAM_FONT_STYLE } from "@/components/jersey-photo-viewer";
import { useTranslation } from "react-i18next";

/* ─── Types ──────────────────────────────────────────────── */
interface JerseyColor {
  id: number; teamId: number; name: string;
  frontImageUrl: string; backImageUrl: string | null;
  images: string[];           /* all image URLs in display order */
  isSoldOut?: boolean;
  hexCode: string; secondaryHexCode: string;
  isDefault: boolean; sortOrder: number;
  priceWithCustomization?: number | null;
  priceWithoutCustomization?: number | null;
}

type MobileTab = "colors" | "name" | "size";

/* ─── Color thumbnail strip ──────────────────────────────── */
function ColorStrip({ colors, selected, onSelect }: {
  colors: JerseyColor[];
  selected: JerseyColor | null;
  onSelect: (c: JerseyColor) => void;
}) {
  if (colors.length === 0) return null;
  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map(c => (
        <button
          key={c.id}
          onClick={() => !c.isSoldOut && onSelect(c)}
          disabled={!!c.isSoldOut}
          title={c.name}
          className="relative shrink-0 rounded-lg overflow-hidden transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            width: 48, height: 58,
            border: selected?.id === c.id
              ? "2px solid #bfff00"
              : "2px solid rgba(255,255,255,0.07)",
            boxShadow: selected?.id === c.id
              ? "0 0 14px rgba(191,255,0,0.40)"
              : "none",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <img
            src={c.frontImageUrl}
            alt={c.name}
            style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center top" }}
            onError={e => {
              (e.target as HTMLImageElement).style.display = "none";
              const p = (e.target as HTMLImageElement).parentElement;
              if (p) p.style.backgroundColor = c.hexCode;
            }}
          />
          {c.isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-[6px] font-black text-white bg-red-600 px-1 py-0.5 rounded rotate-[-10deg] leading-none">SOLD</span>
            </div>
          )}
          {selected?.id === c.id && (
            <div className="absolute bottom-0 inset-x-0 bg-[#bfff00] text-black text-[7px] font-black text-center py-0.5 truncate px-0.5 leading-none">
              {c.name}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── Section header ─────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-black tracking-[2.5px] uppercase text-white/30 mb-2">
      {children}
    </p>
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

  const [jerseyColors, setJerseyColors] = useState<JerseyColor[]>([]);
  const [selectedColor, setSelectedColor] = useState<JerseyColor | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [name, setName]   = useState("");
  const [number, setNumber] = useState("");
  const [size, setSize]   = useState("");
  const [fontId, setFontId] = useState("block");
  const [colors, setColors] = useState<JerseyColors>({
    body: "#cc0000", sleeves: "#ffffff", collar: "#cc0000", trim: "#ffffff",
  });
  const [withCustomization, setWithCustomization] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("colors");

  /* prices */
  const baseEffectivePrice = (() => {
    if (!team) return 0;
    return withCustomization
      ? (selectedColor?.priceWithCustomization ?? team.basePrice)
      : (selectedColor?.priceWithoutCustomization ?? team.basePrice);
  })();
  const discountPercent = (team as (typeof team & { discountPercent?: number }))?.discountPercent ?? 0;
  const effectivePrice  = discountPercent > 0
    ? Math.round(baseEffectivePrice * (1 - discountPercent / 100))
    : baseEffectivePrice;

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

  useEffect(() => {
    if (selectedColor) {
      setColors(prev => ({
        ...prev,
        body: selectedColor.hexCode,
        sleeves: selectedColor.secondaryHexCode,
        trim: selectedColor.secondaryHexCode,
      }));
      setActiveImageIndex(0); /* reset to first image when color changes */
    }
  }, [selectedColor]);

  useEffect(() => {
    if (team?.id) {
      const suggested = TEAM_FONT_STYLE[team.id]?.fontId;
      if (suggested) setFontId(suggested);
    }
  }, [team?.id]);

  const handleOrder = async () => {
    if (!size) { alert(t("td_select_size_alert")); return; }
    updateOrder({
      teamId: team!.id, teamName: team!.name, basePrice: effectivePrice,
      color: colors.body, size: size as "XS" | "S" | "M" | "L" | "XL" | "XXL",
      customerName:  withCustomization ? (name   || "BASMAH") : "BASMAH",
      jerseyNumber:  withCustomization ? (number || "10")     : "—",
      quantity: 1, previewColor: colors.body,
      previewName:   withCustomization ? (name   || "BASMAH") : "BASMAH",
      previewNumber: withCustomization ? (number || "10")     : "—",
      playerName:    withCustomization ? (name || undefined)  : undefined,
      frontImageUrl: selectedColor?.frontImageUrl ?? undefined,
      backImageUrl:  selectedColor?.backImageUrl  ?? undefined,
      jerseyColorName: selectedColor?.name        ?? undefined,
      jerseyColorId:   selectedColor?.id          ?? undefined,
    });
    setLocation("/order");
  };

  const { t } = useTranslation();

  const SIZE_INFO_T: Record<string, string> = {
    XS: t("td_size_xs"), S: t("td_size_s"), M: t("td_size_m"),
    L: t("td_size_l"), XL: t("td_size_xl"), XXL: t("td_size_xxl"),
  };

  /* ── Loading / 404 ──────────────────────────────────────── */
  if (isLoading) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#bfff00] border-t-transparent rounded-full animate-spin" />
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

  /* ─────────────────────────────────────────────────────────
     SHARED content blocks (used in both desktop + mobile)
  ───────────────────────────────────────────────────────── */

  /* Print toggle */
  const PrintToggle = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex rounded-lg overflow-hidden border border-white/[0.08] ${compact ? "" : "w-full"}`}>
      <button
        onClick={() => setWithCustomization(true)}
        className={`flex-1 font-black transition-all duration-150 ${compact ? "py-2 text-[11px]" : "py-2.5 text-xs"}`}
        style={{
          background: withCustomization ? "#bfff00" : "transparent",
          color:      withCustomization ? "#000"    : "rgba(255,255,255,0.30)",
        }}
      >
        {t("td_with_print")}
      </button>
      <button
        onClick={() => setWithCustomization(false)}
        className={`flex-1 font-black transition-all duration-150 ${compact ? "py-2 text-[11px]" : "py-2.5 text-xs"}`}
        style={{
          background: !withCustomization ? "#bfff00" : "transparent",
          color:      !withCustomization ? "#000"    : "rgba(255,255,255,0.30)",
        }}
      >
        {t("td_without_print")}
      </button>
    </div>
  );

  /* Color chips + info */
  const ColorSection = ({ compact = false }: { compact?: boolean }) => (
    <div className="space-y-3">
      <ColorStrip
        colors={jerseyColors} selected={selectedColor}
        onSelect={setSelectedColor}
      />
      {selectedColor && (
        <div className="flex items-center gap-3 pt-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: selectedColor.hexCode }} />
            <span className="text-[10px] font-mono font-bold text-white/35 uppercase">{selectedColor.hexCode}</span>
          </div>
          <div className="w-px h-3 bg-white/[0.12]" />
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: selectedColor.secondaryHexCode }} />
            <span className="text-[10px] font-mono font-bold text-white/35 uppercase">{selectedColor.secondaryHexCode}</span>
          </div>
          <span className="text-[10px] text-white/25 font-bold mr-auto">{selectedColor.name}</span>
        </div>
      )}
      <div className={`flex items-start gap-2 rounded-lg border border-[#bfff00]/15 bg-[#bfff00]/[0.03] ${compact ? "p-2.5" : "p-3"}`}>
        <div className="w-5 h-5 shrink-0 mt-0.5 text-[#bfff00]/50 text-xs flex items-center justify-center">🖨️</div>
        <p className={`text-white/35 leading-relaxed ${compact ? "text-[9px]" : "text-[10px]"}`}>
          {t("td_color_note_body")}
        </p>
      </div>
    </div>
  );

  /* Name + Number inputs */
  const PrintSection = ({ compact = false }: { compact?: boolean }) => (
    <AnimatePresence>
      {withCustomization && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className={`space-y-3 ${compact ? "" : "pt-1"}`}>
            <div>
              <input
                value={name}
                onChange={e => setName(e.target.value.replace(/[^A-Za-z\s.]/g, "").toUpperCase())}
                placeholder={t("td_name_label")}
                maxLength={12} dir="ltr" lang="en"
                className={`w-full bg-white/[0.04] border border-white/[0.09] text-white placeholder:text-white/20
                            font-black tracking-[3px] focus:outline-none focus:border-[#bfff00]/40 transition-colors
                            ${compact ? "px-3 py-2 text-sm" : "px-4 py-3 text-base"}`}
              />
              <div className="flex justify-end mt-1">
                <span className="text-[9px] text-white/20 font-bold">{name.length}/12</span>
              </div>
            </div>
            <input
              value={number}
              onChange={e => setNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
              placeholder="10" maxLength={2} type="tel"
              className={`w-full bg-white/[0.04] border border-white/[0.09] text-white placeholder:text-white/15
                          font-black text-center focus:outline-none focus:border-[#bfff00]/40 transition-colors
                          ${compact ? "py-3 text-3xl" : "py-4 text-5xl"}`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  /* Size grid */
  const SizeSection = ({ compact = false }: { compact?: boolean }) => (
    <div className="space-y-2">
      <div className={`grid gap-2 ${compact ? "grid-cols-6" : "grid-cols-3"}`}>
        {team.availableSizes.map(s => (
          <button
            key={s}
            onClick={() => setSize(s)}
            className="flex flex-col items-center justify-center border font-black transition-all duration-150 hover:scale-105 active:scale-95"
            style={{
              padding:     compact ? "8px 4px" : "12px 4px",
              borderColor: size === s ? "#bfff00" : "rgba(255,255,255,0.07)",
              background:  size === s ? "rgba(191,255,0,0.09)" : "rgba(255,255,255,0.02)",
              color:       size === s ? "#bfff00" : "rgba(255,255,255,0.45)",
              boxShadow:   size === s ? "0 0 14px rgba(191,255,0,0.20)" : "none",
            }}
          >
            <span className={compact ? "text-sm" : "text-lg"}>{s}</span>
            {!compact && (
              <span className="text-[8px] text-white/25 font-normal mt-0.5">{SIZE_INFO_T[s]?.replace("كتف ", "") ?? ""}</span>
            )}
          </button>
        ))}
      </div>
      {!compact && (
        <p className="text-[9px] text-white/25 leading-relaxed pt-1">
          قس المسافة بين طرفي الكتفين، اختر المقاس الأقرب لقياسك.
        </p>
      )}
    </div>
  );

  /* CTA button */
  const OrderBtn = ({ large = false }: { large?: boolean }) => (
    <button
      onClick={handleOrder}
      disabled={!size}
      className={`w-full font-black transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed
                  ${large ? "py-4 text-lg" : "py-3.5 text-base"}`}
      style={{
        background: size
          ? "linear-gradient(135deg, #bfff00 0%, #7ecf00 100%)"
          : "#111",
        color:     size ? "#000" : "#333",
        boxShadow: size ? "0 0 32px rgba(191,255,0,0.28), 0 4px 18px rgba(0,0,0,0.5)" : "none",
      }}
    >
      {size
        ? `${t("td_order_btn")} · ${effectivePrice} ${t("td_currency")}`
        : t("td_select_size_first")}
    </button>
  );

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-black" dir="rtl">

      {/* ══ TOP BAR ══ */}
      <div className="flex items-center justify-between px-4 md:px-5 py-3 shrink-0 z-20
                      border-b border-white/[0.05] bg-black/90 backdrop-blur-sm">
        <button
          onClick={() => setLocation("/teams")}
          className="flex items-center gap-1.5 text-sm text-white/35 hover:text-white transition-colors font-bold"
        >
          <span>→</span>
          <span className="hidden sm:inline">{t("nav_teams")}</span>
        </button>

        <div className="text-center">
          <span className="text-[10px] text-white/25 font-bold">{team.league} · {team.country}</span>
          <h1 className="text-sm md:text-base font-black text-white leading-tight">{team.name}</h1>
        </div>

        <div className="text-left">
          <div className="text-[9px] text-white/25 font-bold">{withCustomization ? t("td_price_label_with") : t("td_price_label_without")}</div>
          {discountPercent > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-white/25 line-through">{baseEffectivePrice}</span>
              <span className="text-[8px] font-black bg-red-500 text-white rounded px-1 leading-none py-0.5">-{discountPercent}%</span>
            </div>
          )}
          <div className="text-xl font-black text-[#bfff00] leading-tight">
            {effectivePrice}<span className="text-[10px] text-white/35 mr-0.5">{t("td_currency")}</span>
          </div>
        </div>
      </div>

      {/* ══ MAIN ══ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ══ CENTER — Jersey Viewer ══ */}
        <div className="flex-1 relative min-w-0 overflow-hidden bg-[#070707]">
          <JerseyPhotoViewer
            images={selectedColor?.images ?? (selectedColor ? [selectedColor.frontImageUrl] : [])}
            activeImageIndex={activeImageIndex}
            onImageIndexChange={setActiveImageIndex}
            name={name} number={number} fontId={fontId}
            colors={colors} withCustomization={withCustomization}
            teamId={team?.id}
          />
        </div>

        {/* ══ DESKTOP RIGHT PANEL ══ */}
        <motion.div
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 30, delay: 0.04 }}
          className="w-[268px] shrink-0 hidden md:flex flex-col bg-[#080808] border-r border-white/[0.05] z-10"
        >
          {/* Print toggle — pinned top */}
          <div className="px-4 py-3 border-b border-white/[0.05]">
            <PrintToggle />
          </div>

          {/* Scrollable sections */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/[0.06]">

            {/* Colors */}
            <div className="px-4 pt-4 pb-5 border-b border-white/[0.05]">
              <SectionLabel>{t("td_jersey_color")}</SectionLabel>
              <ColorSection />
            </div>

            {/* Name + Number */}
            <div className="px-4 pt-4 pb-4 border-b border-white/[0.05]">
              <SectionLabel>الطباعة</SectionLabel>
              <PrintSection />
              {!withCustomization && (
                <p className="text-[10px] text-white/25 mt-1">اضغط "مع طباعة" لإضافة الاسم والرقم</p>
              )}
            </div>

            {/* Size */}
            <div className="px-4 pt-4 pb-5">
              <SectionLabel>{t("td_tab_size")}</SectionLabel>
              <SizeSection />
            </div>

          </div>

          {/* CTA — pinned bottom */}
          <div className="px-4 py-3 border-t border-white/[0.05] bg-black/70">
            <OrderBtn large />
          </div>
        </motion.div>
      </div>

      {/* ══ MOBILE BOTTOM ══ */}
      <div className="md:hidden border-t border-white/[0.05] bg-[#070707] shrink-0 z-20">

        {/* Tab bar */}
        <div className="flex border-b border-white/[0.05]">
          {([
            { id: "colors" as MobileTab, label: t("td_tab_colors") },
            { id: "name"   as MobileTab, label: t("td_tab_name")   },
            { id: "size"   as MobileTab, label: t("td_tab_size")   },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              className={`flex-1 py-2.5 text-[11px] font-black transition-all ${
                mobileTab === tab.id
                  ? "text-[#bfff00] border-t-2 border-[#bfff00] bg-[#bfff00]/[0.04]"
                  : "text-white/25"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
          <AnimatePresence mode="wait">

            {mobileTab === "colors" && (
              <motion.div key="mc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3">
                <ColorSection compact />
              </motion.div>
            )}

            {mobileTab === "name" && (
              <motion.div key="mn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 space-y-2">
                <PrintToggle compact />
                <PrintSection compact />
                {!withCustomization && (
                  <p className="text-[9px] text-white/25 text-center">اضغط "مع طباعة" لإضافة اسمك ورقمك</p>
                )}
              </motion.div>
            )}

            {mobileTab === "size" && (
              <motion.div key="ms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3">
                <SizeSection compact />
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Mobile CTA */}
        <div className="px-3 py-2.5 border-t border-white/[0.05] space-y-2 bg-black/60">
          <OrderBtn />
        </div>
      </div>

    </div>
  );
}
