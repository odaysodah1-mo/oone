import { useListOrders } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const statusMap = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50" },
  confirmed: { label: "مؤكد", color: "bg-blue-500/20 text-blue-500 border-blue-500/50" },
  shipped: { label: "مشحون", color: "bg-purple-500/20 text-purple-500 border-purple-500/50" },
  delivered: { label: "مُسلم", color: "bg-primary/20 text-primary border-primary/50" },
};

export default function Orders() {
  const { data: orders, isLoading } = useListOrders();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black mb-12 uppercase text-center">تتبع <span className="text-primary">طلباتك</span></h1>

        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full bg-card" />
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="flex items-center gap-6">
                  <div 
                    className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-border shadow-inner"
                    style={{ backgroundColor: order.color }}
                  >
                    <span className="font-black text-white mix-blend-difference drop-shadow-md text-xl">{order.jerseyNumber}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold">{order.teamName}</h3>
                      <Badge variant="outline" className={statusMap[order.status].color}>
                        {statusMap[order.status].label}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground font-medium">الاسم: <span className="text-foreground uppercase">{order.customerName}</span> | المقاس: <span className="text-foreground uppercase">{order.size}</span></p>
                    <p className="text-sm text-muted-foreground mt-1">تاريخ الطلب: {new Date(order.createdAt).toLocaleDateString('ar-JO')}</p>
                  </div>
                </div>
                
                <div className="text-left md:text-right w-full md:w-auto border-t md:border-t-0 border-border pt-4 md:pt-0">
                  <p className="text-sm text-muted-foreground mb-1">المبلغ الإجمالي</p>
                  <p className="text-3xl font-black text-primary">{order.totalPrice} د.أ</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-card border border-border">
            <h3 className="text-2xl font-bold text-muted-foreground">لا توجد طلبات سابقة</h3>
          </div>
        )}
      </div>
    </div>
  );
}
