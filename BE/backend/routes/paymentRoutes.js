import { Router } from "express";
import { getByOrder, create, verify } from "../controllers/paymentController.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorizeAdmin from "../middlewares/roleMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/order/:orderId", authenticate, getByOrder);
router.post("/",              authenticate, upload.single("proof"), create);
router.patch("/:id/verify",   authenticate, authorizeAdmin, verify);

export default router;
