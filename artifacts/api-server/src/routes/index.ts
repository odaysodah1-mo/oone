import { Router, type IRouter } from "express";
import healthRouter from "./health";
import teamsRouter from "./teams";
import ordersRouter from "./orders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(teamsRouter);
router.use(ordersRouter);

export default router;
