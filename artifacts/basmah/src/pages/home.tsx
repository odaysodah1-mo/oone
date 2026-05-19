import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Store, Shirt } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetPopularTeams } from "@workspace/api-client-react";
import { TeamCard } from "@/components/team-card";
import { Skeleton } from "@/components/ui/skeleton";

interface Design {
  id: number; title: string; imageUrl: string; price: number;
  category: string; shopName: string;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data: popularTeams, isLoading: teamsLoading } = useGetPopularTeams();

  const [featured, setFeatured] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/marketplace/designs")
      .then(r => r.ok ? r.json() : [])
      .then(d => { setFeatured(d.slice(0, 8)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="w-full flex flex-col">
      {/* ══ HERO — Collection first ══ */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden"
        style={{ background: "#070707" }}>
        {/* Subtle texture */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0v60M0 30h60' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E\")" }} />
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left: text */}
            <motion.div
              initial={{ opacity: 0, x: isAr ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Sparkles size={14} className="text-primary" />
                </div>
                <span className="text-[10px] font-bold tracking-[3px] text-white/30 uppercase">
                  {isAr ? "تشكيلة حصريّة" : "Exclusive Collection"}
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] mb-4">
                {isAr ? "تصاميم" : "Designs"}
                <br />
                <span className="text-primary">{isAr ? "تفصلك" : "Just For You"}</span>
              </h1>

              <p className="text-white/40 text-sm md:text-base max-w-md leading-relaxed mb-8">
                {isAr
                  ? "تصاميم حصرية من مطابع ومحلات متخصصة. اختر التصميم اللي يعجبك، اطلبه، ونوصلك لباب البيت."
                  : "Exclusive designs from specialized print shops. Pick what you like, order, and we deliver to your door."}
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setLocation("/marketplace")}
                  className="px-8 py-3.5 rounded-xl font-black text-sm bg-primary text-black hover:bg-primary/90 transition-all active:scale-[0.97]"
                >
                  {isAr ? "تصفّح التشكيلة" : "Browse Collection"}
                </button>
                <button
                  onClick={() => setLocation("/teams")}
                  className="px-8 py-3.5 rounded-xl font-bold text-sm border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-all"
                >
                  <Shirt size={16} className="inline ml-1.5 -mt-0.5" />
                  {isAr ? "الفرق" : "Teams"}
                </button>
              </div>
            </motion.div>

            {/* Right: featured designs grid */}
            <motion.div
              initial={{ opacity: 0, x: isAr ? -40 : 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="hidden lg:block"
            >
              {loading ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="aspect-[4/5] rounded-2xl bg-white/[0.03] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {featured.slice(0, 4).map((d, i) => (
                    <motion.button
                      key={d.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.08 }}
                      onClick={() => setLocation(`/marketplace/designs/${d.id}`)}
                      className="rounded-2xl overflow-hidden group relative aspect-[4/5] bg-white/[0.03] border border-white/[0.06] hover:border-primary/30 transition-all"
                    >
                      <img
                        src={d.imageUrl}
                        alt={d.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                        <p className="text-white text-[10px] font-bold truncate">{d.title}</p>
                        <span className="text-primary text-xs font-black">{d.price} {isAr ? "د.أ" : "JD"}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ FEATURED DESIGNS (mobile scroll) ══ */}
      <section className="lg:hidden py-8 px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-white">
            {isAr ? "أحدث التصاميم" : "Latest Designs"}
          </h2>
          <Link href="/marketplace" className="text-[10px] font-bold text-primary/70 hover:text-primary transition-colors">
            {isAr ? "عرض الكل" : "View All"} ←
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-none">
          {featured.slice(0, 6).map(d => (
            <button
              key={d.id}
              onClick={() => setLocation(`/marketplace/designs/${d.id}`)}
              className="snap-start shrink-0 w-36 rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06]"
            >
              <div className="aspect-square">
                <img src={d.imageUrl} alt={d.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-2">
                <p className="text-[10px] font-bold text-white truncate">{d.title}</p>
                <span className="text-primary text-[10px] font-black">{d.price} {isAr ? "د.أ" : "JD"}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ══ POPULAR TEAMS ══ */}
      {!teamsLoading && popularTeams && popularTeams.length > 0 && (
        <section className="py-12 md:py-20 px-4 border-t border-white/[0.04]">
          <div className="container mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Shirt size={14} className="text-white/30" />
              <span className="text-[9px] font-bold tracking-[3px] text-white/20 uppercase">{isAr ? "أطقم رياضية" : "Kits"}</span>
            </div>
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-white">
                {t("home_popular_title")} <span className="text-primary">{t("home_popular_accent")}</span>
              </h2>
              <Link href="/teams" className="hidden md:flex items-center gap-1 text-sm font-bold text-white/40 hover:text-white transition-colors">
                {t("home_all_teams")} <ArrowLeft size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {popularTeams.slice(0, 4).map((team, i) => (
                <motion.div key={team.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <TeamCard team={team} />
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-8 md:hidden">
              <Link href="/teams" className="inline-flex items-center gap-1 text-sm font-bold text-primary/70 hover:text-primary transition-colors">
                {t("home_all_teams")} ←
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══ CTA ══ */}
      <section className="py-16 md:py-24 px-4 border-t border-white/[0.04] bg-[#050505]">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            {isAr ? "عندك مطبعة أو محل تصميم؟" : "Have a print shop or design store?"}
          </h2>
          <p className="text-white/30 text-sm mb-8 max-w-md mx-auto">
            {isAr
              ? "تقدر تعرض تصاميمك على المنصة وتوصل لآلاف الزبائن. نبيع ونوصل واحنا ناخد نسبة."
              : "Showcase your designs on our platform and reach thousands of customers. We sell, deliver, and take a commission."}
          </p>
          <p className="text-sm text-gray-400">
            {isAr ? "تواصل واتساب: 0781079784" : "WhatsApp: 0781079784"}
          </p>
        </div>
      </section>
    </div>
  );
}
