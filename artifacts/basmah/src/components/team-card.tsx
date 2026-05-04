import { motion } from "framer-motion";
import { Link } from "wouter";
import { Team } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function JerseyCardSvg({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) {
  return (
    <svg viewBox="0 0 300 360" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id={`shadow-${primaryColor.replace('#','')}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.6" />
        </filter>
        <linearGradient id={`body-grad-${primaryColor.replace('#','')}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
          <stop offset="60%" stopColor={primaryColor} stopOpacity="0.85" />
          <stop offset="100%" stopColor={primaryColor} stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={`shine-${primaryColor.replace('#','')}`} x1="0%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.18" />
          <stop offset="50%" stopColor="white" stopOpacity="0.04" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <pattern id={`weave-${primaryColor.replace('#','')}`} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="none" />
          <path d="M0 3h6M3 0v6" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        </pattern>
      </defs>

      <g filter={`url(#shadow-${primaryColor.replace('#','')})`} transform="translate(10, 20)">
        {/* Left sleeve */}
        <path d="M 55 40 L 10 95 L 45 120 L 70 80 Z"
          fill={`url(#body-grad-${primaryColor.replace('#','')})`} />
        <path d="M 55 40 L 10 95 L 20 103 L 58 50 Z" fill={secondaryColor} opacity="0.7" />

        {/* Right sleeve */}
        <path d="M 225 40 L 270 95 L 235 120 L 210 80 Z"
          fill={`url(#body-grad-${primaryColor.replace('#','')})`} />
        <path d="M 225 40 L 270 95 L 260 103 L 222 50 Z" fill={secondaryColor} opacity="0.7" />

        {/* Main body */}
        <path d="M 55 40 C 90 60 190 60 225 40 L 240 80 L 230 90 L 230 310 C 195 320 85 320 50 310 L 50 90 L 40 80 Z"
          fill={`url(#body-grad-${primaryColor.replace('#','')})`} />

        {/* Fabric weave texture */}
        <path d="M 55 40 C 90 60 190 60 225 40 L 240 80 L 230 90 L 230 310 C 195 320 85 320 50 310 L 50 90 L 40 80 Z"
          fill={`url(#weave-${primaryColor.replace('#','')})`} />

        {/* Shine overlay */}
        <path d="M 80 40 C 110 58 170 58 210 44 L 215 85 L 85 82 Z"
          fill={`url(#shine-${primaryColor.replace('#','')})`} />

        {/* Collar */}
        <path d="M 115 38 C 130 65 150 72 165 65 C 175 60 183 50 185 38 C 170 32 130 32 115 38 Z"
          fill={secondaryColor} opacity="0.85" />
        <path d="M 130 38 C 138 55 150 60 162 55 C 168 50 172 44 173 38 C 162 34 138 34 130 38 Z"
          fill={primaryColor} />

        {/* Armhole seams */}
        <path d="M 70 80 L 50 90" stroke={secondaryColor} strokeWidth="2" opacity="0.5" />
        <path d="M 210 80 L 230 90" stroke={secondaryColor} strokeWidth="2" opacity="0.5" />

        {/* Chest accent stripe */}
        <rect x="50" y="120" width="180" height="8" fill={secondaryColor} opacity="0.3" rx="2" />
      </g>
    </svg>
  );
}

export function TeamCard({ team, index = 0 }: { team: Team; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className="h-full"
    >
      <Link href={`/teams/${team.id}`} className="block h-full group outline-none">
        <Card className="h-full overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 relative group">
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />

          {/* Jersey image or SVG */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: team.primaryColor + "22" }}>
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={`${team.name} jersey`}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4 group-hover:scale-105 transition-transform duration-500">
                <JerseyCardSvg primaryColor={team.primaryColor} secondaryColor={team.secondaryColor} />
              </div>
            )}
          </div>

          <CardContent className="p-6 relative z-20 h-full flex flex-col justify-end min-h-[260px]">
            <div className="absolute top-4 right-4 flex gap-2">
              <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur-sm border-white/10 text-xs">
                {team.country}
              </Badge>
            </div>

            <div className="mt-auto">
              <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-primary transition-colors drop-shadow-lg">
                {team.name}
              </h3>
              <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{team.nameEn}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-primary font-bold text-lg drop-shadow">{team.basePrice} د.أ</span>
                <span className="text-xs bg-black/50 text-white px-2 py-1 rounded border border-white/10 backdrop-blur-sm">
                  {team.league}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
