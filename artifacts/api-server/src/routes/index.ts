import { Router, type IRouter } from "express";
import healthRouter from "./health";
import teamsRouter from "./teams";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import storageRouter from "./storage";
import branchRouter from "./branch";

const router: IRouter = Router();

router.use(healthRouter);
router.use(teamsRouter);
router.use(ordersRouter);
router.use(adminRouter);
router.use(storageRouter);
router.use(branchRouter);

export default router;
