import express from "express";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";
import {
  getAdminPlans,
  togglePlanStatus
} from "../controllers/adminPlansController.js";

const router = express.Router();

router.get("/", protectAdmin(["SUPER_ADMIN", "MANAGER"]), getAdminPlans);
router.patch("/:id/toggle", protectAdmin(["SUPER_ADMIN"]), togglePlanStatus);

export default router;
