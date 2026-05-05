/**
 * JerseyPhotoViewer — Legendary 2D jersey viewer.
 *
 * Features:
 *  - Per-team font mapping (based on official manufacturer style)
 *  - Metallic heat-transfer print overlay
 *  - Shimmer sweep + animated team-color glow
 *  - Brand badge (ADIDAS / NIKE / PUMA …)
 */

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FONT_STYLES } from "./configurator-jersey";
import { ConfiguratorJersey } from "./configurator-jersey";

/* ─── Inject shimmer & glow CSS once ─────────────────────────────── */
function useJerseyCSS() {
  useEffect(() => {
    const id = "basmah-jersey-css";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @keyframes jersey-shimmer {
        0%   { transform: translateX(-140%) skewX(-18deg); opacity: 0; }
        12%  { opacity: 0.9; }
        88%  { opacity: 0.45; }
        100% { transform: translateX(240%) skewX(-18deg); opacity: 0; }
      }
      @keyframes glow-breathe {
        0%, 100% { opacity: 0.5;  transform: scale(0.97); }
        50%       { opacity: 1;   transform: scale(1.04); }
      }
      .jersey-card-shimmer::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          108deg,
          transparent 30%,
          rgba(255,255,255,0.14) 50%,
          transparent 70%
        );
        animation: jersey-shimmer 5s ease-in-out infinite;
        pointer-events: none;
        z-index: 10;
      }
      .jersey-glow-breathe {
        animation: glow-breathe 4s ease-in-out infinite;
      }
    `;
    document.head.appendChild(s);
  }, []);
}

/* ─── Per-team font + brand mapping ──────────────────────────────── */
export const TEAM_FONT_STYLE: Record<number, {
  fontId: string;
  nameSpacing: string;
  numSpacing: string;
  brand: string;
}> = {
  /* Jordanian clubs (Kelme / local) */
  1:  { fontId: "block",   nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "KELME" },
  2:  { fontId: "block",   nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "KELME" },
  3:  { fontId: "block",   nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "KELME" },
  4:  { fontId: "block",   nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "KELME" },
  5:  { fontId: "block",   nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "KELME" },
  6:  { fontId: "block",   nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "KELME" },
  7:  { fontId: "block",   nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "KELME" },
  8:  { fontId: "block",   nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "KELME" },
  /* European clubs */
  9:  { fontId: "slim",    nameSpacing: "0.04em", numSpacing: "-0.03em", brand: "ADIDAS" },  /* Real Madrid  */
  10: { fontId: "sport",   nameSpacing: "0.03em", numSpacing: "-0.02em", brand: "NIKE" },    /* Barcelona    */
  11: { fontId: "block",   nameSpacing: "0.04em", numSpacing: "-0.01em", brand: "NIKE" },    /* Liverpool    */
  12: { fontId: "slim",    nameSpacing: "0.00em", numSpacing: "-0.03em", brand: "JORDAN" },  /* PSG          */
  /* Arab national teams */
  13: { fontId: "slim",    nameSpacing: "0.03em", numSpacing: "-0.02em", brand: "PUMA" },    /* Morocco      */
  14: { fontId: "classic", nameSpacing: "0.04em", numSpacing: "-0.01em", brand: "ADIDAS" },  /* Saudi Arabia */
  15: { fontId: "slim",    nameSpacing: "0.02em", numSpacing: "-0.02em", brand: "KAPPA" },   /* Tunisia      */
  16: { fontId: "slim",    nameSpacing: "0.03em", numSpacing: "-0.02em", brand: "PUMA" },    /* Egypt        */
  17: { fontId: "classic", nameSpacing: "0.04em", numSpacing: "-0.01em", brand: "ADIDAS" },  /* Algeria      */
  18: { fontId: "block",   nameSpacing: "0.04em", numSpacing: "-0.01em", brand: "NIKE" },    /* Iraq         */
  /* World Cup nations */
  19: { fontId: "block",   nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "ADIDAS" },  /* Argentina    */
  20: { fontId: "sport",   nameSpacing: "0.03em", numSpacing: "-0.02em", brand: "NIKE" },    /* Brazil       */
  21: { fontId: "classic", nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "NIKE" },    /* France       */
  22: { fontId: "slim",    nameSpacing: "0.02em", numSpacing: "-0.03em", brand: "ADIDAS" },  /* Germany      */
  23: { fontId: "classic", nameSpacing: "0.04em", numSpacing: "-0.01em", brand: "ADIDAS" },  /* Spain        */
  24: { fontId: "sport",   nameSpacing: "0.03em", numSpacing: "-0.02em", brand: "PUMA" },    /* Portugal     */
  25: { fontId: "block",   nameSpacing: "0.04em", numSpacing: "-0.01em", brand: "NIKE" },    /* England      */
  26: { fontId: "sport",   nameSpacing: "0.03em", numSpacing: "-0.02em", brand: "NIKE" },    /* Netherlands  */
  27: { fontId: "block",   nameSpacing: "0.06em", numSpacing: "0.00em",  brand: "NIKE" },    /* Croatia      */
};

/* ─── Interfaces ─────────────────────────────────────────────────── */
interface JerseyColors {
  body: string; sleeves: string; collar: string; trim: string;
}

interface Props {
  frontImageUrl?: string | null;
  backImageUrl?:  string | null;
  name:              string;
  number:            string;
  fontId:            string;
  colors:            JerseyColors;
  withCustomization: boolean;
  view:              "front" | "back";
  onToggleView:      () => void;
  teamId?:           number;
}

interface OverlayProps {
  view:      "front" | "back";
  name:      string;
  number:    string;
  fontId:    string;
  trimColor: string;
  teamId?:   number;
}

/* ─── FIFA overlay — metallic heat-transfer print ────────────────── */
function FifaOverlay({ view, name, number, fontId, trimColor, teamId }: OverlayProps) {
  const teamStyle   = teamId ? TEAM_FONT_STYLE[teamId] : undefined;
  const activeFontId  = teamStyle?.fontId   ?? fontId;
  const nameSpacing = teamStyle?.nameSpacing ?? "0.06em";
  const numSpacing  = teamStyle?.numSpacing  ?? "-0.02em";

  const font     = FONT_STYLES.find(f => f.id === activeFontId) ?? FONT_STYLES[0];
  const isItalic = (font.style as Record<string, string>).fontStyle === "italic";

  /*
   * Professional heat-transfer print replication:
   *  1. 8-direction 1px stroke  (paint-order stroke equivalent in CSS)
   *  2. Depth layers            (mid + far shadows)
   *  3. Top-edge highlight      (metallic 3-D feel)
   */
  const s = "rgba(0,0,0,0.94)";

  const nameTextShadow = [
    `1px 0 0 ${s}`,  `-1px 0 0 ${s}`,
    `0 1px 0 ${s}`,   `0 -1px 0 ${s}`,
    `1px 1px 0 ${s}`, `-1px -1px 0 ${s}`,
    `1px -1px 0 ${s}`,`-1px 1px 0 ${s}`,
    `0 3px 8px rgba(0,0,0,0.65)`,
    `0 6px 18px rgba(0,0,0,0.3)`,
    `0 -1px 0 rgba(255,255,255,0.25)`,
  ].join(", ");

  const numTextShadow = [
    `2px 0 0 ${s}`,   `-2px 0 0 ${s}`,
    `0 2px 0 ${s}`,   `0 -2px 0 ${s}`,
    `2px 2px 0 ${s}`, `-2px -2px 0 ${s}`,
    `2px -2px 0 ${s}`,`-2px 2px 0 ${s}`,
    `0 6px 20px rgba(0,0,0,0.70)`,
    `0 12px 32px rgba(0,0,0,0.38)`,
    `0 -2px 0 rgba(255,255,255,0.20)`,
  ].join(", ");

  const base: React.CSSProperties = {
    fontFamily:    font.family,
    fontStyle:     isItalic ? "italic" : "normal",
    fontWeight:    900,
    color:         trimColor,
    lineHeight:    1,
    pointerEvents: "none",
    userSelect:    "none",
    whiteSpace:    "nowrap",
    textTransform: "uppercase",
  };

  if (view === "back") {
    return (
      <>
        {name && (
          <div style={{
            ...base,
            position:      "absolute",
            top:           "27%",
            left: 0, right: 0,
            textAlign:     "center",
            fontSize:      "7.5cqw",
            textShadow:    nameTextShadow,
            letterSpacing: nameSpacing,
          }}>
            {name.toUpperCase()}
          </div>
        )}
        {number && (
          <div style={{
            ...base,
            position:      "absolute",
            top:           name ? "34%" : "33%",
            left: 0, right: 0,
            textAlign:     "center",
            fontSize:      "30cqw",
            textShadow:    numTextShadow,
            letterSpacing: numSpacing,
          }}>
            {number}
          </div>
        )}
      </>
    );
  }

  return null;
}

/* ─── Main component ─────────────────────────────────────────────── */
export function JerseyPhotoViewer({
  frontImageUrl, backImageUrl, name, number, fontId,
  colors, withCustomization, view, onToggleView, teamId,
}: Props) {
  useJerseyCSS();

  const imgUrl  = view === "front" ? frontImageUrl : (backImageUrl ?? frontImageUrl);
  const hasImg  = !!imgUrl;
  const hasBack = !!backImageUrl;

  const displayName   = withCustomization ? name   : "";
  const displayNumber = withCustomization ? number : "";

  const teamStyle = teamId ? TEAM_FONT_STYLE[teamId] : undefined;
  const brand     = teamStyle?.brand;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center
                    bg-[#070707] overflow-hidden select-none">

      {/* ── Dot grid texture ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.028) 1px, transparent 1px)",
        backgroundSize:  "28px 28px",
      }} />

      {/* ── Animated ambient glow ── */}
      <div
        className="absolute inset-0 pointer-events-none jersey-glow-breathe"
        style={{
          background: `
            radial-gradient(ellipse 92% 78% at 50% 38%,
              ${colors.body}55 0%,
              ${colors.body}26 36%,
              ${colors.body}08 60%,
              transparent 76%)
          `,
          transition: "background 0.9s ease",
        }}
      />

      {/* ── Jersey card ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view + (imgUrl ?? "svg")}
          initial={{ opacity: 0, scale: 0.93, rotateY: view === "back" ? -16 : 16 }}
          animate={{ opacity: 1, scale: 1,    rotateY: 0 }}
          exit={{   opacity: 0, scale: 0.93, rotateY: view === "back" ? 16 : -16 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="relative jersey-card-shimmer"
          style={{
            containerType: "inline-size",
            width:    "min(80%, 400px)",
            aspectRatio: "5 / 6",
            filter:   "drop-shadow(0 36px 72px rgba(0,0,0,0.95))",
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.05),
              0 0 90px ${colors.body}30,
              0 0 180px ${colors.body}14
            `,
            borderRadius: "3px",
            overflow:     "hidden",
          }}
        >
          {hasImg ? (
            <>
              <img
                src={imgUrl!} alt={view}
                draggable={false}
                style={{
                  width: "100%", height: "100%",
                  objectFit: "contain", objectPosition: "center top",
                  display: "block",
                }}
              />
              {(displayName || displayNumber) && (
                <FifaOverlay
                  view={view}
                  name={displayName}
                  number={displayNumber}
                  fontId={fontId}
                  trimColor={colors.trim}
                  teamId={teamId}
                />
              )}
            </>
          ) : (
            <div style={{ width: "100%", height: "100%" }}>
              <ConfiguratorJersey
                colors={colors}
                name={displayName || "BASMAH"}
                number={displayNumber || "10"}
                view={view}
                fontId={fontId}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Flip button ── */}
      {(hasBack || !hasImg) && (
        <button
          onClick={onToggleView}
          className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2
                     px-5 py-2.5 rounded-full text-xs font-black transition-all
                     duration-200 active:scale-95 hover:scale-105"
          style={{
            background:     `linear-gradient(135deg, ${colors.body}22, ${colors.body}0a)`,
            border:         `1px solid ${colors.body}58`,
            color:          "rgba(255,255,255,0.80)",
            backdropFilter: "blur(12px)",
            boxShadow:      `0 0 24px ${colors.body}22, 0 4px 20px rgba(0,0,0,0.45)`,
            letterSpacing:  "0.5px",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
          {view === "front" ? "عرض الخلف" : "عرض الأمام"}
        </button>
      )}

      {/* ── View badge (bottom-left pill) ── */}
      <div className="absolute top-3 left-3 pointer-events-none" style={{
        background:     "rgba(0,0,0,0.65)",
        border:         "1px solid rgba(255,255,255,0.09)",
        borderRadius:   20,
        padding:        "3px 11px",
        fontSize:       9,
        fontWeight:     900,
        color:          "rgba(255,255,255,0.42)",
        backdropFilter: "blur(10px)",
        letterSpacing:  "1.5px",
      }}>
        {view === "front" ? "FRONT" : "BACK"}
      </div>

      {/* ── Brand badge (top-right) ── */}
      {brand ? (
        <div className="absolute top-3 right-3 pointer-events-none" style={{
          background:     `${colors.body}1a`,
          border:         `1px solid ${colors.body}4a`,
          borderRadius:   20,
          padding:        "3px 11px",
          fontSize:       9,
          fontWeight:     900,
          color:          colors.trim,
          backdropFilter: "blur(10px)",
          letterSpacing:  "1.5px",
          opacity:        0.9,
        }}>
          {brand}
        </div>
      ) : withCustomization && (displayName || displayNumber) ? (
        <div className="absolute top-3 right-3 pointer-events-none" style={{
          background:     "rgba(191,255,0,0.07)",
          border:         "1px solid rgba(191,255,0,0.22)",
          borderRadius:   20,
          padding:        "3px 9px",
          fontSize:       9,
          fontWeight:     900,
          color:          "rgba(191,255,0,0.52)",
          backdropFilter: "blur(10px)",
          letterSpacing:  "1px",
        }}>
          FIFA STD
        </div>
      ) : null}
    </div>
  );
}
