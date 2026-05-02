import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useCreateOrder, getListOrdersQueryKey, getGetOrderStatsQueryKey, getGetPopularTeamsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrder } from "@/components/order-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { JerseyPreview } from "@/components/jersey-preview";

export default function Order() {
  const [, setLocation] = useLocation();
  const { order, clearOrder } = useOrder();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createOrder = useCreateOrder();

  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  if (!order.teamId) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">لا يوجد طلب حالي</h2>
        <Button onClick={() => setLocation("/teams")}>تصفح الفرق</Button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !city) return;

    createOrder.mutate({
      data: {
        teamId: order.teamId!,
        customerName: order.customerName || "BASMAH",
        jerseyNumber: order.jerseyNumber || "10",
        size: order.size as any,
        color: order.color!,
        quantity: 1,
        customerPhone: phone,
        customerCity: city
      }
    }, {
      onSuccess: () => {
        toast({
          title: "تم تأكيد الطلب بنجاح!",
          description: "سنقوم بالتواصل معك قريباً لتسليم قميصك المميز.",
        });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetOrderStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPopularTeamsQueryKey() });
        clearOrder();
        setLocation("/orders");
      },
      onError: (err) => {
        toast({
          title: "حدث خطأ",
          description: "لم نتمكن من إرسال الطلب، يرجى المحاولة مرة أخرى.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black mb-8 uppercase text-center">تأكيد <span className="text-primary">الطلب</span></h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="bg-card border border-border p-6 flex flex-col items-center"
          >
            <h3 className="text-2xl font-bold mb-6 text-center w-full pb-4 border-b border-border">تفاصيل التصميم</h3>
            <div className="w-48 mb-6">
              <JerseyPreview 
                color={order.previewColor!} 
                name={order.previewName!} 
                number={order.previewNumber!} 
              />
            </div>
            
            <div className="w-full space-y-4 text-lg">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">الفريق</span>
                <span className="font-bold">{order.teamName}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">المقاس</span>
                <span className="font-bold uppercase">{order.size}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">الاسم المطبوع</span>
                <span className="font-bold uppercase">{order.previewName}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">الرقم المطبوع</span>
                <span className="font-bold">{order.previewNumber}</span>
              </div>
              <div className="flex justify-between pt-4">
                <span className="text-xl font-bold">الإجمالي</span>
                <span className="text-2xl font-black text-primary">{order.basePrice} ر.س</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="bg-card border border-border p-6"
          >
            <h3 className="text-2xl font-bold mb-6 pb-4 border-b border-border">بيانات التوصيل</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-lg">رقم الجوال</Label>
                <Input 
                  required
                  placeholder="05xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-14 text-lg bg-background border-border"
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-lg">المدينة</Label>
                <Input 
                  required
                  placeholder="الرياض، جدة، الدمام..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-14 text-lg bg-background border-border"
                />
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={createOrder.isPending}
                  className="w-full h-16 text-2xl font-black bg-primary text-black hover:bg-primary/90 transition-transform active:scale-[0.98]"
                >
                  {createOrder.isPending ? "جاري الإرسال..." : "تأكيد الطلب"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
