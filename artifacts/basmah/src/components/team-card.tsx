import { motion } from "framer-motion";
import { Link } from "wouter";
import { Team } from "@workspace/api-client-react/src/generated/api.schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TeamCard({ team, index = 0 }: { team: Team; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className="h-full"
    >
      <Link href={`/teams/${team.id}`} className="block h-full group outline-none">
        <Card className="h-full overflow-hidden bg-card border-border hover:border-primary/50 transition-colors duration-300 relative group">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 z-10" />
          
          {/* Abstract jersey pattern background */}
          <div 
            className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500 bg-[size:20px_20px]"
            style={{
              backgroundColor: team.primaryColor,
              backgroundImage: `linear-gradient(45deg, ${team.secondaryColor} 25%, transparent 25%, transparent 75%, ${team.secondaryColor} 75%, ${team.secondaryColor}), linear-gradient(45deg, ${team.secondaryColor} 25%, transparent 25%, transparent 75%, ${team.secondaryColor} 75%, ${team.secondaryColor})`,
              backgroundPosition: '0 0, 10px 10px',
              backgroundSize: '20px 20px'
            }}
          />
          
          <CardContent className="p-6 relative z-20 h-full flex flex-col justify-end min-h-[240px]">
            <div className="absolute top-4 right-4 flex gap-2">
              <Badge variant="secondary" className="bg-black/50 text-white backdrop-blur-sm border-white/10">{team.country}</Badge>
            </div>
            
            <div className="mt-auto">
              <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{team.name}</h3>
              <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{team.nameEn}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-primary font-bold text-lg">{team.basePrice} ر.س</span>
                <span className="text-xs bg-white/10 text-white px-2 py-1 rounded border border-white/10">{team.league}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
