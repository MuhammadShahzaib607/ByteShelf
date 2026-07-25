import express from "express";
import { scanCarton } from "../controllers/carton.js";
import { verifyToken } from "../utils/middlewares/verifyToken.js";
import { verifyWorker } from "../utils/middlewares/verifyWorker.js";

const router = express.Router();

router.post("/scan", verifyToken, verifyWorker, scanCarton);

export default router;