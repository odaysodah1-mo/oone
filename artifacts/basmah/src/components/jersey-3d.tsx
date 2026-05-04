import { useEffect, useRef, useState, useCallback } from "react";

/* ─── SVG Jersey Face ─────────────────────────────────────────── */
function JerseySvgFace({
  color, secondaryColor, name, number, side = "front",
}: {
  color: string; secondaryColor: string; name: string; number: string; side?: "front" | "back";
}) {
  const id = (color + secondaryColor + side).replace(/[^a-z0-9]/gi, "");
  return (
    <svg viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id={`g1-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.78" />
        </linearGradient>
        <linearGradient id={`shine-${id}`} x1="0%" y1="0%" x2="35%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`drop-${id}`}>
          <feDropShadow dx="0" dy="10" stdDeviation="16" floodOpacity="0.55" />
        </filter>
        <linearGradient id={`slL-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.68" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`slR-${id}`} x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.68" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <g filter={`url(#drop-${id})`}>
        <path d="M118 62 L22 168 L70 202 L128 136Z" fill={`url(#slL-${id})`} />
        <path d="M118 62 L22 168 L36 180 L128 76Z" fill={secondaryColor} opacity="0.6" />
        <path d="M282 62 L378 168 L330 202 L272 136Z" fill={`url(#slR-${id})`} />
        <path d="M282 62 L378 168 L364 180 L272 76Z" fill={secondaryColor} opacity="0.6" />
        <path d="M118 62 C158 84 242 84 282 62 L308 126 L302 148 L302 448 C262 460 138 460 98 448 L98 148 L92 126Z" fill={`url(#g1-${id})`} />
        <path d="M142 63 C172 82 228 82 262 65 L268 116 L138 112Z" fill={`url(#shine-${id})`} />
        <rect x="98" y="162" width="204" height="7" fill={secondaryColor} opacity="0.25" rx="1" />
        <path d="M156 62 C174 98 200 110 226 98 C241 90 250 74 252 62 C232 52 168 52 156 62Z" fill={secondaryColor} opacity="0.82" />
        <path d="M168 63 C182 92 200 102 218 92 C228 86 234 74 236 64 C220 56 180 56 168 63Z" fill={color} />
      </g>
      {side === "front" ? (
        <>
          <text x="200" y="228" fontSize="32" fontWeight="900" fill={secondaryColor} textAnchor="middle" letterSpacing="3" fontFamily="system-ui,Arial,sans-serif" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>{name.toUpperCase()}</text>
          <text x="200" y="390" fontSize="155" fontWeight="900" fill={secondaryColor} textAnchor="middle" fontFamily="system-ui,Arial,sans-serif" style={{ letterSpacing: "-6px", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.6))" }}>{number}</text>
        </>
      ) : (
        <text x="200" y="370" fontSize="155" fontWeight="900" fill={secondaryColor} textAnchor="middle" fontFamily="system-ui,Arial,sans-serif" style={{ letterSpacing: "-6px", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.6))" }}>{number}</text>
      )}
    </svg>
  );
}

/* ─── Photo Face ──────────────────────────────────────────────── */
function PhotoFace({
  imageUrl, name, number, secondaryColor, side = "front", isBackPhoto = false,
}: {
  imageUrl: string; name: string; number: string; secondaryColor: string;
  side?: "front" | "back"; isBackPhoto?: boolean;
}) {
  const textColor = secondaryColor === "#ffffff" || secondaryColor === "#fff" ? "#cc0000" : secondaryColor;
  const showText = !isBackPhoto; // don't overlay text if it's the real back photo (has number already)

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <img
        src={imageUrl}
        alt={side === "front" ? "front jersey" : "back jersey"}
        style={{
          width: "100%", height: "100%",
          objectFit: "contain", objectPosition: "center top",
          filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.65))",
        }}
      />
      {/* Only overlay text on front face if the image doesn't already have name/number */}
      {showText && side === "front" && (name && name !== "BASMAH" || number && number !== "10") && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "flex-end",
          paddingBottom: "12%", pointerEvents: "none",
        }}>
          {name && name !== "BASMAH" && (
            <span style={{
              color: textColor, fontSize: "clamp(10px,3.5vw,22px)",
              fontWeight: 900, letterSpacing: "3px",
              textShadow: "0 1px 8px rgba(255,255,255,0.6)",
              fontFamily: "system-ui,Arial,sans-serif", marginBottom: "4px",
            }}>{name.toUpperCase()}</span>
          )}
          {number && number !== "10" && (
            <span style={{
              color: textColor, fontSize: "clamp(28px,10vw,76px)",
              fontWeight: 900, lineHeight: 1,
              textShadow: "0 2px 12px rgba(255,255,255,0.5)",
              fontFamily: "system-ui,Arial,sans-serif", letterSpacing: "-2px",
            }}>{number}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Hex to RGB ──────────────────────────────────────────────── */
function hexToRgb(hex: string) {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `${r},${g},${b}`;
}

/* ─── Main 3D Component ───────────────────────────────────────── */
export function JerseyPreview3D({
  color,
  secondaryColor = "#ffffff",
  name,
  number,
  imageUrl,
  backImageUrl,
}: {
  color: string;
  secondaryColor?: string;
  name: string;
  number: string;
  imageUrl?: string | null;
  backImageUrl?: string | null;
}) {
  const [rotY, setRotY] = useState(-20); // start slightly angled
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const angleRef = useRef(-20);
  const velRef = useRef(0);         // drag velocity for momentum
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number>(0);

  /* ── Momentum / inertia glide after drag ends ── */
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const tick = (now: number) => {
      if (!isDragging.current && Math.abs(velRef.current) > 0.05) {
        velRef.current *= 0.94; // friction
        angleRef.current += velRef.current;
        setRotY(angleRef.current);
      }
      lastTimeRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    setDragging(true);
    lastX.current = e.clientX;
    velRef.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    velRef.current = dx * 0.55;
    angleRef.current += dx * 0.55;
    setRotY(angleRef.current);
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
    setDragging(false);
  }, []);

  /* ── Lighting ── */
  const rad = (rotY * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.abs(Math.sin(rad));
  const brightness = 0.54 + Math.abs(cosA) * 0.46;
  const edgeBrightness = 0.3 + sinA * 0.35;
  const shadowScale = 0.5 + Math.abs(cosA) * 0.35;

  const DEPTH = 24;

  const faceStyle: React.CSSProperties = {
    position: "absolute", inset: 0,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    filter: `brightness(${brightness}) contrast(1.05)`,
  };

  const rgb = hexToRgb(color);
  const edgeColor = `rgba(${rgb},${edgeBrightness})`;

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center select-none"
      style={{
        perspective: "850px",
        perspectiveOrigin: "50% 44%",
        cursor: dragging ? "grabbing" : "ew-resize",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Drag hint */}
      <div className="text-xs text-muted-foreground mb-2 pointer-events-none select-none opacity-70">
        ← اسحب لتدوير القميص →
      </div>

      {/* 3D jersey */}
      <div style={{
        width: imageUrl ? "66%" : "72%",
        height: imageUrl ? "83%" : "82%",
        position: "relative",
        transformStyle: "preserve-3d",
        transform: `rotateX(4deg) rotateY(${rotY}deg)`,
      }}>
        {/* ── FRONT ── */}
        <div style={{ ...faceStyle, transform: `translateZ(${DEPTH / 2}px)` }}>
          {imageUrl ? (
            <PhotoFace
              imageUrl={imageUrl}
              name={name} number={number}
              secondaryColor={secondaryColor}
              side="front"
              isBackPhoto={false}
            />
          ) : (
            <JerseySvgFace color={color} secondaryColor={secondaryColor} name={name} number={number} side="front" />
          )}
        </div>

        {/* ── BACK ── */}
        <div style={{ ...faceStyle, transform: `rotateY(180deg) translateZ(${DEPTH / 2}px)` }}>
          {backImageUrl ? (
            /* Real back photo */
            <PhotoFace
              imageUrl={backImageUrl}
              name={name} number={number}
              secondaryColor={secondaryColor}
              side="back"
              isBackPhoto={true}
            />
          ) : imageUrl ? (
            /* Mirror front photo as fallback back */
            <div style={{ width: "100%", height: "100%", transform: "scaleX(-1)" }}>
              <PhotoFace
                imageUrl={imageUrl}
                name={name} number={number}
                secondaryColor={secondaryColor}
                side="back"
                isBackPhoto={false}
              />
            </div>
          ) : (
            <JerseySvgFace color={color} secondaryColor={secondaryColor} name={name} number={number} side="back" />
          )}
        </div>

        {/* ── Right edge ── */}
        <div style={{
          position: "absolute", top: "8%", bottom: "3%",
          width: `${DEPTH}px`, right: `-${DEPTH / 2}px`,
          background: `linear-gradient(to right, ${edgeColor}, rgba(${rgb},${edgeBrightness * 0.55}))`,
          backfaceVisibility: "hidden",
          transform: "rotateY(90deg)",
          transformOrigin: "left center",
          borderRadius: "0 3px 3px 0",
        }} />

        {/* ── Left edge ── */}
        <div style={{
          position: "absolute", top: "8%", bottom: "3%",
          width: `${DEPTH}px`, left: `-${DEPTH / 2}px`,
          background: `linear-gradient(to left, ${edgeColor}, rgba(${rgb},${edgeBrightness * 0.55}))`,
          backfaceVisibility: "hidden",
          transform: "rotateY(-90deg)",
          transformOrigin: "right center",
          borderRadius: "3px 0 0 3px",
        }} />

        {/* ── Top edge ── */}
        <div style={{
          position: "absolute", left: "8%", right: "8%",
          height: `${DEPTH}px`, top: `-${DEPTH / 2}px`,
          background: `rgba(${hexToRgb(secondaryColor === "#ffffff" ? color : secondaryColor)},${edgeBrightness * 0.7})`,
          backfaceVisibility: "hidden",
          transform: "rotateX(90deg)",
          transformOrigin: "bottom center",
        }} />
      </div>

      {/* Ground shadow */}
      <div style={{
        width: imageUrl ? "58%" : "64%",
        height: "14px",
        marginTop: "2px",
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, transparent 75%)",
        transform: `scaleX(${shadowScale})`,
        pointerEvents: "none",
        flexShrink: 0,
      }} />
    </div>
  );
}
