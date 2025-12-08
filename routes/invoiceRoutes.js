// routes/invoiceRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  downloadInvoiceById,
  downloadInvoiceForPayment,
} from "../controllers/invoiceController.js";

const router = express.Router();

/*
  Mounted in server.js as:
    app.use("/api/invoices", invoiceRoutes);

  Final endpoints:
    GET /api/invoices/:id/download
    GET /api/invoices/payment/:paymentId/download
*/

// User/admin can download invoice by invoice id
router.get(
  "/:id/download",
  protect(["user", "superAdmin", "admin", "staffAdmin"]),
  downloadInvoiceById
);

// Or download invoice associated with a specific payment
router.get(
  "/payment/:paymentId/download",
  protect(["user", "superAdmin", "admin", "staffAdmin"]),
  downloadInvoiceForPayment
);

export default router;
