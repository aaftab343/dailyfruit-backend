// controllers/invoiceController.js

import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";

const isAdminRole = (role) =>
  ["superAdmin", "admin", "staffAdmin"].includes(role);

// Helper: get role from auth middleware
const getUserRole = (req) => (req.user && req.user.role) || null;

/* -----------------------------------------
   DOWNLOAD INVOICE BY INVOICE ID (optional)
   – Uses existing Invoice model + pdfPath
------------------------------------------ */
export const downloadInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const role = getUserRole(req);
    if (!role) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // If not admin, must be the owner
    if (!isAdminRole(role)) {
      if (!invoice.userId || invoice.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    if (!invoice.pdfPath || !fs.existsSync(invoice.pdfPath)) {
      return res.status(404).json({ message: "Invoice file missing" });
    }

    const fileName = path.basename(invoice.pdfPath);
    return res.download(invoice.pdfPath, fileName);
  } catch (err) {
    console.error("downloadInvoiceById error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   DOWNLOAD INVOICE FOR A PAYMENT (MAIN)
   – No need for records in invoices collection
   – Generates simple PDF on the fly
------------------------------------------ */
export const downloadInvoiceForPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const role = getUserRole(req);
    if (!role) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Normal users can only download their own payment invoice
    if (!isAdminRole(role)) {
      if (!payment.userId || payment.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    // ---------- Build PDF in memory ----------
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${payment._id}.pdf`
    );

    const doc = new PDFDocument();
    doc.pipe(res);

    // Title
    doc.fontSize(22).text("Invoice", { align: "center" });
    doc.moveDown();

    // Basic meta
    const created =
      payment.createdAt || new Date();

    doc
      .fontSize(12)
      .text(`Invoice ID: ${payment._id}`)
      .text(`Order ID: ${payment.razorpayOrderId || "-"}`)
      .text(`Payment ID: ${payment.razorpayPaymentId || "-"}`)
      .text(`Date: ${new Date(created).toLocaleString("en-IN")}`)
      .moveDown();

    // Customer details
    doc
      .text(`Customer: ${payment.userName || ""}`)
      .text(`Email: ${payment.userEmail || ""}`)
      .moveDown();

    // Plan & amount
    doc
      .text(`Plan: ${payment.planName}`)
      .text(`Amount: ₹${payment.amount}`)
      .text(`Status: ${payment.status}`)
      .moveDown();

    doc.text("Thank you for choosing Daily Fruit Co.");
    doc.end(); // sends PDF

  } catch (err) {
    console.error("downloadInvoiceForPayment error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
