import express from "express";
import { scanCarton } from "../controllers/carton.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/scan", verifyToken, scanCarton);

export default router;