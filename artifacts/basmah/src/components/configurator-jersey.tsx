interface JerseyColors {
  body: string;
  sleeves: string;
  collar: string;
  trim: string;
}

const FONT_STYLES = [
  { id: "block",   label: "BEBAS",   family: "'Bebas Neue', Impact, sans-serif",            style: {} },
  { id: "sport",   label: "SPORT",   family: "'Barlow Condensed', Arial Black, sans-serif", style: { fontStyle: "italic" } },
  { id: "classic", label: "OSWALD",  family: "'Oswald', Arial Black, sans-serif",           style: {} },
  { id: "slim",    label: "ANTON",   family: "'Anton', Impact, sans-serif",                  style: { letterSpacing: "3px" } },
];

export { FONT_STYLES };
export type { JerseyColors };

function darken(hex: string, amt = 40): string {
  const h = hex.replace("#", "").padEnd(6, "0");
  const c = (s: string) => Math.max(0, Math.min(255, parseInt(s, 16) - amt)).toString(16).padStart(2, "0");
  return `#${c(h.slice(0,2))}${c(h.slice(2,4))}${c(h.slice(4,6))}`;
}
const lighten = (hex: string, amt = 25) => darken(hex, -amt);

export function ConfiguratorJersey({
  colors, name, number, view = "front", fontId = "block",
}: {
  colors: JerseyColors; name: string; number: string;
  view?: "front" | "back"; fontId?: string;
}) {
  const font = FONT_STYLES.find(f => f.id === fontId) ?? FONT_STYLES[0];
  const uid  = [colors.body, colors.sleeves, view].join("").replace(/[^a-z0-9]/gi, "").slice(0, 16);

  const bL  = lighten(colors.body, 38);
  const bM  = colors.body;
  const bD  = darken(colors.body, 45);
  const bD2 = darken(colors.body, 72);
  const sL  = lighten(colors.sleeves, 30);
  const sD  = darken(colors.sleeves, 42);
  const cL  = lighten(colors.collar, 22);
  const cD  = darken(colors.collar, 38);

  /*
   ═══════════════════════════════════════════════════════
   JERSEY PATH — proper sportswear silhouette
   viewBox: 0 0 500 580

   Key points:
   • Shoulder peaks at y≈72 (highest point)
   • Collar is a U-shape going DOWN INTO the body
     from (195,95) curving down to (250,125) then (305,95)
   • Short sleeves on each side, barely visible
   • Wide body (110→390) running y 165→535

   The collar sits BELOW the shoulder peaks →
   no "ball floating above jersey" effect!
   ═══════════════════════════════════════════════════════
  */

  // Full jersey outline — one connected path, clockwise
  const jerseyPath = `
    M 195,95
    C 218,125 282,125 305,95
    C 330,85 362,74 390,72
    L 442,85
    C 452,90 458,102 454,116
    L 444,148
    C 440,162 426,172 410,168
    L 390,165
    L 390,535
    C 358,548 142,548 110,535
    L 110,165
    L 90,168
    C 74,172 60,162 56,148
    L 46,116
    C 42,102 48,90 58,85
    L 110,72
    C 138,74 170,85 195,95 Z
  `;

  // Collar band region (fills the collar area with collar color)
  // The collar spans from collar-left to collar-right, above the collar bottom
  const collarPath = `
    M 195,95
    C 218,125 282,125 305,95
    C 286,112 214,112 195,95 Z
  `;

  return (
    <svg viewBox="0 0 500 580" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        {/* ── Main body: bright left → dark right (fabric 3D shading) ── */}
        <linearGradient id={`bLR-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"    stopColor={bL} />
          <stop offset="22%"   stopColor={lighten(colors.body, 12)} />
          <stop offset="55%"   stopColor={bM} />
          <stop offset="80%"   stopColor={darken(colors.body, 22)} />
          <stop offset="100%"  stopColor={bD} />
        </linearGradient>

        {/* ── Top→Bottom: bright top, darker hem ── */}
        <linearGradient id={`bTB-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.14" />
          <stop offset="28%"  stopColor="#fff" stopOpacity="0.02" />
          <stop offset="72%"  stopColor="#000" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.28" />
        </linearGradient>

        {/* ── Chest highlight: bright upper-left glow ── */}
        <radialGradient id={`chest-${uid}`} cx="30%" cy="26%" r="44%">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.28" />
          <stop offset="60%"  stopColor="#fff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.00" />
        </radialGradient>

        {/* ── Belly shadow: lower-center darker ── */}
        <radialGradient id={`belly-${uid}`} cx="50%" cy="82%" r="38%">
          <stop offset="0%"   stopColor="#000" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.00" />
        </radialGradient>

        {/* ── Right fold: right edge darkens away ── */}
        <linearGradient id={`rFold-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#000" stopOpacity="0.00" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.56" />
        </linearGradient>

        {/* ── Left edge: slight shadow ── */}
        <linearGradient id={`lFold-${uid}`} x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%"   stopColor="#000" stopOpacity="0.00" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>

        {/* ── Left sleeve: brighter (faces viewer) ── */}
        <radialGradient id={`slvL-${uid}`} cx="38%" cy="40%" r="54%">
          <stop offset="0%"   stopColor={sL} />
          <stop offset="55%"  stopColor={colors.sleeves} />
          <stop offset="100%" stopColor={sD} />
        </radialGradient>
        <radialGradient id={`slvLs-${uid}`} cx="30%" cy="28%" r="50%">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.00" />
        </radialGradient>

        {/* ── Right sleeve: darker (turns away) ── */}
        <radialGradient id={`slvR-${uid}`} cx="62%" cy="40%" r="54%">
          <stop offset="0%"   stopColor={darken(colors.sleeves, 15)} />
          <stop offset="55%"  stopColor={sD} />
          <stop offset="100%" stopColor={bD2} />
        </radialGradient>
        <radialGradient id={`slvRs-${uid}`} cx="70%" cy="28%" r="50%">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.00" />
        </radialGradient>

        {/* ── Collar gradients ── */}
        <linearGradient id={`col-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor={cL} />
          <stop offset="100%" stopColor={cD} />
        </linearGradient>
        <radialGradient id={`colS-${uid}`} cx="50%" cy="20%" r="65%">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.00" />
        </radialGradient>

        {/* ── Drop shadow filter ── */}
        <filter id={`ds-${uid}`} x="-20%" y="-10%" width="140%" height="135%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="24" result="blur" />
          <feOffset dx="2" dy="30" result="off" />
          <feFlood floodColor="#000" floodOpacity="0.82" result="col" />
          <feComposite in="col" in2="off" operator="in" result="sh" />
          <feMerge><feMergeNode in="sh" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* ── Fabric texture ── */}
        <pattern id={`fab-${uid}`} x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill="none" />
          <path d="M0 2.5h5M2.5 0v5" stroke="rgba(255,255,255,0.022)" strokeWidth="0.4" />
        </pattern>

        {/* ── Clip regions ── */}
        {/* Sleeve areas */}
        <clipPath id={`cSL-${uid}`}>
          <rect x="0" y="0" width="114" height="580" />
        </clipPath>
        <clipPath id={`cSR-${uid}`}>
          <rect x="386" y="0" width="114" height="580" />
        </clipPath>
        {/* Body area (center) */}
        <clipPath id={`cBdy-${uid}`}>
          <rect x="110" y="0" width="280" height="580" />
        </clipPath>
        {/* Right fold shadow */}
        <clipPath id={`cRF-${uid}`}>
          <rect x="354" y="0" width="46" height="580" />
        </clipPath>
        {/* Left fold shadow */}
        <clipPath id={`cLF-${uid}`}>
          <rect x="100" y="0" width="46" height="580" />
        </clipPath>
      </defs>

      <g filter={`url(#ds-${uid})`}>

        {/* ── Base fill (correct body color everywhere) ── */}
        <path d={jerseyPath} fill={bM} />

        {/* ── Left sleeve shading ── */}
        <path d={jerseyPath} fill={`url(#slvL-${uid})`} clipPath={`url(#cSL-${uid})`} />
        <path d={jerseyPath} fill={`url(#slvLs-${uid})`} clipPath={`url(#cSL-${uid})`} />

        {/* ── Right sleeve shading ── */}
        <path d={jerseyPath} fill={`url(#slvR-${uid})`} clipPath={`url(#cSR-${uid})`} />
        <path d={jerseyPath} fill={`url(#slvRs-${uid})`} clipPath={`url(#cSR-${uid})`} />

        {/* ── Body main L→R gradient ── */}
        <path d={jerseyPath} fill={`url(#bLR-${uid})`} clipPath={`url(#cBdy-${uid})`} />

        {/* ── Top→Bottom tone on body ── */}
        <path d={jerseyPath} fill={`url(#bTB-${uid})`} />

        {/* ── Chest glow ── */}
        <path d={jerseyPath} fill={`url(#chest-${uid})`} />

        {/* ── Belly shadow ── */}
        <path d={jerseyPath} fill={`url(#belly-${uid})`} />

        {/* ── Fabric weave ── */}
        <path d={jerseyPath} fill={`url(#fab-${uid})`} />

        {/* ── Right fold shadow ── */}
        <path d={jerseyPath} fill={`url(#rFold-${uid})`} clipPath={`url(#cRF-${uid})`} />

        {/* ── Left fold shadow ── */}
        <path d={jerseyPath} fill={`url(#lFold-${uid})`} clipPath={`url(#cLF-${uid})`} />

        {/* ── Collar band ── */}
        <path d={collarPath} fill={`url(#col-${uid})`} />
        <path d={collarPath} fill={`url(#colS-${uid})`} />
        {/* collar inner stitch */}
        <path d="M 204,105 C 222,122 278,122 296,105"
          fill="none" stroke={colors.trim} strokeWidth="1.3" strokeOpacity="0.30" strokeLinecap="round" />

        {/* ── Sleeve cuff stripes ── */}
        {/* Left cuff (outer edge of left sleeve) */}
        <path d="M 44,118 C 40,108 46,92 58,86"
          fill="none" stroke={colors.trim} strokeWidth="5" strokeLinecap="round" strokeOpacity="0.55" />
        {/* Right cuff */}
        <path d="M 456,118 C 460,108 454,92 442,86"
          fill="none" stroke={colors.trim} strokeWidth="5" strokeLinecap="round" strokeOpacity="0.38" />

        {/* ── Seams ── */}
        {/* Chest accent stripe */}
        <rect x="110" y="210" width="280" height="6" rx="1" fill={colors.trim} opacity="0.16" />
        {/* Side seams */}
        <path d="M 110,168 L 110,532" fill="none" stroke={colors.trim} strokeWidth="1" strokeOpacity="0.15" />
        <path d="M 390,168 L 390,532" fill="none" stroke={colors.trim} strokeWidth="1" strokeOpacity="0.15" />
        {/* Shoulder seam lines */}
        <path d="M 110,72 C 140,78 170,88 195,95" fill="none"
          stroke={colors.trim} strokeWidth="1.2" strokeOpacity="0.20" strokeLinecap="round" />
        <path d="M 390,72 C 360,78 330,88 305,95" fill="none"
          stroke={colors.trim} strokeWidth="1.2" strokeOpacity="0.20" strokeLinecap="round" />

        {/* ── Bottom hem ── */}
        <path d="M 110,532 C 142,546 358,546 390,532 L 390,541 C 358,554 142,554 110,541 Z"
          fill={cD} opacity="0.40" />
        <path d="M 112,538 C 144,550 356,550 388,538"
          fill="none" stroke={colors.trim} strokeWidth="1.2" strokeOpacity="0.22" strokeDasharray="4,3" />
      </g>

      {/* ═══════════════════════════════════════════════════════
          NAME & NUMBER — back only (FIFA standard)
      ═══════════════════════════════════════════════════════ */}
      {view === "back" && (
        <>
          {name && (
            <text x="250" y="278" textAnchor="middle"
              fontSize="34" fontWeight="900" fill={colors.trim}
              fontFamily={font.family}
              fontStyle={(font.style as Record<string,string>).fontStyle ?? "normal"}
              letterSpacing="2"
              style={{
                paintOrder: "stroke fill",
                stroke: "rgba(0,0,0,0.85)", strokeWidth: "3px",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
              }}>
              {name.toUpperCase()}
            </text>
          )}
          {number && (
            <text x="250" y="490" textAnchor="middle"
              fontSize="200" fontWeight="900" fill={colors.trim}
              fontFamily={font.family}
              fontStyle={(font.style as Record<string,string>).fontStyle ?? "normal"}
              letterSpacing="-6"
              style={{
                paintOrder: "stroke fill",
                stroke: "rgba(0,0,0,0.75)", strokeWidth: "4px",
                filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.4))"
              }}>
              {number}
            </text>
          )}
        </>
      )}
    </svg>
  );
}
