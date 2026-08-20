import { Router } from "express";
import { getAll, getOne, create, update, remove, getSalesSummary } from "../controllers/eventController.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorizeAdmin from "../middlewares/roleMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/",                  getAll);
router.get("/:id",               getOne);
router.get("/:id/sales-summary", authenticate, authorizeAdmin, getSalesSummary);
router.post("/",                 authenticate, authorizeAdmin, upload.single("poster"), create);
router.put("/:id",               authenticate, authorizeAdmin, upload.single("poster"), update);
router.delete("/:id",            authenticate, authorizeAdmin, remove);

export default router;
