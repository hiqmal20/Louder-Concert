import { Router } from "express";
import { getAll, getOne, create, update, remove, getSalesSummary } from "../controllers/eventController.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorizeAdmin from "../middlewares/roleMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

const eventUpload = upload.fields([
  { name: "poster", maxCount: 1 },
  { name: "lineup_poster", maxCount: 1 },
]);

router.get("/",                  getAll);
router.get("/:id",               getOne);
router.get("/:id/sales-summary", authenticate, authorizeAdmin, getSalesSummary);
router.post("/",                 authenticate, authorizeAdmin, eventUpload, create);
router.put("/:id",               authenticate, authorizeAdmin, eventUpload, update);
router.delete("/:id",            authenticate, authorizeAdmin, remove);

export default router;
