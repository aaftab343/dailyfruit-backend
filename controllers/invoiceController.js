// controllers/invoiceController.js

import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";

const isAdminRole = (role) =>
  ["superAdmin", "admin", "staffAdmin"].includes(role);

const getUserRole = (req) => (req.user && req.user.role) || null;

/* -----------------------------------------
   EXISTING: download by stored Invoice ID
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

    // Non-admin must own the invoice
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
   BRANDED INVOICE FOR A PAYMENT
   (/api/invoices/payment/:paymentId/download)
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

    // Normal user can only download own invoice
    if (!isAdminRole(role)) {
      if (!payment.userId || payment.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    // ---------- PDF SETUP ----------
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${payment._id}.pdf`
    );

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(res);

    const gradientStart = "#06b6d4";
    const gradientEnd = "#7c3aed";
    const lightRow = "#f3f4ff";
    const textDark = "#0f172a";

    /* ---------------------------------
       HEADER BAR + LOGO + TITLE
    ---------------------------------- */
    // Gradient bar
    const headerHeight = 70;
    const barTop = 40;
    const barLeft = 40;
    const barWidth = doc.page.width - 80;

    const grad = doc
      .linearGradient(barLeft, barTop, barLeft + barWidth, barTop + headerHeight);
    grad.stop(0, gradientStart).stop(1, gradientEnd);

    doc.rect(barLeft, barTop, barWidth, headerHeight).fill(grad);

    // DF circle logo
    const logoCx = barLeft + 40;
    const logoCy = barTop + headerHeight / 2;
    doc.circle(logoCx, logoCy, 20).fill("#ffffff");
    doc
      .fillColor("#14b8a6")
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("DF", logoCx - 12, logoCy - 10);

    // Title + tagline
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("INVOICE", logoCx + 40, barTop + 14, { align: "left" });

    doc
      .font("Helvetica")
      .fontSize(10)
      .text("Daily Fruit Co. — Freshness Delivered Daily", logoCx + 40, barTop + 40);

    /* ---------------------------------
       COMPANY INFO + INVOICE META
    ---------------------------------- */
    const topInfoY = barTop + headerHeight + 20;

    // Company (left)
    doc
      .fillColor(textDark)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Daily Fruit Co.", barLeft, topInfoY);

    doc
      .font("Helvetica")
      .fontSize(9)
      .text("Pune, Maharashtra", barLeft, topInfoY + 14)
      .text("Email: dailyfruitco@gmail.com", barLeft, topInfoY + 26)
      .text("Phone: +91-00000 00000", barLeft, topInfoY + 38);

    // Invoice meta (right)
    const metaX = doc.page.width / 2 + 20;
    const createdAt = payment.createdAt || new Date();

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Invoice #:", metaX, topInfoY)
      .font("Helvetica")
      .text(String(payment._id), metaX + 70, topInfoY);

    doc
      .font("Helvetica-Bold")
      .text("Date:", metaX, topInfoY + 14)
      .font("Helvetica")
      .text(new Date(createdAt).toLocaleDateString("en-IN"), metaX + 70, topInfoY + 14);

    doc
      .font("Helvetica-Bold")
      .text("Payment ID:", metaX, topInfoY + 28)
      .font("Helvetica")
      .text(payment.razorpayPaymentId || "-", metaX + 70, topInfoY + 28);

    doc
      .font("Helvetica-Bold")
      .text("Order ID:", metaX, topInfoY + 42)
      .font("Helvetica")
      .text(payment.razorpayOrderId || "-", metaX + 70, topInfoY + 42);

    /* ---------------------------------
       BILL TO BOX
    ---------------------------------- */
    const billTop = topInfoY + 70;

    // Title strip
    const billStripHeight = 20;
    doc
      .rect(barLeft, billTop, barWidth, billStripHeight)
      .fill(gradientEnd);

    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("Bill To", barLeft + 10, billTop + 4);

    // Box
    const billBoxHeight = 70;
    doc
      .rect(barLeft, billTop + billStripHeight, barWidth, billBoxHeight)
      .lineWidth(1)
      .strokeColor(gradientEnd)
      .stroke();

    const billContentY = billTop + billStripHeight + 10;
    const customerName = payment.userName || "Customer";
    const customerEmail = payment.userEmail || "";
    const customerPhone = payment.userPhone || "";

    doc
      .fillColor(textDark)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(customerName, barLeft + 10, billContentY);

    doc
      .font("Helvetica")
      .fontSize(9)
      .text(customerEmail, barLeft + 10, billContentY + 14);

    if (customerPhone) {
      doc.text(`Phone: ${customerPhone}`, barLeft + 10, billContentY + 28);
    }

    /* ---------------------------------
       ITEMS TABLE (single plan row)
    ---------------------------------- */
    const tableTop = billTop + billStripHeight + billBoxHeight + 30;

    const col = {
      qty: barLeft + 10,
      desc: barLeft + 80,
      unit: barLeft + 300,
      amt: barLeft + 390
    };

    // Header row
    doc
      .rect(barLeft, tableTop, barWidth, 22)
      .fill(gradientStart);

    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Qty", col.qty, tableTop + 6)
      .text("Description", col.desc, tableTop + 6)
      .text("Unit Price", col.unit, tableTop + 6)
      .text("Amount", col.amt, tableTop + 6);

    // Data row (plan)
    const rowTop = tableTop + 22;
    doc
      .rect(barLeft, rowTop, barWidth, 22)
      .fill(lightRow);

    const planName = payment.planName || "Subscription Plan";

    doc
      .fillColor(textDark)
      .font("Helvetica")
      .fontSize(10)
      .text("1", col.qty, rowTop + 6)
      .text(planName, col.desc, rowTop + 6, { width: 200 })
      .text(`₹${Number(payment.amount || 0).toFixed(2)}`, col.unit, rowTop + 6)
      .text(`₹${Number(payment.amount || 0).toFixed(2)}`, col.amt, rowTop + 6);

    /* ---------------------------------
       TOTALS
    ---------------------------------- */
    const totalsTop = rowTop + 40;
    const totalsLabelX = col.amt - 60;
    const totalAmount = Number(payment.amount || 0).toFixed(2);

    doc
      .font("Helvetica")
      .fontSize(10)
      .text("Subtotal:", totalsLabelX, totalsTop)
      .text(`₹${totalAmount}`, totalsLabelX + 90, totalsTop, { align: "right" });

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("Total:", totalsLabelX, totalsTop + 18)
      .text(`₹${totalAmount}`, totalsLabelX + 90, totalsTop + 18, { align: "right" });

    /* ---------------------------------
       FOOTER NOTE
    ---------------------------------- */
    const footerTop = totalsTop + 60;

    doc
      .moveTo(barLeft, footerTop)
      .lineTo(doc.page.width - barLeft, footerTop)
      .strokeColor("#e5e7eb")
      .lineWidth(0.5)
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#6b7280")
      .text(
        "Thank you for choosing Daily Fruit Co. If you have any questions about this invoice, " +
          "please email dailyfruitco@gmail.com.",
        barLeft,
        footerTop + 10,
        { width: barWidth, align: "center" }
      );

    doc.end();
  } catch (err) {
    console.error("downloadInvoiceForPayment error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
