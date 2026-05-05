/**
 * JerseyPhotoViewer — 2D only viewer with FIFA-standard name/number sizing.
 *
 * FIFA Equipment Regulations (adult kit):
 *   Back  number : min 20 cm  ≈ 29% of jersey body height
 *   Player name  : min  5 cm  ≈  7% of jersey body height   (directly above number)
 *   Front number : min 10 cm  ≈ 14% of jersey body height
 *
 * The jersey photo image has an approx aspect ratio of 5:6 (width:height).
 * All font-sizes are expressed in % of the image's own width so they scale
 * correctly at any container size.
 *   image width W → jersey body ≈ 0.85 W wide, 1.0 W tall
 *   back-number  20 cm / (jersey-body-height ≈ 1.05 W) → 19% W  → ~19cqw  ← use %
 *   player-name   5 cm / 1.05 W                         →  4.8% W
 *   front-number 10 cm / 1.05 W                         →  9.5% W
 */

import { motion, AnimatePresence } from "framer-motion";
import { FONT_STYLES } from "./configurator-jersey";
import { ConfiguratorJersey } from "./configurator-jersey";

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
}

/* ─── FIFA text overlay ─────────────────────────────────────────── */

interface OverlayProps {
  view:      "front" | "back";
  name:      string;
  number:    string;
  fontId:    string;
  trimColor: string;
}

/**
 * Renders name + number at FIFA-prescribed proportions.
 *
 * The outer div (position:relative, padding-bottom:120%) acts as the sizing
 * reference. All measurements are in % of *that* element's width.
 *
 * Back positions (from top of the container, which roughly aligns with
 * the top of the jersey neckline):
 *   name   center  : 38 %
 *   number center  : 54 %
 *
 * Front position:
 *   number center  : 46 %   (slightly left-of-center for chest placement)
 */
function FifaOverlay({ view, name, number, fontId, trimColor }: OverlayProps) {
  const font    = FONT_STYLES.find(f => f.id === fontId) ?? FONT_STYLES[0];
  const isItalic = (font.style as Record<string,string>).fontStyle === "italic";

  /* Shadow stack that always pops against any jersey colour */
  const shadow = (size: number) =>
    `0 0 ${size * 0.08}px rgba(0,0,0,1),`
    + `0 0 ${size * 0.22}px rgba(0,0,0,0.95),`
    + `0 ${size * 0.04}px ${size * 0.12}px rgba(0,0,0,0.9)`;

  /* ── BACK ── */
  if (view === "back") {
    return (
      <>
        {/* Player name — FIFA min 5 cm → 6.5% of image width */}
        {name && (
          <div style={{
            position:    "absolute",
            top:         "32%",
            left:        "50%",
            transform:   "translateX(-50%)",
            fontFamily:  `"${font.family}", Impact, Arial Black, sans-serif`,
            fontStyle:   isItalic ? "italic" : "normal",
            fontWeight:  900,
            /* 5 cm on a jersey ≈ 6.5% of image width */
            fontSize:    "6.5cqw",
            color:       trimColor,
            textShadow:  shadow(32),
            letterSpacing: "0.18em",
            whiteSpace:  "nowrap",
            textTransform: "uppercase",
            lineHeight:  1,
            pointerEvents: "none",
            userSelect:  "none",
          }}>
            {name.toUpperCase()}
          </div>
        )}

        {/* Squad number — FIFA min 20 cm → 24% of image width */}
        {number && (
          <div style={{
            position:    "absolute",
            top:         "42%",
            left:        "50%",
            transform:   "translateX(-50%)",
            fontFamily:  `"${font.family}", Impact, Arial Black, sans-serif`,
            fontStyle:   isItalic ? "italic" : "normal",
            fontWeight:  900,
            /* 20 cm on a jersey ≈ 24% of image width */
            fontSize:    "24cqw",
            color:       trimColor,
            textShadow:  shadow(120),
            letterSpacing: "-0.04em",
            lineHeight:  1,
            pointerEvents: "none",
            userSelect:  "none",
          }}>
            {number}
          </div>
        )}
      </>
    );
  }

  /* ── FRONT ── */
  /* Squad number only — FIFA min 10 cm → 12% of image width */
  return (
    <>
      {number && (
        <div style={{
          position:    "absolute",
          top:         "43%",
          left:        "50%",
          transform:   "translateX(-50%)",
          fontFamily:  `"${font.family}", Impact, Arial Black, sans-serif`,
          fontStyle:   isItalic ? "italic" : "normal",
          fontWeight:  900,
          /* 10 cm on a jersey ≈ 12% of image width */
          fontSize:    "12cqw",
          color:       trimColor,
          textShadow:  shadow(60),
          letterSpacing: "-0.03em",
          lineHeight:  1,
          pointerEvents: "none",
          userSelect:  "none",
        }}>
          {number}
        </div>
      )}
    </>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export function JerseyPhotoViewer({
  frontImageUrl, backImageUrl, name, number, fontId,
  colors, withCustomization, view, onToggleView,
}: Props) {
  const imgUrl  = view === "front"
    ? frontImageUrl
    : (backImageUrl ?? frontImageUrl);
  const hasImg  = !!imgUrl;
  const hasBack = !!backImageUrl;

  const displayName   = withCustomization ? name   : "";
  const displayNumber = withCustomization ? number : "";

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center
                    bg-[#080808] overflow-hidden select-none">

      {/* Ambient glow behind jersey */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 65% 55% at 50% 42%,
          ${colors.body}28 0%, transparent 68%)`,
        transition: "background 0.8s ease",
      }} />

      {/* ── Jersey card ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view + (imgUrl ?? "svg")}
          initial={{ opacity: 0, scale: 0.96, rotateY: view === "back" ? -12 : 12 }}
          animate={{ opacity: 1, scale: 1,    rotateY: 0 }}
          exit={{   opacity: 0, scale: 0.96, rotateY: view === "back" ? 12 : -12 }}
          transition={{ duration: 0.26, ease: "easeOut" }}
          className="relative"
          style={{
            /* container query context so cqw units work */
            containerType: "inline-size",
            width:    "min(74%, 360px)",
            /* keep proportional — jersey photos are roughly 5:6 */
            aspectRatio: "5 / 6",
            filter: "drop-shadow(0 28px 52px rgba(0,0,0,0.88))",
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

              {/* FIFA-compliant overlay */}
              {(displayName || displayNumber) && (
                <FifaOverlay
                  view={view}
                  name={displayName}
                  number={displayNumber}
                  fontId={fontId}
                  trimColor={colors.trim}
                />
              )}
            </>
          ) : (
            /* No photo uploaded — fallback to SVG jersey */
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
                     duration-200 active:scale-95"
          style={{
            background:     "rgba(255,255,255,0.05)",
            border:         "1px solid rgba(255,255,255,0.13)",
            color:          "rgba(255,255,255,0.55)",
            backdropFilter: "blur(8px)",
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

      {/* View badge */}
      <div className="absolute top-3 left-3 pointer-events-none" style={{
        background:     "rgba(0,0,0,0.5)",
        border:         "1px solid rgba(255,255,255,0.08)",
        borderRadius:   6,
        padding:        "2px 8px",
        fontSize:       10,
        fontWeight:     800,
        color:          "rgba(255,255,255,0.35)",
        backdropFilter: "blur(6px)",
        letterSpacing:  "1px",
      }}>
        {view === "front" ? "FRONT" : "BACK"}
      </div>

      {/* FIFA sizing note — subtle badge */}
      {withCustomization && (displayName || displayNumber) && (
        <div className="absolute top-3 right-3 pointer-events-none" style={{
          background:     "rgba(191,255,0,0.07)",
          border:         "1px solid rgba(191,255,0,0.18)",
          borderRadius:   6,
          padding:        "2px 7px",
          fontSize:       9,
          fontWeight:     800,
          color:          "rgba(191,255,0,0.45)",
          backdropFilter: "blur(6px)",
          letterSpacing:  "0.5px",
        }}>
          FIFA STD
        </div>
      )}
    </div>
  );
}
