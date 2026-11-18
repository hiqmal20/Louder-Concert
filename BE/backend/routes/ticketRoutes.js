import { Router } from "express";
import { getByOrder, validate, getRecentScans, getTicketStats } from "../controllers/ticketController.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorizeAdmin from "../middlewares/roleMiddleware.js";

const router = Router();

router.get("/order/:orderId", authenticate, getByOrder);
router.post("/validate",      authenticate, authorizeAdmin, validate);
router.get("/recent-scans",   authenticate, authorizeAdmin, getRecentScans);
router.get("/stats",          authenticate, authorizeAdmin, getTicketStats);

export default router;
