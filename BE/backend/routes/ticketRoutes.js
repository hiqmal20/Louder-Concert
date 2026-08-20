import { Router } from "express";
import { getByOrder, validate } from "../controllers/ticketController.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorizeAdmin from "../middlewares/roleMiddleware.js";

const router = Router();

router.get("/order/:orderId", authenticate, getByOrder);
router.post("/validate",      authenticate, authorizeAdmin, validate);

export default router;
