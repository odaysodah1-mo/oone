import { Router } from "express";

const router = Router();

router.post("/admin/remove-background", (_req, res) => {
  res.status(410).json({ error: "Background removal has been disabled" });
});

export default router;
