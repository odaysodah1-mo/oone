import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, Sparkles, Tags, Store, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface Design {
  id: number; shopId: number; title: string;
  description: string | null; imageUrl: string;
  price: number; category: string; tags: string | null;
  shopName: string; shopLogo: string | null;
  createdAt: string;
}

function DesignCard({ d, onClick }: { d: Design; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full text-right group"
    >
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5">
        {/* Image */}
        <div className="aspect-[4/5] bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
          <img
            src={d.imageUrl}
            alt={d.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>

        {/* Category badge */}
        <div className="absolute top-2 right-2">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-foreground/70 border border-border/50">
            {d.category}
          </span>
        </div>

        {/* Price tag */}
        <div className="absolute bottom-2 left-2">
          <span className="text-sm font-black px-2.5 py-1 rounded-lg bg-primary text-primary-foreground shadow-lg">
            {d.price} <span className="text-[9px]">د.أ</span>
          </span>
        </div>

        {/* Info overlay at bottom */}
        <div className="p-3">
          <h3 className="font-bold text-sm leading-tight line-clamp-1">{d.title}</h3>
          <div className="flex items-center gap-1 mt-1">
            <Store size={10} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{d.shopName}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export default function Marketplace() {
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/marketplace/designs").then(r => r.ok ? r.json() : []),
      fetch("/api/marketplace/categories").then(r => r.ok ? r.json() : []),
    ]).then(([d, c]) => {
      setDesigns(d); setCategories(c); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = designs.filter(d => {
    const matchSearch = !search || d.title.includes(search) || d.shopName.includes(search) || d.category.includes(search);
    const matchCat = categoryFilter === "all" || d.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="w-full py-8 md:py-12 container mx-auto px-4">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles size={18} className="text-primary" />
          </div>
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{t("nav_marketplace")}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-2">
          {i18n.language === "ar" ? "تشكيلة" : "The"} <span className="text-primary">{i18n.language === "ar" ? "حصريّة" : "Collection"}</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg">
          {i18n.language === "ar" ? "تصاميم حصرية من مطابع ومحلات متخصصة. اطلب التصميم اللي يعجبك وبنوصلك لباب البيت." : "Exclusive designs from specialized print shops. Order what you like and we deliver to your door."}
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
        <div className="relative w-full md:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            placeholder={i18n.language === "ar" ? "ابحث عن تصميم..." : "Search designs..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pr-10 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              categoryFilter === "all" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {i18n.language === "ar" ? "الكل" : "All"}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                categoryFilter === cat ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-card/50 animate-pulse aspect-[4/5]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-30">🎨</div>
          <p className="text-muted-foreground text-lg">{i18n.language === "ar" ? "لا توجد تصاميم متاحة حالياً" : "No designs available yet"}</p>
          <p className="text-muted-foreground/50 text-sm mt-1">{i18n.language === "ar" ? "جرب تغيير البحث أو التصنيف" : "Try changing search or category"}</p>
        </div>
      ) : (
        <>
          <div className="text-xs text-muted-foreground mb-4">
            <Tags size={12} className="inline ml-1" />
            {filtered.length} {i18n.language === "ar" ? "تصميم" : "designs"}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(d => (
              <DesignCard key={d.id} d={d} onClick={() => setLocation(`/marketplace/designs/${d.id}`)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
