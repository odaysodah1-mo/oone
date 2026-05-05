import { motion } from "framer-motion";
import { Link } from "wouter";
import { Team } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

/* ─── Country → ISO 2-letter code ───────────────────────── */
const COUNTRY_ISO: Record<string, string> = {
  /* Arab countries */
  "الأردن": "jo", "jordan": "jo",
  "مصر": "eg", "egypt": "eg",
  "السعودية": "sa", "saudi arabia": "sa", "ksa": "sa",
  "الإمارات": "ae", "uae": "ae", "emirates": "ae",
  "قطر": "qa", "qatar": "qa",
  "الكويت": "kw", "kuwait": "kw",
  "البحرين": "bh", "bahrain": "bh",
  "عُمان": "om", "عمان": "om", "oman": "om",
  "العراق": "iq", "iraq": "iq",
  "فلسطين": "ps", "palestine": "ps",
  "لبنان": "lb", "lebanon": "lb",
  "سوريا": "sy", "syria": "sy",
  "تونس": "tn", "tunisia": "tn",
  "المغرب": "ma", "morocco": "ma",
  "الجزائر": "dz", "algeria": "dz",
  "ليبيا": "ly", "libya": "ly",
  "اليمن": "ye", "yemen": "ye",
  "السودان": "sd", "sudan": "sd",
  /* Europe */
  "إسبانيا": "es", "spain": "es",
  "ألمانيا": "de", "germany": "de",
  "فرنسا": "fr", "france": "fr",
  "إنجلترا": "gb", "england": "gb",
  "المملكة المتحدة": "gb", "uk": "gb",
  "إيطاليا": "it", "italy": "it",
  "البرتغال": "pt", "portugal": "pt",
  "هولندا": "nl", "netherlands": "nl",
  "بلجيكا": "be", "belgium": "be",
  "كرواتيا": "hr", "croatia": "hr",
  "الدنمارك": "dk", "denmark": "dk",
  "السويد": "se", "sweden": "se",
  "النرويج": "no", "norway": "no",
  "سويسرا": "ch", "switzerland": "ch",
  "النمسا": "at", "austria": "at",
  "بولندا": "pl", "poland": "pl",
  "أوكرانيا": "ua", "ukraine": "ua",
  "صربيا": "rs", "serbia": "rs",
  "اليونان": "gr", "greece": "gr",
  "تشيكيا": "cz", "czech": "cz",
  "أيسلندا": "is", "iceland": "is",
  "تركيا": "tr", "turkey": "tr",
  /* Americas */
  "الأرجنتين": "ar", "argentina": "ar",
  "البرازيل": "br", "brazil": "br",
  "كولومبيا": "co", "colombia": "co",
  "أوروغواي": "uy", "uruguay": "uy",
  "المكسيك": "mx", "mexico": "mx",
  "الولايات المتحدة": "us", "usa": "us",
  "كندا": "ca", "canada": "ca",
  "شيلي": "cl", "chile": "cl",
  "البيرو": "pe", "peru": "pe",
  "الإكوادور": "ec", "ecuador": "ec",
  "باراغواي": "py", "paraguay": "py",
  "كوستاريكا": "cr", "costa rica": "cr",
  "باما": "pa", "panama": "pa",
  /* Africa */
  "نيجيريا": "ng", "nigeria": "ng",
  "غانا": "gh", "ghana": "gh",
  "الكاميرون": "cm", "cameroon": "cm",
  "السنغال": "sn", "senegal": "sn",
  "كوت ديفوار": "ci", "ivory coast": "ci",
  "المغرب": "ma",
  "إثيوبيا": "et", "ethiopia": "et",
  "كينيا": "ke", "kenya": "ke",
  "جنوب أفريقيا": "za", "south africa": "za",
  /* Asia */
  "اليابان": "jp", "japan": "jp",
  "كوريا الجنوبية": "kr", "south korea": "kr",
  "الصين": "cn", "china": "cn",
  "الهند": "in", "india": "in",
  "إيران": "ir", "iran": "ir",
  "أستراليا": "au", "australia": "au",
  "إندونيسيا": "id", "indonesia": "id",
  "تايلاند": "th", "thailand": "th",
  "فيتنام": "vn", "vietnam": "vn",
};

function getFlagUrl(country: string): string | null {
  const key = country.trim().toLowerCase();
  const iso = COUNTRY_ISO[key] ?? COUNTRY_ISO[country.trim()];
  if (!iso) return null;
  return `https://flagcdn.com/w320/${iso}.png`;
}

/* ─── Jersey SVG fallback ────────────────────────────────── */
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
        <path d="M 55 40 L 10 95 L 45 120 L 70 80 Z" fill={`url(#body-grad-${primaryColor.replace('#','')})`} />
        <path d="M 55 40 L 10 95 L 20 103 L 58 50 Z" fill={secondaryColor} opacity="0.7" />
        <path d="M 225 40 L 270 95 L 235 120 L 210 80 Z" fill={`url(#body-grad-${primaryColor.replace('#','')})`} />
        <path d="M 225 40 L 270 95 L 260 103 L 222 50 Z" fill={secondaryColor} opacity="0.7" />
        <path d="M 55 40 C 90 60 190 60 225 40 L 240 80 L 230 90 L 230 310 C 195 320 85 320 50 310 L 50 90 L 40 80 Z"
          fill={`url(#body-grad-${primaryColor.replace('#','')})`} />
        <path d="M 55 40 C 90 60 190 60 225 40 L 240 80 L 230 90 L 230 310 C 195 320 85 320 50 310 L 50 90 L 40 80 Z"
          fill={`url(#weave-${primaryColor.replace('#','')})`} />
        <path d="M 80 40 C 110 58 170 58 210 44 L 215 85 L 85 82 Z" fill={`url(#shine-${primaryColor.replace('#','')})`} />
        <path d="M 115 38 C 130 65 150 72 165 65 C 175 60 183 50 185 38 C 170 32 130 32 115 38 Z" fill={secondaryColor} opacity="0.85" />
        <path d="M 130 38 C 138 55 150 60 162 55 C 168 50 172 44 173 38 C 162 34 138 34 130 38 Z" fill={primaryColor} />
        <path d="M 70 80 L 50 90" stroke={secondaryColor} strokeWidth="2" opacity="0.5" />
        <path d="M 210 80 L 230 90" stroke={secondaryColor} strokeWidth="2" opacity="0.5" />
        <rect x="50" y="120" width="180" height="8" fill={secondaryColor} opacity="0.3" rx="2" />
      </g>
    </svg>
  );
}

/* ─── Card visual area ───────────────────────────────────── */
function CardVisual({ team }: { team: Team }) {
  const flagUrl = getFlagUrl(team.country);
  const hasLogo = !!team.logoUrl;
  const hasFlag = !!flagUrl;

  /* Club with logo: large logo centered, team-color bg */
  if (hasLogo) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        {/* Subtle color bg */}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${team.primaryColor}55 0%, ${team.secondaryColor}33 100%)` }} />
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `radial-gradient(circle, ${team.primaryColor} 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
        {/* Logo centered and large */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <img
            src={team.logoUrl!}
            alt={team.nameEn}
            className="max-w-[55%] max-h-[55%] object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500"
          />
        </div>
      </div>
    );
  }

  /* National team with flag: flag as background + overlay */
  if (hasFlag) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        {/* Flag image — blurred background */}
        <img
          src={flagUrl!}
          alt={team.country}
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-500"
        />
        {/* Color tint overlay */}
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${team.primaryColor}66 0%, transparent 60%)` }} />
        {/* Flag displayed prominently in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative group-hover:scale-105 transition-transform duration-500">
            <img
              src={flagUrl!}
              alt={team.country}
              className="w-36 h-auto rounded-lg shadow-2xl border-2 border-white/20"
              style={{ aspectRatio: "3/2", objectFit: "cover" }}
            />
            <div className="absolute inset-0 rounded-lg ring-1 ring-white/10" />
          </div>
        </div>
      </div>
    );
  }

  /* Fallback: jersey SVG */
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: team.primaryColor + "22" }}>
      <div className="w-full h-full flex items-center justify-center p-4 group-hover:scale-105 transition-transform duration-500">
        <JerseyCardSvg primaryColor={team.primaryColor} secondaryColor={team.secondaryColor} />
      </div>
    </div>
  );
}

/* ─── Main card ──────────────────────────────────────────── */
export function TeamCard({ team, index = 0 }: { team: Team; index?: number }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className="h-full"
    >
      <Link href={`/teams/${team.id}`} className="block h-full group outline-none">
        <Card className="h-full overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 relative group">
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent z-10 pointer-events-none" />

          {/* Visual area */}
          <CardVisual team={team} />

          {/* Content */}
          <CardContent className="p-5 relative z-20 h-full flex flex-col justify-end min-h-[260px]">
            {/* Country badge top */}
            <div className={`absolute top-3 ${isAr ? "left-3" : "right-3"} flex gap-2 items-center`}>
              {getFlagUrl(team.country) && (
                <img
                  src={getFlagUrl(team.country)!}
                  alt={team.country}
                  className="w-6 h-4 rounded-sm object-cover border border-white/20 shadow"
                />
              )}
              <span className="bg-black/60 text-white/80 backdrop-blur-sm border border-white/10 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {team.country}
              </span>
            </div>

            <div className="mt-auto">
              <h3 className="text-xl font-black text-white mb-0.5 group-hover:text-primary transition-colors drop-shadow-lg leading-tight">
                {team.name}
              </h3>
              <p className="text-white/45 text-xs font-semibold uppercase tracking-widest mb-3">{team.nameEn}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-primary font-black text-lg drop-shadow">{team.basePrice}</span>
                  <span className="text-white/40 text-xs font-bold">{t("td_currency")}</span>
                </div>
                <span className="text-[10px] bg-black/60 text-white/70 px-2 py-1 rounded-full border border-white/10 backdrop-blur-sm font-bold">
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
