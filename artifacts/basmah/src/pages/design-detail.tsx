import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Store, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { label } from "framer-motion/client";

interface DesignDetail {
  id: number; shopId: number; title: string;
  description: string | null; imageUrl: string;
  price: number; category: string; tags: string | null;
  shopName: string; shopLogo: string | null; shopContact: string | null;
  createdAt: string;
}

const GOVERNORATES = [
  "عمان", "إربد", "الزرقاء", "البلقاء", "المفرق",
  "الكرك", "معان", "العقبة", "جرش", "عجلون", "الطفيلة", "مادبا",
];

const CITY_SUGGESTIONS: Record<string, string[]> = {
  "عمان": ["جبل عمان", "خلدا", "عبدون", "دابوق", "الشميساني", "طبربور", "الجاردنز", "المقابلين", "ماركا", "الهاشمي", "نزال", "وادي السير", "بيادر وادي السير", "الحسينية", "ناعور", "الجيزة", "أم البساتين", "الموقر", "القويسمة", "الجويدة", "أبو علندا", "سحاب", "خريبة السوق", "الرابية", "الشرفات", "اليادودة", "بدر", "اليرموك", "الصويفية", "اللويبدة", "العبدلي", "وسط المدينة"],
  "إربد": ["وسط إربد", "الحصن", "الرمثا", "بني كنانة", "الكورة", "الأغوار الشمالية", "المشارع", "الشونة الشمالية", "الصريح", "النعيمة"],
  "الزرقاء": ["وسط الزرقاء", "الرصيفة", "الهاشمية", "الأزرق", "الظليل", "بيرين"],
  "البلقاء": ["السلط", "الشونة الجنوبية", "دير علا", "ماحص", "الفحيص", "عرجان"],
  "المفرق": ["وسط المفرق", "البادية الشمالية", "الرويشد", "الصفاوي", "أم الجمال"],
  "الكرك": ["وسط الكرك", "المزار الجنوبي", "القصر", "الأغوار الجنوبية", "ذراع", "فقعوع"],
  "معان": ["وسط معان", "الشوبك", "وادي موسى", "البتراء"],
  "العقبة": ["وسط العقبة", "وادي رم"],
  "جرش": ["وسط جرش", "سوف", "بليلا"],
  "عجلون": ["وسط عجلون", "كفرنجة", "عرجان", "صخرة"],
  "الطفيلة": ["وسط الطفيلة", "بصيرا", "الحسا"],
  "مادبا": ["وسط مادبا", "ذيبان", "ماعين", "فلسطين", "الخالدية"],
};

export default function DesignDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [design, setDesign] = useState<DesignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", customerCity: "", governorate: "عمان", address: "", quantity: 1, notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/marketplace/designs/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setDesign(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    setErr("");
    if (!form.customerName || !form.customerPhone || !form.customerCity || !form.governorate) {
      setErr("يرجى ملء الحقول المطلوبة"); return;
    }
    if (!/^07\d{8}$/.test(form.customerPhone)) { setErr("رقم الهاتف غير صحيح"); return; }
    setSubmitting(true);
    try {
      const r = await fetch("/api/marketplace/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId: Number(id), ...form }),
      });
      if (!r.ok) { const e = await r.json(); setErr(e.error || "فشل"); return; }
      setDone(true);
    } catch { setErr("فشل الاتصال"); } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="w-full py-20 flex justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!design) return (
    <div className="w-full py-20 text-center">
      <p className="text-muted-foreground">التصميم غير موجود</p>
      <Button onClick={() => setLocation("/marketplace")} variant="link" className="mt-2">عودة للسوق</Button>
    </div>
  );

  if (done) return (
    <div className="w-full py-20 container mx-auto px-4 max-w-lg text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-black mb-2">تم الطلب بنجاح!</h2>
      <p className="text-muted-foreground mb-6">سنقوم بالتواصل معك قريباً لتأكيد الطلب والتوصيل</p>
      <Button onClick={() => setLocation("/marketplace")} className="bg-primary text-black font-black hover:bg-primary/90">
        العودة للسوق
      </Button>
    </div>
  );

  return (
    <div className="w-full py-10 container mx-auto px-4 max-w-5xl">
      <button onClick={() => setLocation("/marketplace")} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mb-6">
        <ArrowRight size={16} /> عودة للسوق
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="rounded-2xl overflow-hidden bg-card border border-border">
            <img src={design.imageUrl} alt={design.title} className="w-full aspect-square object-cover" />
          </div>
        </motion.div>

        {/* Info + Order */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Store size={16} />
            <span>{design.shopName}</span>
          </div>
          <h1 className="text-3xl font-black mb-2">{design.title}</h1>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-black text-primary">{design.price} د.أ</span>
            <span className="text-xs text-muted-foreground">للقطعة الواحدة</span>
          </div>

          {design.description && (
            <p className="text-muted-foreground text-sm mb-6">{design.description}</p>
          )}

          <div className="rounded-xl bg-card border border-border p-5 space-y-4">
            <h3 className="font-black text-sm">طلب التصميم</h3>

            {err && <p className="text-red-500 text-xs">{err}</p>}

            <Input placeholder="الاسم الكامل *" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} className="bg-background border-border" />
            <Input placeholder="رقم الهاتف 07XXXXXXXX *" value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value.replace(/[^0-9]/g, "").slice(0, 10) }))} className="bg-background border-border" />

            {/* Single location field: governorate dropdown + city suggestions */}
            <div className="space-y-1">
              <select
                value={form.governorate}
                onChange={e => { setForm(f => ({ ...f, governorate: e.target.value, customerCity: "" })); }}
                className="w-full h-11 rounded-lg bg-background border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">اختر المحافظة *</option>
                {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {form.governorate && (
                <div className="flex flex-wrap gap-1">
                  {CITY_SUGGESTIONS[form.governorate]?.slice(0, 6).map(s => (
                    <button
                      key={s} type="button"
                      onClick={() => setForm(f => ({ ...f, customerCity: s }))}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-all ${form.customerCity === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <Input placeholder="أو اكتب اسم المنطقة/المدينة *" value={form.customerCity} onChange={e => setForm(f => ({ ...f, customerCity: e.target.value }))} className="bg-background border-border" />
            </div>

            <Input placeholder="العنوان التفصيلي (اختياري)" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="bg-background border-border" />

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground shrink-0">الكمية:</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setForm(f => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-bold">-</button>
                <span className="w-8 text-center font-bold">{form.quantity}</span>
                <button onClick={() => setForm(f => ({ ...f, quantity: Math.min(99, f.quantity + 1) }))} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-bold">+</button>
              </div>
              <span className="text-xs text-muted-foreground mr-auto">
                المجموع: <span className="text-primary font-black">{design.price * form.quantity} د.أ</span>
              </span>
            </div>

            <Textarea placeholder="ملاحظات (اختياري)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="bg-background border-border min-h-[60px]" />

            <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-primary text-black font-black hover:bg-primary/90 h-12 text-base">
              {submitting ? "جاري الإرسال..." : `تأكيد الطلب · ${design.price * form.quantity} د.أ`}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
