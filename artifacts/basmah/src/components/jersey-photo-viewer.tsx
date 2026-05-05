import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfiguratorJersey, FONT_STYLES } from "./configurator-jersey";

interface JerseyColors {
  body: string; sleeves: string; collar: string; trim: string;
}

interface Props {
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  name: string;
  number: string;
  fontId: string;
  colors: JerseyColors;
  withCustomization: boolean;
  view: "front" | "back";
  onToggleView: () => void;
}

export function JerseyPhotoViewer({
  frontImageUrl, backImageUrl, name, number, fontId,
  colors, withCustomization, view, onToggleView,
}: Props) {
  const font   = FONT_STYLES.find(f => f.id === fontId) ?? FONT_STYLES[0];
  const imgUrl = view === "front" ? frontImageUrl : (backImageUrl ?? frontImageUrl);
  const hasImg = !!imgUrl;
  const hasBack = !!backImageUrl;

  const displayName   = withCustomization ? name   : "";
  const displayNumber = withCustomization ? number : "";

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#080808] overflow-hidden select-none">

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 42%, rgba(191,255,0,0.055) 0%, transparent 70%)" }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 50% 40% at 50% 75%, rgba(0,0,0,0.6) 0%, transparent 70%)" }} />

      {/* Jersey card */}
      <AnimatePresence mode="wait">
        <motion.div key={view + (imgUrl ?? "svg")}
          initial={{ opacity: 0, scale: 0.96, rotateY: view === "back" ? -15 : 15 }}
          animate={{ opacity: 1, scale: 1,    rotateY: 0 }}
          exit={{   opacity: 0, scale: 0.96, rotateY: view === "back" ? 15 : -15 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="relative flex items-center justify-center"
          style={{ width: "min(70%, 340px)", maxHeight: "85%" }}>

          {hasImg ? (
            /* ── Photo mode ── */
            <div className="relative w-full"
              style={{ paddingBottom: "118%" /* maintain jersey aspect */ }}>

              {/* Jersey photo */}
              <img
                src={imgUrl!}
                alt={view === "front" ? "front" : "back"}
                className="absolute inset-0 w-full h-full object-contain"
                style={{ filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.85))" }}
                draggable={false}
              />

              {/* Name overlay */}
              {displayName && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ paddingTop: "38%", paddingBottom: "42%" }}>
                  <span style={{
                    fontFamily: font.family,
                    fontStyle: (font.style as Record<string,string>).fontStyle ?? "normal",
                    letterSpacing: (font.style as Record<string,string>).letterSpacing ?? "3px",
                    fontSize: "clamp(11px, 3.2vw, 22px)",
                    fontWeight: 900,
                    color: colors.trim,
                    textShadow: "0 2px 12px rgba(0,0,0,0.95), 0 0px 3px rgba(0,0,0,1)",
                    whiteSpace: "nowrap",
                    textTransform: "uppercase",
                  }}>
                    {displayName}
                  </span>
                </div>
              )}

              {/* Number overlay */}
              {displayNumber && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ paddingTop: "50%", paddingBottom: "18%" }}>
                  <span style={{
                    fontFamily: font.family,
                    fontStyle: (font.style as Record<string,string>).fontStyle ?? "normal",
                    fontSize: "clamp(40px, 14vw, 96px)",
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: "-3px",
                    color: colors.trim,
                    textShadow: "0 4px 20px rgba(0,0,0,0.98), 0 0 4px rgba(0,0,0,1)",
                  }}>
                    {displayNumber}
                  </span>
                </div>
              )}
            </div>

          ) : (
            /* ── SVG fallback mode ── */
            <div style={{ width: "100%", aspectRatio: "5/6" }}>
              <ConfiguratorJersey
                colors={colors}
                name={displayName}
                number={displayNumber}
                view={view}
                fontId={fontId}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Front / Back flip button */}
      {(hasBack || !hasImg) && (
        <button
          onClick={onToggleView}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2
                     rounded-full text-xs font-black transition-all duration-200 active:scale-95"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(8px)",
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
          {view === "front" ? "عرض الخلف" : "عرض الأمام"}
        </button>
      )}

      {/* View badge */}
      <div className="absolute top-3 left-3"
        style={{
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6, padding: "2px 8px",
          fontSize: 10, fontWeight: 800,
          color: "rgba(255,255,255,0.35)",
          backdropFilter: "blur(6px)",
          letterSpacing: "1px",
        }}>
        {view === "front" ? "FRONT" : "BACK"}
      </div>

      {/* Color dot */}
      {hasImg && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full"
          style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: colors.body }} />
          <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: colors.trim }} />
        </div>
      )}
    </div>
  );
}
