import { Router } from "express";
import { getAll, checkPromo, create, update, remove } from "../controllers/promoController.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorizeAdmin from "../middlewares/roleMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/",          getAll);
router.post("/check",    authenticate, checkPromo);
router.post("/",         authenticate, authorizeAdmin, upload.single("banner"), create);
router.put("/:id",       authenticate, authorizeAdmin, upload.single("banner"), update);
router.delete("/:id",    authenticate, authorizeAdmin, remove);

export default router;
