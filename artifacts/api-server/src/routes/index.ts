import { Router, type IRouter } from "express";
import healthRouter from "./health";
import teamsRouter from "./teams";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import storageRouter from "./storage";
import branchRouter from "./branch";
import removeBgRouter from "./remove-bg";
import { adminAuth } from "../middleware/adminAuth";

const router: IRouter = Router();

/* ── Admin auth guard: all /admin/* routes require x-admin-key ── */
router.use((req, res, next) => {
  if (req.path.startsWith("/admin")) return adminAuth(req, res, next);
  next();
});
/* ── Upload auth guard: only admins may request presigned upload URLs ── */
router.use((req, res, next) => {
  if (req.method === "POST" && req.path === "/storage/uploads/request-url") {
    return adminAuth(req, res, next);
  }
  next();
});

router.use(healthRouter);
router.use(teamsRouter);
router.use(ordersRouter);
router.use(adminRouter);
router.use(storageRouter);
router.use(branchRouter);
router.use(removeBgRouter);

export default router;
