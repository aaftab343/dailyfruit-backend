import express from "express";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";
import { getInventory } from "../controllers/adminInventoryController.js";

const router = express.Router();

router.get("/", protectAdmin(["SUPER_ADMIN","MANAGER"]), getInventory);

export default router;
