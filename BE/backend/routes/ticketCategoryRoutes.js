import { Router } from "express";
import { getAll, getByEvent, create, update, remove } from "../controllers/ticketCategoryController.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorizeAdmin from "../middlewares/roleMiddleware.js";

const router = Router();

router.get("/",               authenticate, getAll);
router.get("/event/:eventId", getByEvent);
router.post("/",              authenticate, authorizeAdmin, create);
router.put("/:id",            authenticate, authorizeAdmin, update);
router.delete("/:id",         authenticate, authorizeAdmin, remove);

export default router;
