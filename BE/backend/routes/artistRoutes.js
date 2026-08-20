import { Router } from "express";
import { getAll, getOne, create, update, remove } from "../controllers/artistController.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorizeAdmin from "../middlewares/roleMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/",       getAll);
router.get("/:id",    getOne);
router.post("/",      authenticate, authorizeAdmin, upload.single("photo"), create);
router.put("/:id",    authenticate, authorizeAdmin, upload.single("photo"), update);
router.delete("/:id", authenticate, authorizeAdmin, remove);

export default router;
