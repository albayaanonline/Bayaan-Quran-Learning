import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import surahsRouter from "./surahs";
import progressRouter from "./progress";
import recordingsRouter from "./recordings";
import bookmarksRouter from "./bookmarks";
import achievementsRouter from "./achievements";
import dashboardRouter from "./dashboard";
import leaderboardRouter from "./leaderboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(surahsRouter);
router.use(progressRouter);
router.use(recordingsRouter);
router.use(bookmarksRouter);
router.use(achievementsRouter);
router.use(dashboardRouter);
router.use(leaderboardRouter);

export default router;
