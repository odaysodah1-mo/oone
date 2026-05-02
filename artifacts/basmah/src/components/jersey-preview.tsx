export function JerseyPreview({
  color,
  name,
  number,
  secondaryColor = "#ffffff",
}: {
  color: string;
  name: string;
  number: string;
  secondaryColor?: string;
}) {
  const id = color.replace(/[^a-z0-9]/gi, "") + secondaryColor.replace(/[^a-z0-9]/gi, "");

  return (
    <svg viewBox="0 0 400 500" className="w-full h-full drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id={`dropshadow-${id}`}>
          <feDropShadow dx="0" dy="12" stdDeviation="18" floodOpacity="0.55" />
        </filter>
        <linearGradient id={`bodyGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="55%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={`shine-${id}`} x1="0%" y1="0%" x2="40%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.22" />
          <stop offset="45%" stopColor="white" stopOpacity="0.06" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`leftSleeve-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.7" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`rightSleeve-${id}`} x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.7" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        <pattern id={`weave-${id}`} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="none" />
          <path d="M0 3h6M3 0v6" stroke="rgba(255,255,255,0.045)" strokeWidth="0.6" />
        </pattern>
        <pattern id={`dots-${id}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="none" />
          <circle cx="4" cy="4" r="0.8" fill="rgba(255,255,255,0.06)" />
        </pattern>
      </defs>

      <g filter={`url(#dropshadow-${id})`}>
        {/* Left Sleeve */}
        <path
          d="M 115 65 L 30 160 L 75 195 L 120 130 Z"
          fill={`url(#leftSleeve-${id})`}
        />
        {/* Left sleeve trim */}
        <path
          d="M 115 65 L 30 160 L 42 170 L 124 77 Z"
          fill={secondaryColor}
          opacity="0.65"
        />

        {/* Right Sleeve */}
        <path
          d="M 285 65 L 370 160 L 325 195 L 280 130 Z"
          fill={`url(#rightSleeve-${id})`}
        />
        {/* Right sleeve trim */}
        <path
          d="M 285 65 L 370 160 L 358 170 L 276 77 Z"
          fill={secondaryColor}
          opacity="0.65"
        />

        {/* Main Body */}
        <path
          d="M 115 65 C 155 88 245 88 285 65 L 310 120 L 305 140 L 305 470 C 265 480 135 480 95 470 L 95 140 L 90 120 Z"
          fill={`url(#bodyGrad-${id})`}
        />

        {/* Fabric texture overlay */}
        <path
          d="M 115 65 C 155 88 245 88 285 65 L 310 120 L 305 140 L 305 470 C 265 480 135 480 95 470 L 95 140 L 90 120 Z"
          fill={`url(#weave-${id})`}
        />
        <path
          d="M 115 65 C 155 88 245 88 285 65 L 310 120 L 305 140 L 305 470 C 265 480 135 480 95 470 L 95 140 L 90 120 Z"
          fill={`url(#dots-${id})`}
        />

        {/* Shine / highlight */}
        <path
          d="M 140 66 C 168 85 232 85 264 68 L 272 112 L 135 108 Z"
          fill={`url(#shine-${id})`}
        />

        {/* Side seams */}
        <path d="M 95 155 L 95 470" stroke={secondaryColor} strokeWidth="1.5" opacity="0.25" />
        <path d="M 305 155 L 305 470" stroke={secondaryColor} strokeWidth="1.5" opacity="0.25" />

        {/* Shoulder seams */}
        <path d="M 120 130 L 95 150" stroke={secondaryColor} strokeWidth="2" opacity="0.35" />
        <path d="M 280 130 L 305 150" stroke={secondaryColor} strokeWidth="2" opacity="0.35" />

        {/* Collar */}
        <path
          d="M 158 64 C 175 100 200 112 225 100 C 240 92 248 77 250 64 C 232 54 168 54 158 64 Z"
          fill={secondaryColor}
          opacity="0.8"
        />
        <path
          d="M 170 65 C 183 92 200 100 217 92 C 226 87 232 77 234 66 C 220 58 180 58 170 65 Z"
          fill={color}
        />

        {/* Chest accent stripe */}
        <rect x="95" y="158" width="210" height="7" fill={secondaryColor} opacity="0.22" rx="1" />
      </g>

      {/* Name */}
      <text
        x="200"
        y="230"
        fontSize="34"
        fontWeight="900"
        fill={secondaryColor}
        textAnchor="middle"
        letterSpacing="3"
        fontFamily="system-ui, Arial, sans-serif"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}
      >
        {name}
      </text>

      {/* Number */}
      <text
        x="200"
        y="390"
        fontSize="160"
        fontWeight="900"
        fill={secondaryColor}
        textAnchor="middle"
        fontFamily="system-ui, Arial, sans-serif"
        style={{
          letterSpacing: "-8px",
          filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
        }}
      >
        {number}
      </text>
    </svg>
  );
}
