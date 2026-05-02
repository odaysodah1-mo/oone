export function JerseyPreview({ color, name, number, secondaryColor = "#ffffff" }: { color: string, name: string, number: string, secondaryColor?: string }) {
  return (
    <svg viewBox="0 0 400 500" className="w-full h-full drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="10" stdDeviation="15" floodOpacity="0.5" />
        </filter>
        <pattern id="fabric" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 0h4v4H0z" fill="none"/>
          <path d="M1 1h2v2H1z" fill="rgba(255,255,255,0.03)"/>
        </pattern>
      </defs>
      
      <g filter="url(#shadow)">
        {/* Main Body */}
        <path d="M 120 50 C 150 70 250 70 280 50 L 350 120 L 320 180 C 310 160 300 150 290 160 L 290 450 C 250 460 150 460 110 450 L 110 160 C 100 150 90 160 80 180 L 50 120 Z" fill={color} />
        
        {/* Collar */}
        <path d="M 160 50 C 180 80 220 80 240 50 C 230 40 170 40 160 50 Z" fill={secondaryColor} />
        
        {/* Sleeve Trims */}
        <path d="M 50 120 L 80 180 L 90 165 L 60 110 Z" fill={secondaryColor} />
        <path d="M 350 120 L 320 180 L 310 165 L 340 110 Z" fill={secondaryColor} />
        
        {/* Fabric Texture */}
        <path d="M 120 50 C 150 70 250 70 280 50 L 350 120 L 320 180 C 310 160 300 150 290 160 L 290 450 C 250 460 150 460 110 450 L 110 160 C 100 150 90 160 80 180 L 50 120 Z" fill="url(#fabric)" />
      </g>
      
      {/* Dynamic Text */}
      <g className="text-center" style={{ transformOrigin: "center" }}>
        <text 
          x="200" 
          y="180" 
          fontSize="32" 
          fontWeight="900" 
          fill={secondaryColor} 
          textAnchor="middle"
          letterSpacing="2"
          fontFamily="system-ui, sans-serif"
          className="uppercase drop-shadow-md"
        >
          {name}
        </text>
        <text 
          x="200" 
          y="340" 
          fontSize="140" 
          fontWeight="900" 
          fill={secondaryColor} 
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
          className="drop-shadow-lg"
          style={{ letterSpacing: "-5px" }}
        >
          {number}
        </text>
      </g>
    </svg>
  );
}
