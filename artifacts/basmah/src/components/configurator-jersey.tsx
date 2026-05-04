interface JerseyColors {
  body: string;
  sleeves: string;
  collar: string;
  trim: string;
}

const FONT_STYLES = [
  { id: "block", label: "BLOCK", family: "Impact, Arial Black, sans-serif", style: {} },
  { id: "sport", label: "SPORT", family: "Arial Black, Helvetica, sans-serif", style: { fontStyle: "italic" } },
  { id: "classic", label: "Classic", family: "Georgia, Times New Roman, serif", style: {} },
  { id: "slim", label: "SLIM", family: "Trebuchet MS, Verdana, sans-serif", style: { letterSpacing: "6px" } },
];

export { FONT_STYLES };
export type { JerseyColors };

export function ConfiguratorJersey({
  colors,
  name,
  number,
  view = "front",
  fontId = "block",
}: {
  colors: JerseyColors;
  name: string;
  number: string;
  view?: "front" | "back";
  fontId?: string;
}) {
  const font = FONT_STYLES.find((f) => f.id === fontId) ?? FONT_STYLES[0];
  const id = Object.values(colors).join("").replace(/[^a-z0-9]/gi, "") + view;

  // Derived shade for secondary elements
  const bodyRgb = hexToRgbArr(colors.body);
  const darkerBody = `rgba(${bodyRgb.map((v) => Math.max(0, v - 30)).join(",")},1)`;

  return (
    <svg
      viewBox="0 0 500 580"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", overflow: "visible" }}
    >
      <defs>
        {/* Body gradient */}
        <linearGradient id={`bodyG-${id}`} x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor={colors.body} stopOpacity="1" />
          <stop offset="50%" stopColor={colors.body} stopOpacity="0.92" />
          <stop offset="100%" stopColor={darkerBody} stopOpacity="1" />
        </linearGradient>
        {/* Sleeve gradient */}
        <linearGradient id={`slvG-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.sleeves} stopOpacity="1" />
          <stop offset="100%" stopColor={colors.sleeves} stopOpacity="0.82" />
        </linearGradient>
        {/* Shine */}
        <linearGradient id={`shine-${id}`} x1="0%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.24" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {/* Side shade */}
        <linearGradient id={`sideL-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`sideR-${id}`} x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        {/* Sleeve left gradient */}
        <linearGradient id={`slvL-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.sleeves} stopOpacity="0.72" />
          <stop offset="100%" stopColor={colors.sleeves} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`slvR-${id}`} x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={colors.sleeves} stopOpacity="0.72" />
          <stop offset="100%" stopColor={colors.sleeves} stopOpacity="1" />
        </linearGradient>
        {/* Drop shadow filter */}
        <filter id={`ds-${id}`} x="-15%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="18" stdDeviation="22" floodColor="#000" floodOpacity="0.55" />
        </filter>
        {/* Fabric weave */}
        <pattern id={`fab-${id}`} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="none" />
          <path d="M0 3h6M3 0v6" stroke="rgba(255,255,255,0.045)" strokeWidth="0.6" />
        </pattern>
        <pattern id={`dots-${id}`} x="0" y="0" width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="4.5" cy="4.5" r="0.9" fill="rgba(255,255,255,0.055)" />
        </pattern>
      </defs>

      <g filter={`url(#ds-${id})`}>
        {/* ── Left Sleeve ── */}
        <path
          d="M 142 72 L 24 200 L 80 235 L 155 165 Z"
          fill={`url(#slvL-${id})`}
        />
        {/* Left sleeve trim */}
        <path
          d="M 142 72 L 24 200 L 38 213 L 150 86 Z"
          fill={colors.trim}
          opacity="0.7"
        />
        {/* Left sleeve cuff stripe */}
        <path
          d="M 32 203 L 78 232 L 70 240 L 24 210 Z"
          fill={colors.trim}
          opacity="0.85"
        />

        {/* ── Right Sleeve ── */}
        <path
          d="M 358 72 L 476 200 L 420 235 L 345 165 Z"
          fill={`url(#slvR-${id})`}
        />
        {/* Right sleeve trim */}
        <path
          d="M 358 72 L 476 200 L 462 213 L 350 86 Z"
          fill={colors.trim}
          opacity="0.7"
        />
        {/* Right sleeve cuff stripe */}
        <path
          d="M 468 203 L 422 232 L 430 240 L 476 210 Z"
          fill={colors.trim}
          opacity="0.85"
        />

        {/* ── Main Body ── */}
        <path
          d="M 142 72 C 186 100 314 100 358 72
             L 390 156 L 382 178
             L 382 548 C 338 563 162 563 118 548
             L 118 178 L 110 156 Z"
          fill={`url(#bodyG-${id})`}
        />

        {/* Fabric textures on body */}
        <path
          d="M 142 72 C 186 100 314 100 358 72
             L 390 156 L 382 178
             L 382 548 C 338 563 162 563 118 548
             L 118 178 L 110 156 Z"
          fill={`url(#fab-${id})`}
        />
        <path
          d="M 142 72 C 186 100 314 100 358 72
             L 390 156 L 382 178
             L 382 548 C 338 563 162 563 118 548
             L 118 178 L 110 156 Z"
          fill={`url(#dots-${id})`}
        />

        {/* Shine highlight (upper-left) */}
        <path
          d="M 168 73 C 204 96 296 96 332 75 L 344 132 L 160 126 Z"
          fill={`url(#shine-${id})`}
        />

        {/* Side shading for depth */}
        <path
          d="M 118 178 L 118 548 C 130 552 142 555 155 557 L 155 178 Z"
          fill={`url(#sideL-${id})`}
        />
        <path
          d="M 382 178 L 382 548 C 370 552 358 555 345 557 L 345 178 Z"
          fill={`url(#sideR-${id})`}
        />

        {/* ── Chest accent stripe ── */}
        <rect
          x="118" y="192" width="264" height="9"
          fill={colors.trim} opacity="0.28" rx="1"
        />

        {/* ── Waist band (bottom) ── */}
        <path
          d="M 118 528 L 118 548 C 162 563 338 563 382 548 L 382 528 Z"
          fill={colors.trim}
          opacity="0.25"
        />

        {/* ── Collar outer ── */}
        <path
          d="M 190 70 C 212 116 250 130 288 116
             C 308 108 320 88 322 70
             C 296 57 204 57 190 70 Z"
          fill={colors.collar}
          opacity="0.92"
        />
        {/* Collar inner (back to body color) */}
        <path
          d="M 205 71 C 222 106 250 118 278 106
             C 292 99 300 85 302 72
             C 280 62 220 62 205 71 Z"
          fill={colors.body}
        />
        {/* Collar highlight */}
        <path
          d="M 210 72 C 228 96 250 106 274 96 C 260 98 240 98 210 72 Z"
          fill="#fff"
          opacity="0.15"
        />

        {/* ── Seams ── */}
        <path d="M 118 192 L 118 528" stroke={colors.trim} strokeWidth="1.5" opacity="0.2" />
        <path d="M 382 192 L 382 528" stroke={colors.trim} strokeWidth="1.5" opacity="0.2" />
        <path d="M 155 165 L 118 186" stroke={colors.trim} strokeWidth="2" opacity="0.3" />
        <path d="M 345 165 L 382 186" stroke={colors.trim} strokeWidth="2" opacity="0.3" />
      </g>

      {/* ── Name & Number ── */}
      {view === "front" ? (
        <>
          <text
            x="250" y="278"
            textAnchor="middle"
            fontSize="36"
            fontWeight="900"
            fill={colors.trim}
            fontFamily={font.family}
            fontStyle={(font.style as any).fontStyle ?? "normal"}
            letterSpacing={(font.style as any).letterSpacing ?? "2"}
            style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.55))" }}
          >
            {name.toUpperCase()}
          </text>
          <text
            x="250" y="470"
            textAnchor="middle"
            fontSize="175"
            fontWeight="900"
            fill={colors.trim}
            fontFamily={font.family}
            fontStyle={(font.style as any).fontStyle ?? "normal"}
            style={{
              letterSpacing: "-8px",
              filter: "drop-shadow(0 5px 14px rgba(0,0,0,0.6))",
            }}
          >
            {number}
          </text>
        </>
      ) : (
        // Back view
        <>
          <text
            x="250" y="278"
            textAnchor="middle"
            fontSize="36"
            fontWeight="900"
            fill={colors.trim}
            fontFamily={font.family}
            fontStyle={(font.style as any).fontStyle ?? "normal"}
            letterSpacing={(font.style as any).letterSpacing ?? "2"}
            style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.55))" }}
          >
            {name.toUpperCase()}
          </text>
          <text
            x="250" y="460"
            textAnchor="middle"
            fontSize="175"
            fontWeight="900"
            fill={colors.trim}
            fontFamily={font.family}
            style={{
              letterSpacing: "-8px",
              filter: "drop-shadow(0 5px 14px rgba(0,0,0,0.6))",
            }}
          >
            {number}
          </text>
        </>
      )}
    </svg>
  );
}

function hexToRgbArr(hex: string): [number, number, number] {
  const h = hex.replace("#", "").padEnd(6, "0");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
