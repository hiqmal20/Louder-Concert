import { Router } from "express";
import { getAll, updateProfile, toggleActive } from "../controllers/userController.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorizeAdmin from "../middlewares/roleMiddleware.js";

const router = Router();

router.get("/",                    authenticate, authorizeAdmin, getAll);
router.put("/me",                  authenticate, updateProfile);
router.patch("/:id/toggle-active", authenticate, authorizeAdmin, toggleActive);

export default router;
