  import express from "express";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";
import { getAdminPayments } from "../controllers/adminPaymentsController.js";

const router = express.Router();

router.get("/", protectAdmin(["SUPER_ADMIN","MANAGER"]), getAdminPayments);

export default router;
