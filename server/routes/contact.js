import express from "express";
import { createContact, getContacts, resolveContact } from "../controllers/contact.js";
import { verifyToken } from "../utils/middlewares/verifyToken.js";
import { verifyAdmin } from "../utils/middlewares/verifyAdmin.js";

const router = express.Router();

// Public route — anyone can submit a contact inquiry
router.post("/", createContact);

// Admin-only routes
router.get("/", verifyToken, verifyAdmin, getContacts);
router.patch("/:contactId/resolve", verifyToken, verifyAdmin, resolveContact);

export default router;
