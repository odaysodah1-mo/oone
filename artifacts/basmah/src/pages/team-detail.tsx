import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetTeam } from "@workspace/api-client-react";
import { getGetTeamQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { JerseyPreview3D } from "@/components/jersey-3d";
import { useOrder } from "@/components/order-context";

// Map of team IDs to their back jersey image URL
const BACK_JERSEY_URLS: Record<number, string> = {
  3: "/jerseys/jordan-back.png", // المنتخب الأردني
};

export default function TeamDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data: team, isLoading } = useGetTeam(Number(id), { 
    query: { enabled: !!id, queryKey: getGetTeamQueryKey(Number(id)) } 
  });
  
  const { updateOrder } = useOrder();

  const [color, setColor] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [number, setNumber] = useState<string>("");

  useEffect(() => {
    if (team && !color && team.availableColors.length > 0) {
      setColor(team.availableColors[0]);
    }
  }, [team]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-12">
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <Skeleton className="w-full max-w-md aspect-[3/4] bg-card rounded-xl" />
        </div>
        <div className="w-full md:w-1/2 space-y-6">
          <Skeleton className="h-12 w-3/4 bg-card" />
          <Skeleton className="h-8 w-1/4 bg-card" />
          <Skeleton className="h-24 w-full bg-card mt-8" />
          <Skeleton className="h-24 w-full bg-card" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">الفريق غير موجود</h2>
        <Button onClick={() => setLocation("/teams")}>العودة للفرق</Button>
      </div>
    );
  }

  const handleContinue = () => {
    if (!size) {
      // show error or just simple validation
      alert("الرجاء اختيار المقاس");
      return;
    }
    
    updateOrder({
      teamId: team.id,
      teamName: team.name,
      basePrice: team.basePrice,
      color: color,
      size: size as any,
      customerName: name || "BASMAH",
      jerseyNumber: number || "10",
      quantity: 1,
      previewColor: color,
      previewName: name || "BASMAH",
      previewNumber: number || "10"
    });
    
    setLocation("/order");
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="flex flex-col md:flex-row gap-12 items-start">
        
        {/* Left Side: Jersey 3D Preview */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center sticky top-24">
          <div className="w-full max-w-[500px] h-[520px] bg-card border border-border relative overflow-hidden">
            {/* Glow background */}
            <div
              className="absolute inset-0 opacity-15 blur-3xl transition-colors duration-700 pointer-events-none"
              style={{ backgroundColor: color || team.primaryColor }}
            />
            {/* Hint text */}
            <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-muted-foreground z-10 pointer-events-none select-none">
              اسحب لتدوير القميص ↔
            </div>
            <div className="w-full h-full relative z-10">
              <JerseyPreview3D
                color={color || team.primaryColor}
                secondaryColor={team.secondaryColor}
                name={name || "BASMAH"}
                number={number || "10"}
                imageUrl={team.logoUrl}
                backImageUrl={id ? BACK_JERSEY_URLS[Number(id)] : undefined}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Customization Options */}
        <div className="w-full md:w-1/2 space-y-10">
          <div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-sm text-sm font-bold">{team.league}</span>
                <span className="bg-card text-muted-foreground px-3 py-1 rounded-sm text-sm font-bold border border-border">{team.country}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight">{team.name}</h1>
              <p className="text-2xl text-muted-foreground uppercase font-bold mt-1">{team.nameEn}</p>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="mt-6">
              <span className="text-4xl font-black text-primary">{team.basePrice} <span className="text-xl text-foreground">د.أ</span></span>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-8 bg-card border border-border p-6 sm:p-8">
            
            {/* Color Selection */}
            <div>
              <Label className="text-lg font-bold block mb-4">اختر اللون</Label>
              <div className="flex flex-wrap gap-4">
                {team.availableColors.map((c) => (
                  <button
                    key={c}
                    className={`w-12 h-12 rounded-full cursor-pointer transition-all duration-200 border-2 ${color === c ? 'border-primary scale-110 shadow-[0_0_15px_rgba(186,255,0,0.5)]' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <Label className="text-lg font-bold block mb-4">اختر المقاس</Label>
              <div className="flex flex-wrap gap-3">
                {team.availableSizes.map((s) => (
                  <button
                    key={s}
                    className={`min-w-16 h-12 px-4 flex items-center justify-center font-bold text-lg transition-all duration-200 border ${
                      size === s 
                        ? 'bg-primary text-black border-primary' 
                        : 'bg-background text-foreground border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Name & Number */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <Label className="text-lg font-bold block mb-2">الاسم على القميص</Label>
                <Input 
                  placeholder="مثال: AHMED" 
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  className="h-14 text-xl bg-background border-border uppercase"
                  maxLength={12}
                />
              </div>
              
              <div>
                <Label className="text-lg font-bold block mb-2">الرقم</Label>
                <Input 
                  placeholder="مثال: 10" 
                  value={number}
                  onChange={(e) => setNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  className="h-14 text-xl bg-background border-border"
                  maxLength={2}
                />
              </div>
            </div>
            
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Button 
              className="w-full h-16 text-2xl font-black bg-primary text-black hover:bg-primary/90 transition-transform active:scale-[0.98]"
              onClick={handleContinue}
              disabled={!size}
            >
              {size ? "إتمام الطلب" : "اختر المقاس أولاً"}
            </Button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
