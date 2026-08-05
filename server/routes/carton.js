import express from "express";
import { scanCarton } from "../controllers/carton.js";
import { verifyToken } from "../utils/middlewares/verifyToken.js";
import { verifyWorker } from "../utils/middlewares/verifyWorker.js";

const router = express.Router();

// NOTE: Carton creation is strictly enforced via inbound plan creation from the
// My Bookings page. The standalone "add cartons" endpoint was removed to keep
// the flow airtight (cartons are only ever created through createInboundPlan).
router.post("/scan", verifyToken, verifyWorker, scanCarton);

export default router;