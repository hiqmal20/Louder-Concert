import { Router } from "express";
import { getAll, getOne, create, updateStatus } from "../controllers/orderController.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorizeAdmin from "../middlewares/roleMiddleware.js";

const router = Router();

router.get("/",             authenticate, getAll);
router.get("/:id",          authenticate, getOne);
router.post("/",            authenticate, create);
router.patch("/:id/status", authenticate, authorizeAdmin, updateStatus);

export default router;
