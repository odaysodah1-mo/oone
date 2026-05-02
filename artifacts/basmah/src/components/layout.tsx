import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-primary uppercase">بصمة</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/teams" className="text-sm font-semibold hover:text-primary transition-colors">الفِرَق</Link>
            <Link href="/orders" className="text-sm font-semibold hover:text-primary transition-colors">الطلبات</Link>
            <Link href="/stats" className="text-sm font-semibold hover:text-primary transition-colors">الإحصائيات</Link>
          </nav>
          
          <button 
            className="md:hidden text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background pt-16 border-b border-border px-4 flex flex-col gap-6 font-semibold text-lg">
          <Link href="/teams" onClick={() => setIsMenuOpen(false)} className="block py-2">الفِرَق</Link>
          <Link href="/orders" onClick={() => setIsMenuOpen(false)} className="block py-2">الطلبات</Link>
          <Link href="/stats" onClick={() => setIsMenuOpen(false)} className="block py-2">الإحصائيات</Link>
        </div>
      )}

      <main className="flex-1 flex flex-col relative z-0">
        {children}
      </main>

      <footer className="border-t border-border mt-auto bg-card py-12">
        <div className="container mx-auto px-4 text-center">
          <span className="text-3xl font-black text-primary opacity-80 block mb-4">بصمة</span>
          <p className="text-muted-foreground text-sm font-medium">اترك بصمتك. ارتدي هويتك.</p>
        </div>
      </footer>
    </div>
  );
}
