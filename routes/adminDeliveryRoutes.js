import express from "express";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";
import { getTodayDeliveries } from "../controllers/adminDeliveryController.js";

const router = express.Router();

router.get("/today", protectAdmin(["SUPER_ADMIN","MANAGER","DELIVERY_ADMIN"]), getTodayDeliveries);

export default router;
