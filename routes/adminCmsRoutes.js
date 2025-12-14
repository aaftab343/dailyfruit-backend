import express from "express";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";
import { saveAnnouncement, getAnnouncement } from "../controllers/adminCmsController.js";

const router = express.Router();

router.post("/announcement", protectAdmin(["SUPER_ADMIN","MANAGER"]), saveAnnouncement);
router.get("/announcement", protectAdmin(["SUPER_ADMIN","MANAGER"]), getAnnouncement);

export default router;
