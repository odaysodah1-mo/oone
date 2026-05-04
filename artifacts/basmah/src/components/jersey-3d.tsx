import { useEffect, useRef, useState } from "react";

function JerseySvgFace({
  color,
  secondaryColor,
  name,
  number,
  side = "front",
}: {
  color: string;
  secondaryColor: string;
  name: string;
  number: string;
  side?: "front" | "back";
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
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id={`shadow-${id}`}>
          <feDropShadow dx="0" dy="10" stdDeviation="16" floodOpacity="0.55" />
        </filter>
        <pattern id={`weave-${id}`} x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill="none" />
          <path d="M0 2.5h5M2.5 0v5" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        </pattern>
        <linearGradient id={`sleeveL-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.68" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`sleeveR-${id}`} x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.68" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <g filter={`url(#shadow-${id})`}>
        <path d="M 118 62 L 22 168 L 70 202 L 128 136 Z" fill={`url(#sleeveL-${id})`} />
        <path d="M 118 62 L 22 168 L 36 180 L 128 76 Z" fill={secondaryColor} opacity="0.6" />
        <path d="M 282 62 L 378 168 L 330 202 L 272 136 Z" fill={`url(#sleeveR-${id})`} />
        <path d="M 282 62 L 378 168 L 364 180 L 272 76 Z" fill={secondaryColor} opacity="0.6" />
        <path d="M 118 62 C 158 84 242 84 282 62 L 308 126 L 302 148 L 302 448 C 262 460 138 460 98 448 L 98 148 L 92 126 Z" fill={`url(#g1-${id})`} />
        <path d="M 118 62 C 158 84 242 84 282 62 L 308 126 L 302 148 L 302 448 C 262 460 138 460 98 448 L 98 148 L 92 126 Z" fill={`url(#weave-${id})`} />
        <path d="M 142 63 C 172 82 228 82 262 65 L 268 116 L 138 112 Z" fill={`url(#shine-${id})`} />
        <path d="M 98 158 L 98 448" stroke={secondaryColor} strokeWidth="1.5" opacity="0.2" />
        <path d="M 302 158 L 302 448" stroke={secondaryColor} strokeWidth="1.5" opacity="0.2" />
        <rect x="98" y="162" width="204" height="7" fill={secondaryColor} opacity="0.25" rx="1" />
        <path d="M 156 62 C 174 98 200 110 226 98 C 241 90 250 74 252 62 C 232 52 168 52 156 62 Z" fill={secondaryColor} opacity="0.82" />
        <path d="M 168 63 C 182 92 200 102 218 92 C 228 86 234 74 236 64 C 220 56 180 56 168 63 Z" fill={color} />
      </g>
      {side === "front" ? (
        <>
          <text x="200" y="228" fontSize="32" fontWeight="900" fill={secondaryColor} textAnchor="middle" letterSpacing="3" fontFamily="system-ui, Arial, sans-serif" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
            {name.toUpperCase()}
          </text>
          <text x="200" y="390" fontSize="155" fontWeight="900" fill={secondaryColor} textAnchor="middle" fontFamily="system-ui, Arial, sans-serif" style={{ letterSpacing: "-6px", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.6))" }}>
            {number}
          </text>
        </>
      ) : (
        <text x="200" y="370" fontSize="155" fontWeight="900" fill={secondaryColor} textAnchor="middle" fontFamily="system-ui, Arial, sans-serif" style={{ letterSpacing: "-6px", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.6))" }}>
          {number}
        </text>
      )}
    </svg>
  );
}

function PhotoFace({
  imageUrl,
  name,
  number,
  secondaryColor,
  side = "front",
}: {
  imageUrl: string;
  name: string;
  number: string;
  secondaryColor: string;
  side?: "front" | "back";
}) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <img
        src={imageUrl}
        alt="jersey"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center top",
          filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.6))",
          transform: side === "back" ? "scaleX(-1)" : undefined,
        }}
      />
      {/* Overlay name + number on top of real photo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: "14%",
          pointerEvents: "none",
        }}
      >
        {side === "front" && (
          <span
            style={{
              color: secondaryColor === "#ffffff" ? "#333" : secondaryColor,
              fontSize: "clamp(10px, 3.5vw, 22px)",
              fontWeight: 900,
              letterSpacing: "3px",
              textShadow: "0 1px 4px rgba(0,0,0,0.4)",
              fontFamily: "system-ui, Arial, sans-serif",
              marginBottom: "4px",
            }}
          >
            {name.toUpperCase()}
          </span>
        )}
        <span
          style={{
            color: secondaryColor === "#ffffff" ? "#333" : secondaryColor,
            fontSize: "clamp(28px, 10vw, 80px)",
            fontWeight: 900,
            lineHeight: 1,
            textShadow: "0 2px 8px rgba(0,0,0,0.4)",
            fontFamily: "system-ui, Arial, sans-serif",
            letterSpacing: "-2px",
          }}
        >
          {number}
        </span>
      </div>
    </div>
  );
}

export function JerseyPreview3D({
  color,
  secondaryColor = "#ffffff",
  name,
  number,
  imageUrl,
}: {
  color: string;
  secondaryColor?: string;
  name: string;
  number: string;
  imageUrl?: string | null;
}) {
  const [rotY, setRotY] = useState(0);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const rafRef = useRef<number>(0);
  const autoRef = useRef(true);
  const angleRef = useRef(0);

  useEffect(() => {
    const tick = () => {
      if (autoRef.current) {
        angleRef.current += 0.45;
        setRotY(angleRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
    autoRef.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    angleRef.current += dx * 0.6;
    setRotY(angleRef.current);
  };

  const onPointerUp = () => {
    isDragging.current = false;
    setTimeout(() => { autoRef.current = true; }, 1500);
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center select-none"
      style={{ perspective: "900px", cursor: isDragging.current ? "grabbing" : "grab" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div
        style={{
          width: imageUrl ? "70%" : "75%",
          height: imageUrl ? "92%" : "88%",
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `rotateY(${rotY}deg)`,
        }}
      >
        {/* Front face */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
          {imageUrl ? (
            <PhotoFace imageUrl={imageUrl} name={name} number={number} secondaryColor={secondaryColor} side="front" />
          ) : (
            <JerseySvgFace color={color} secondaryColor={secondaryColor} name={name} number={number} side="front" />
          )}
        </div>

        {/* Back face */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          {imageUrl ? (
            <PhotoFace imageUrl={imageUrl} name={name} number={number} secondaryColor={secondaryColor} side="back" />
          ) : (
            <JerseySvgFace color={color} secondaryColor={secondaryColor} name={name} number={number} side="back" />
          )}
        </div>
      </div>
    </div>
  );
}
