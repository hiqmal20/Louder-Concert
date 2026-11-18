import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/landingSettingsController.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorizeAdmin from "../middlewares/roleMiddleware.js";

const router = Router();

router.get("/", getSettings);
router.put("/", authenticate, authorizeAdmin, updateSettings);

export default router;
