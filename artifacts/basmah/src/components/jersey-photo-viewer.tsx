/**
 * JerseyPhotoViewer — "Studio Hold" v4  (multi-image gallery)
 *
 * Innovations:
 *  1. Mouse-tracking 3D tilt  — jersey reacts like a physical object in your hands
 *  2. Polyester specular sheen — studio light reflects off synthetic fabric (follows mouse)
 *  3. True 3D card flip       — rotateY animation when switching images
 *  4. Studio environment      — overhead cove light, depth shadow, floor echo
 *  5. Edge-catching light     — top & side rim lit by studio overhead
 *  6. Fabric grain texture    — SVG noise gives textile depth
 *  7. Raised heat-transfer    — name/number with physical emboss depth
 *  8. Auto official font      — per-team mapping, no picker needed
 *  9. Multi-image gallery     — dot nav, any number of images per color
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FONT_STYLES } from "./configurator-jersey";
import { ConfiguratorJersey } from "./configurator-jersey";

/* ─── CSS ─────────────────────────────────────────────────────────── */
function useJerseyCSS() {
  useEffect(() => {
    const id = "basmah-jersey-v4";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @keyframes jersey-shimmer {
        0%   { transform: translateX(-160%) skewX(-20deg); opacity: 0; }
        8%   { opacity: 1; }
        92%  { opacity: 0.45; }
        100% { transform: translateX(260%) skewX(-20deg); opacity: 0; }
      }
      @keyframes glow-breathe {
        0%, 100% { opacity: 0.40; transform: scale(0.95); }
        50%      { opacity: 0.90; transform: scale(1.07); }
      }
      .jersey-shimmer-line::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          103deg,
          transparent 26%,
          rgba(255,255,255,0.11) 50%,
          transparent 74%
        );
        animation: jersey-shimmer 6.5s ease-in-out infinite;
        pointer-events: none;
        z-index: 12;
        border-radius: inherit;
      }
      .jersey-glow { animation: glow-breathe 5s ease-in-out infinite; }
      .jersey-3d-card {
        transform-style: preserve-3d;
        will-change: transform;
      }
      .jersey-3d-card.tracking {
        transition: transform 0.07s linear, box-shadow 0.07s linear;
      }
      .jersey-3d-card.settling {
        transition: transform 0.65s cubic-bezier(0.34, 1.42, 0.64, 1),
                    box-shadow 0.55s ease;
      }
    `;
    document.head.appendChild(s);
  }, []);
}

/* ─── Per-team official font + brand ─────────────────────────────── */
export const TEAM_FONT_STYLE: Record<number, {
  fontId: string;
  nameSpacing: string;
  numSpacing: string;
  brand: string;
}> = {
  /* Jordanian clubs */
  1:  { fontId: "block",   nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "KELME" },
  2:  { fontId: "block",   nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "KELME" },
  3:  { fontId: "block",   nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "KELME" },
  4:  { fontId: "block",   nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "KELME" },
  5:  { fontId: "block",   nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "KELME" },
  6:  { fontId: "block",   nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "KELME" },
  7:  { fontId: "block",   nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "KELME" },
  8:  { fontId: "block",   nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "KELME" },
  /* European clubs */
  9:  { fontId: "slim",    nameSpacing: "0.04em", numSpacing: "-0.03em", brand: "ADIDAS" },
  10: { fontId: "sport",   nameSpacing: "0.03em", numSpacing: "-0.02em", brand: "NIKE"   },
  11: { fontId: "block",   nameSpacing: "0.04em", numSpacing: "-0.01em", brand: "NIKE"   },
  12: { fontId: "slim",    nameSpacing: "0.00em", numSpacing: "-0.03em", brand: "JORDAN" },
  /* Arab national teams */
  13: { fontId: "slim",    nameSpacing: "0.03em", numSpacing: "-0.02em", brand: "PUMA"   },
  14: { fontId: "classic", nameSpacing: "0.04em", numSpacing: "-0.01em", brand: "ADIDAS" },
  15: { fontId: "slim",    nameSpacing: "0.02em", numSpacing: "-0.02em", brand: "KAPPA"  },
  16: { fontId: "slim",    nameSpacing: "0.03em", numSpacing: "-0.02em", brand: "PUMA"   },
  17: { fontId: "classic", nameSpacing: "0.04em", numSpacing: "-0.01em", brand: "ADIDAS" },
  18: { fontId: "block",   nameSpacing: "0.04em", numSpacing: "-0.01em", brand: "NIKE"   },
  /* World Cup nations */
  19: { fontId: "block",   nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "ADIDAS" },
  20: { fontId: "sport",   nameSpacing: "0.03em", numSpacing: "-0.02em", brand: "NIKE"   },
  21: { fontId: "classic", nameSpacing: "0.05em", numSpacing: "-0.01em", brand: "NIKE"   },
  22: { fontId: "slim",    nameSpacing: "0.02em", numSpacing: "-0.03em", brand: "ADIDAS" },
  23: { fontId: "classic", nameSpacing: "0.04em", numSpacing: "-0.01em", brand: "ADIDAS" },
  24: { fontId: "sport",   nameSpacing: "0.03em", numSpacing: "-0.02em", brand: "PUMA"   },
  25: { fontId: "block",   nameSpacing: "0.04em", numSpacing: "-0.01em", brand: "NIKE"   },
  26: { fontId: "sport",   nameSpacing: "0.03em", numSpacing: "-0.02em", brand: "NIKE"   },
  27: { fontId: "block",   nameSpacing: "0.06em", numSpacing: "0.00em",  brand: "NIKE"   },
};

/* ─── Types ──────────────────────────────────────────────────────── */
interface JerseyColors {
  body: string; sleeves: string; collar: string; trim: string;
}

interface Props {
  images:              string[];   /* all image URLs in display order */
  activeImageIndex:    number;
  onImageIndexChange:  (i: number) => void;
  name:                string;
  number:              string;
  fontId:              string;
  colors:              JerseyColors;
  withCustomization:   boolean;
  teamId?:             number;
  customImageUrl?:     string;
}

/* ─── Raised heat-transfer print overlay ─────────────────────────── */
function FifaOverlay({ isBack, name, number, fontId, trimColor, teamId }: {
  isBack: boolean; name: string; number: string;
  fontId: string; trimColor: string; teamId?: number;
}) {
  if (!isBack) return null;

  const ts = teamId ? TEAM_FONT_STYLE[teamId] : undefined;
  const fid  = ts?.fontId   ?? fontId;
  const nameSpacing = ts?.nameSpacing ?? "0.06em";
  const numSpacing  = ts?.numSpacing  ?? "-0.02em";
  const font     = FONT_STYLES.find(f => f.id === fid) ?? FONT_STYLES[0];
  const isItalic = (font.style as Record<string, string>).fontStyle === "italic";

  const s = "rgba(0,0,0,0.95)";
  const nameTextShadow = [
    `1px 0 0 ${s}`,  `-1px 0 0 ${s}`,
    `0 1px 0 ${s}`,   `0 -1px 0 ${s}`,
    `1px 1px 0 ${s}`, `-1px -1px 0 ${s}`,
    `1px -1px 0 ${s}`,`-1px 1px 0 ${s}`,
    `0 2px 0 rgba(0,0,0,0.7)`,
    `0 4px 10px rgba(0,0,0,0.60)`,
    `0 8px 24px rgba(0,0,0,0.28)`,
    `0 -1px 0 rgba(255,255,255,0.28)`,
  ].join(", ");

  const numTextShadow = [
    `2px 0 0 ${s}`,   `-2px 0 0 ${s}`,
    `0 2px 0 ${s}`,   `0 -2px 0 ${s}`,
    `2px 2px 0 ${s}`, `-2px -2px 0 ${s}`,
    `2px -2px 0 ${s}`,`-2px 2px 0 ${s}`,
    `0 4px 0 rgba(0,0,0,0.6)`,
    `0 8px 24px rgba(0,0,0,0.65)`,
    `0 16px 44px rgba(0,0,0,0.32)`,
    `0 -2px 0 rgba(255,255,255,0.22)`,
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

/* ─── Main component ─────────────────────────────────────────────── */
export function JerseyPhotoViewer({
  images, activeImageIndex, onImageIndexChange,
  name, number, fontId, colors, withCustomization, teamId, customImageUrl,
}: Props) {
  useJerseyCSS();

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef      = useRef<HTMLDivElement>(null);
  const [tilt,     setTilt]     = useState({ x: 0, y: 0 });
  const [specular, setSpecular] = useState({ x: 42, y: 32 });
  const [hovering, setHovering] = useState(false);

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const r  = el.getBoundingClientRect();
    const dx = (e.clientX - r.left)  / r.width  - 0.5;
    const dy = (e.clientY - r.top)   / r.height - 0.5;
    setTilt({ x: dy * -20, y: dx * 24 });
    const card = cardRef.current;
    if (card) {
      const cr = card.getBoundingClientRect();
      setSpecular({
        x: Math.max(0, Math.min(100, (e.clientX - cr.left) / cr.width  * 100)),
        y: Math.max(0, Math.min(100, (e.clientY - cr.top)  / cr.height * 100)),
      });
    }
  }, []);

  const onLeave = useCallback(() => {
    setHovering(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  const safeIndex    = Math.max(0, Math.min(activeImageIndex, images.length - 1));
  const imgUrl       = images[safeIndex] ?? null;
  const hasImg       = !!imgUrl;
  const isBack       = safeIndex > 0;              /* index 0 = front, rest = show overlay */
  const displayName  = withCustomization ? name   : "";
  const displayNum   = withCustomization ? number : "";
  const teamStyle    = teamId ? TEAM_FONT_STYLE[teamId] : undefined;
  const brand        = teamStyle?.brand;

  const shadowX    = hovering ? -tilt.y * 3.2 : 0;
  const shadowY    = hovering ? 44 + tilt.x * 2.0 : 32;
  const shadowBlur = hovering ? 96 : 62;
  const glowR      = hovering ? 140 : 82;

  /* swipe support */
  const touchStartX = useRef<number | null>(null);
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 40) return;
    if (dx < 0 && safeIndex < images.length - 1) onImageIndexChange(safeIndex + 1);
    if (dx > 0 && safeIndex > 0) onImageIndexChange(safeIndex - 1);
    touchStartX.current = null;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-center bg-[#050505] overflow-hidden select-none"
      onMouseMove={onMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={onLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >

      {/* ── Studio overhead cove ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 70% 38% at 50% 0%,
          rgba(255,255,255,0.028) 0%,
          transparent 100%)`,
      }} />

      {/* ── Dot grid texture ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.022) 1px, transparent 1px)",
        backgroundSize:  "26px 26px",
      }} />

      {/* ── Team-color ambient glow ── */}
      <div className="absolute inset-0 pointer-events-none jersey-glow" style={{
        background: `radial-gradient(ellipse 92% 76% at 50% 42%,
          ${colors.body}55 0%,
          ${colors.body}26 38%,
          ${colors.body}09 64%,
          transparent 82%)`,
        transition: "background 1s ease",
      }} />

      {/* ── Floor echo ── */}
      <div className="absolute pointer-events-none" style={{
        bottom: "3%",
        left: "50%",
        transform: `translateX(-50%)`,
        width: "min(68%, 310px)",
        height: "50px",
        background: `radial-gradient(ellipse 100% 100% at 50% 50%, ${colors.body}44 0%, transparent 70%)`,
        filter: `blur(${hovering ? 20 : 28}px)`,
        opacity: hovering ? 0.65 : 0.38,
        transition: "opacity 0.45s ease, filter 0.45s ease",
      }} />

      {/* ════════════════════════════════════════
          3D JERSEY CARD
      ════════════════════════════════════════ */}
      <div
        ref={cardRef}
        className={`relative jersey-3d-card jersey-shimmer-line ${hovering ? "tracking" : "settling"}`}
        style={{
          containerType: "inline-size",
          width:         "min(80%, 400px)",
          aspectRatio:   "5 / 6",
          transform:     hovering
            ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.028) translateZ(20px)`
            : `perspective(900px) rotateX(0deg) rotateY(0deg) scale(1) translateZ(0px)`,
          borderRadius:  "4px",
          overflow:      "hidden",
          boxShadow: [
            `${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0,0,0,${hovering ? 0.96 : 0.88})`,
            `0 0 0 1px rgba(255,255,255,0.046)`,
            `0 0 ${glowR}px ${colors.body}${hovering ? "3c" : "1e"}`,
            `inset 0 1px 0 rgba(255,255,255,0.07)`,
          ].join(", "),
        }}
      >
        {/* ── Jersey image (flip animation between images) ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={safeIndex + (imgUrl ?? "svg")}
            initial={{ opacity: 0, rotateY: 88, scale: 0.95 }}
            animate={{ opacity: 1, rotateY: 0,  scale: 1 }}
            exit={{   opacity: 0, rotateY: -88, scale: 0.95 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              transformStyle: "preserve-3d",
            }}
          >
            {hasImg ? (
              <>
                <img
                  src={imgUrl} alt="" draggable={false}
                  style={{
                    width: "100%", height: "100%",
                    objectFit: "contain", objectPosition: "center top",
                    display: "block",
                  }}
                />
                {(displayName || displayNum) && (
                  <FifaOverlay
                    isBack={isBack}
                    name={displayName} number={displayNum}
                    fontId={fontId} trimColor={colors.trim} teamId={teamId}
                  />
                )}
              </>
            ) : (
              <div style={{ width: "100%", height: "100%" }}>
                <ConfiguratorJersey
                  colors={colors}
                  name={displayName || "BASMAH"}
                  number={displayNum || "10"}
                  view="front" fontId={fontId}
                  customImageUrl={customImageUrl}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Polyester specular sheen ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: hovering
              ? `radial-gradient(circle 200px at ${specular.x}% ${specular.y}%,
                  rgba(255,255,255,0.24) 0%,
                  rgba(255,255,255,0.10) 36%,
                  rgba(255,255,255,0.02) 60%,
                  transparent 72%)`
              : "transparent",
            mixBlendMode: "overlay",
            zIndex:       14,
            transition:   hovering ? "none" : "background 0.6s ease",
          }}
        />

        {/* ── Fabric grain ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.055'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            mixBlendMode:     "overlay",
            opacity:          0.60,
            zIndex:           6,
          }}
        />

        {/* ── Top-edge light catch ── */}
        <div className="absolute inset-x-0 top-0 pointer-events-none" style={{
          height: "1.5px",
          background: `linear-gradient(90deg,
            transparent 4%,
            rgba(255,255,255,${hovering ? 0.60 : 0.20}) 32%,
            rgba(255,255,255,${hovering ? 0.72 : 0.26}) 50%,
            rgba(255,255,255,${hovering ? 0.60 : 0.20}) 68%,
            transparent 96%)`,
          transition: "background 0.25s ease",
          zIndex: 20,
        }} />

        {/* ── Left-edge light catch ── */}
        <div className="absolute inset-y-0 left-0 pointer-events-none" style={{
          width: "1.5px",
          background: `linear-gradient(to bottom,
            transparent 4%,
            rgba(255,255,255,${hovering ? 0.28 : 0.09}) 28%,
            rgba(255,255,255,${hovering ? 0.16 : 0.05}) 60%,
            transparent 85%)`,
          transition: "background 0.25s ease",
          zIndex: 20,
        }} />

      </div>
      {/* ════════════════════════════════════════ */}

      {/* ── Image dots / prev-next ── */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30">
          {/* prev */}
          <button
            onClick={() => safeIndex > 0 && onImageIndexChange(safeIndex - 1)}
            disabled={safeIndex === 0}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-20"
            style={{
              background:     "rgba(0,0,0,0.55)",
              border:         "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
              color:          "rgba(255,255,255,0.75)",
            }}
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M6 1.5 L3 4.5 L6 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* dots */}
          <div className="flex items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => onImageIndexChange(i)}
                className="transition-all duration-200 rounded-full"
                style={{
                  width:   i === safeIndex ? 18 : 6,
                  height:  6,
                  background: i === safeIndex
                    ? "hsl(var(--primary))"
                    : "rgba(255,255,255,0.25)",
                  boxShadow: i === safeIndex ? "0 0 8px rgba(212, 175, 85,0.6)" : "none",
                }}
              />
            ))}
          </div>

          {/* next */}
          <button
            onClick={() => safeIndex < images.length - 1 && onImageIndexChange(safeIndex + 1)}
            disabled={safeIndex === images.length - 1}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-20"
            style={{
              background:     "rgba(0,0,0,0.55)",
              border:         "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
              color:          "rgba(255,255,255,0.75)",
            }}
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M3 1.5 L6 4.5 L3 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── Brand badge ── */}
      {brand && (
        <div className="absolute top-3 right-3 pointer-events-none" style={{
          background:     `${colors.body}1c`,
          border:         `1px solid ${colors.body}46`,
          borderRadius:   20,
          padding:        "3px 11px",
          fontSize:       9,
          fontWeight:     900,
          color:          colors.trim,
          backdropFilter: "blur(12px)",
          letterSpacing:  "1.5px",
          opacity:        0.88,
        }}>
          {brand}
        </div>
      )}

    </div>
  );
}
