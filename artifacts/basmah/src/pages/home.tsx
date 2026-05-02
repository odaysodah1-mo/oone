import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetPopularTeams } from "@workspace/api-client-react";
import { TeamCard } from "@/components/team-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function Home() {
  const { data: popularTeams, isLoading } = useGetPopularTeams();

  return (
    <div className="w-full flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518605368461-1ee7c532066d?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
        
        <div className="container mx-auto px-4 relative z-10 text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-7xl md:text-9xl font-black text-white mb-6 tracking-tight uppercase" style={{ textShadow: '0 0 40px rgba(186, 255, 0, 0.3)' }}>
              اترك <span className="text-primary">بصمتك</span>
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl md:text-3xl text-gray-300 font-medium max-w-2xl mb-12"
          >
            صمم قميص فريقك المفضل باسمك ورقمك. ارتدي هويتك في الملعب.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Link href="/teams">
              <Button size="lg" className="h-16 px-10 text-xl font-bold rounded-none hover:scale-105 transition-transform bg-primary text-black hover:bg-primary/90">
                ابدأ التصميم الآن
                <ArrowLeft className="ml-2 w-6 h-6 mr-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">كيف تعمل <span className="text-primary">بصمة</span>؟</h2>
            <p className="text-muted-foreground text-lg">ثلاث خطوات بسيطة للحصول على قميصك المخصص</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "اختر فريقك", desc: "اختر من بين أقوى الفرق والمنتخبات العالمية والمحلية." },
              { step: "02", title: "ضع بصمتك", desc: "اختر اللون، المقاس، واطبع اسمك ورقمك المفضل." },
              { step: "03", title: "استلم قميصك", desc: "أكمل الطلب واستلم قميصك الفريد في أسرع وقت." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-background border border-border p-8 relative overflow-hidden group hover:border-primary/50 transition-colors"
              >
                <div className="text-8xl font-black text-muted/20 absolute -top-4 -right-4 group-hover:text-primary/10 transition-colors">
                  {item.step}
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Teams */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-4">الفرق الأكثر <span className="text-primary">شعبية</span></h2>
              <p className="text-muted-foreground text-lg">اختر فريقك المفضل وابدأ التصميم</p>
            </div>
            <Link href="/teams">
              <Button variant="outline" className="hidden md:flex border-primary text-primary hover:bg-primary hover:text-black">
                عرض كل الفرق
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-[300px] w-full bg-card" />
              ))
            ) : popularTeams && popularTeams.length > 0 ? (
              popularTeams.slice(0, 4).map((team, i) => (
                <TeamCard key={team.id} team={team} index={i} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                لا توجد فرق متاحة حالياً
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/teams">
              <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-black">
                عرض كل الفرق
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
