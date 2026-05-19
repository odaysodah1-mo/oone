import { Router } from "express";
import { GetTeamParams } from "@workspace/api-zod";
import { supabase, toCamelCaseArr, toCamelCaseSingle } from "../lib/supabase-db";

const router = Router();

router.get("/teams", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    const result = toCamelCaseArr(data || []).map((t: any) => ({
      ...t,
      availableColors: JSON.parse(t.availableColors),
      availableSizes: JSON.parse(t.availableSizes),
    }));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list teams");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/teams/popular", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("is_popular", true)
      .order("order_count", { ascending: false })
      .limit(8);
    if (error) throw error;
    const result = toCamelCaseArr(data || []).map((t: any) => ({
      ...t,
      availableColors: JSON.parse(t.availableColors),
      availableSizes: JSON.parse(t.availableSizes),
    }));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get popular teams");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/teams/:id", async (req, res) => {
  const parsed = GetTeamParams.safeParse({ id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid team id" });
    return;
  }
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("id", parsed.data.id)
      .single();
    if (error || !data) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    const team = toCamelCaseSingle(data);
    res.json({
      ...team,
      availableColors: JSON.parse(team.availableColors),
      availableSizes: JSON.parse(team.availableSizes),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get team");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
