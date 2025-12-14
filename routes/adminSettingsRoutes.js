import express from "express";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";
import { getSettings, updateSettings } from "../controllers/adminSettingsController.js";

const router = express.Router();

router.get("/", protectAdmin(["SUPER_ADMIN"]), getSettings);
router.put("/", protectAdmin(["SUPER_ADMIN"]), updateSettings);

export default router;
