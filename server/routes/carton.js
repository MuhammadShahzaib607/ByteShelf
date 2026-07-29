import express from "express";
import { scanCarton, addCartons } from "../controllers/carton.js";
import { verifyToken } from "../utils/middlewares/verifyToken.js";
import { verifyWorker } from "../utils/middlewares/verifyWorker.js";

const router = express.Router();

router.post("/scan", verifyToken, verifyWorker, scanCarton);
router.post("/add/:inboundPlanId", verifyToken, addCartons);

export default router;