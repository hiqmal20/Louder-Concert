import { Router } from "express";
import { getAll, getOne, create, update, remove } from "../controllers/posterController.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorizeAdmin from "../middlewares/roleMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/",       getAll);
router.get("/:id",    getOne);
router.post("/",      authenticate, authorizeAdmin, upload.single("poster"), create);
router.put("/:id",    authenticate, authorizeAdmin, upload.single("poster"), update);
router.delete("/:id", authenticate, authorizeAdmin, remove);

export default router;
