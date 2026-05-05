import { useState } from "react";
import { motion } from "framer-motion";
import { useListTeams } from "@workspace/api-client-react";
import { TeamCard } from "@/components/team-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const LEAGUE_KEYS: Record<string, string> = {
  "منتخبات عالمية - كأس العالم": "league_world_wc",
  "منتخبات عربية - كأس العالم":  "league_arab_wc",
  "دوري المحترفين الأردني":       "league_jordan_pro",
  "المنتخبات الوطنية":            "league_national",
  "الدوري الفرنسي":               "league_french",
  "الدوري الإسباني":              "league_spanish",
  "الدوري الإنجليزي":             "league_english",
};

export default function Teams() {
  const { data: teams, isLoading } = useListTeams();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | string>("all");
  const { t } = useTranslation();

  const leagues = teams ? Array.from(new Set(teams.map(t => t.league))) : [];

  const filteredTeams = teams?.filter(team => {
    const matchesSearch = team.name.includes(search) || team.nameEn.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || team.league === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full py-12 container mx-auto px-4">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-6 uppercase">
          {t("teams_title")} <span className="text-primary">{t("teams_title_accent")}</span>
        </h1>

        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              placeholder={t("teams_search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 h-12 bg-card border-border focus-visible:ring-primary text-lg"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={filter === "all" ? "default" : "outline"}
              className={`cursor-pointer px-4 py-2 text-sm ${filter === "all" ? "bg-primary text-black hover:bg-primary/90" : "hover:border-primary/50"}`}
              onClick={() => setFilter("all")}
            >
              {t("teams_all")}
            </Badge>
            {leagues.map(league => (
              <Badge
                key={league}
                variant={filter === league ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 text-sm ${filter === league ? "bg-primary text-black hover:bg-primary/90" : "hover:border-primary/50"}`}
                onClick={() => setFilter(league)}
              >
                {t(LEAGUE_KEYS[league] ?? league, { defaultValue: league })}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full bg-card" />
          ))
        ) : filteredTeams && filteredTeams.length > 0 ? (
          filteredTeams.map((team, i) => (
            <TeamCard key={team.id} team={team} index={i} />
          ))
        ) : (
          <div className="col-span-full py-24 text-center">
            <p className="text-2xl text-muted-foreground font-bold">{t("teams_no_results")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
