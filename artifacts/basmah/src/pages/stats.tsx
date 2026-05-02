import { useGetOrderStats } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, TrendingUp, Users, Shirt } from "lucide-react";

export default function Stats() {
  const { data: stats, isLoading } = useGetOrderStats();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black mb-12 uppercase text-center"><span className="text-primary">إحصائيات</span> بصمة</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full bg-card" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-card border border-border p-6 flex items-center gap-6"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <TrendingUp size={32} />
              </div>
              <div>
                <p className="text-muted-foreground font-medium mb-1">إجمالي الطلبات</p>
                <p className="text-4xl font-black">{stats.totalOrders}</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-card border border-border p-6 flex items-center gap-6"
            >
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                <Trophy size={32} />
              </div>
              <div>
                <p className="text-muted-foreground font-medium mb-1">الفريق الأكثر طلباً</p>
                <p className="text-2xl font-black leading-tight">{stats.topTeam || "لا يوجد"}</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-card border border-border p-6 flex items-center gap-6"
            >
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500">
                <Shirt size={32} />
              </div>
              <div>
                <p className="text-muted-foreground font-medium mb-1">المقاس الشائع</p>
                <p className="text-4xl font-black uppercase">{stats.popularSize || "-"}</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-card border border-border p-6 flex items-center gap-6"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-inner" style={{ backgroundColor: stats.popularColor || 'transparent', border: stats.popularColor ? 'none' : '2px dashed var(--border)' }}>
              </div>
              <div>
                <p className="text-muted-foreground font-medium mb-1">اللون الشائع</p>
                <p className="text-xl font-bold uppercase">{stats.popularColor || "-"}</p>
              </div>
            </motion.div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
