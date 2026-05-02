import { Router } from "express";
import { db } from "@workspace/db";
import { teamsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { GetTeamParams } from "@workspace/api-zod";

const router = Router();

router.get("/teams", async (req, res) => {
  try {
    const teams = await db.select().from(teamsTable).orderBy(teamsTable.name);
    const result = teams.map((t) => ({
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
    const teams = await db
      .select()
      .from(teamsTable)
      .where(eq(teamsTable.isPopular, true))
      .orderBy(desc(teamsTable.orderCount))
      .limit(8);
    const result = teams.map((t) => ({
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
    const [team] = await db
      .select()
      .from(teamsTable)
      .where(eq(teamsTable.id, parsed.data.id));
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
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
