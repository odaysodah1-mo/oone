import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

function LangToggle() {
  const { i18n: i18nInstance } = useTranslation();
  const isAr = i18nInstance.language === "ar";

  const toggle = () => {
    const next = isAr ? "en" : "ar";
    i18n.changeLanguage(next);
    localStorage.setItem("basmah-lang", next);
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = next;
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/40 text-primary text-xs font-black hover:bg-primary hover:text-black transition-all"
    >
      {isAr ? "EN" : "عربي"}
    </button>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-primary uppercase">O ONE</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/teams" className="text-sm font-semibold hover:text-primary transition-colors">{t("nav_teams")}</Link>
            <Link href="/marketplace" className="text-sm font-semibold hover:text-primary transition-colors">{t("nav_marketplace")}</Link>
            <Link href="/orders" className="text-sm font-semibold hover:text-primary transition-colors">{t("nav_orders")}</Link>
            <Link href="/track" className="text-sm font-semibold hover:text-primary transition-colors">{t("nav_track")}</Link>
            <Link href="/stats" className="text-sm font-semibold hover:text-primary transition-colors">{t("nav_stats")}</Link>
            <LangToggle />
          </nav>

          <div className="md:hidden flex items-center gap-3">
            <LangToggle />
            <button
              className="text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background pt-16 border-b border-border px-4 flex flex-col gap-6 font-semibold text-lg">
          <Link href="/teams"  onClick={() => setIsMenuOpen(false)} className="block py-2">{t("nav_teams")}</Link>
          <Link href="/marketplace" onClick={() => setIsMenuOpen(false)} className="block py-2">{t("nav_marketplace")}</Link>
          <Link href="/orders" onClick={() => setIsMenuOpen(false)} className="block py-2">{t("nav_orders")}</Link>
          <Link href="/track"  onClick={() => setIsMenuOpen(false)} className="block py-2">{t("nav_track")}</Link>
          <Link href="/stats"  onClick={() => setIsMenuOpen(false)} className="block py-2">{t("nav_stats")}</Link>
        </div>
      )}

      <main className="flex-1 flex flex-col relative z-0 pt-16">
        {children}
      </main>
    </div>
  );
}
