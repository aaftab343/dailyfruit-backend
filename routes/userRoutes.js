import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMe,
  getMyAddresses,
  addUserAddress
} from "../controllers/userController.js";

const router = express.Router();

router.get("/me", protect(["user"]), getMe);
router.get("/me/addresses", protect(["user"]), getMyAddresses);
router.post("/me/addresses", protect(["user"]), addUserAddress);

export default router;
