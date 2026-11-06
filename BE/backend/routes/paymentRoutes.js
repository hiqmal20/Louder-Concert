import { Router } from "express";
import {
  getByOrder,
  create,
  verify,
  getMidtransToken,
  simulateMidtransPayment,
  handleMidtransNotification,
  checkMidtransStatus,
} from "../controllers/paymentController.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorizeAdmin from "../middlewares/roleMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/order/:orderId",           authenticate, getByOrder);
router.post("/",                        authenticate, upload.single("proof"), create);
router.patch("/:id/verify",             authenticate, authorizeAdmin, verify);
router.put("/:id/verify",               authenticate, authorizeAdmin, verify);
router.put("/:id",                      authenticate, authorizeAdmin, verify);

// Midtrans Payment Endpoints
router.post("/midtrans/token",          authenticate, getMidtransToken);
router.post("/midtrans/simulate",       authenticate, simulateMidtransPayment);
router.post("/midtrans/check-status",   authenticate, checkMidtransStatus);
router.post("/midtrans/notification",   handleMidtransNotification);

export default router;
