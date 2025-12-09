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
   DOWNLOAD INVOICE BY INVOICE ID (existing)
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
   Styled Invoice PDF (for a Payment)
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

    if (!isAdminRole(role)) {
      if (!payment.userId || payment.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    // ---- PDF headers ----
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${payment._id}.pdf`
    );

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(res);

    // Colors
    const mainColor = "#5B355F"; // purple header
    const lightRow = "#F7F2F9";

    // ---------- HEADER BAR ----------
    doc.rect(40, 40, doc.page.width - 80, 50)
      .fill(mainColor);

    doc
      .fillColor("#FFFFFF")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("INVOICE", 0, 55, { align: "center" });

    doc
      .fontSize(11)
      .font("Helvetica")
      .text("Daily Fruit Co.", 0, 78, { align: "center" });

    doc.moveDown();

    // ---------- COMPANY & INVOICE META ----------
    const topY = 110;

    // Company block (left)
    doc
      .fillColor("#000000")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Daily Fruit Co.", 40, topY);

    doc
      .font("Helvetica")
      .text("Pune, Maharashtra", 40, topY + 15)
      .text("Email: dailyfruitco@gmail.com", 40, topY + 30)
      .text("Phone: +91-00000 00000", 40, topY + 45);

    // Invoice meta (right)
    const createdAt = payment.createdAt || new Date();
    const rightX = doc.page.width / 2 + 20;

    doc
      .font("Helvetica-Bold")
      .text("Invoice #:", rightX, topY)
      .font("Helvetica")
      .text(String(payment._id), rightX + 70, topY);

    doc
      .font("Helvetica-Bold")
      .text("Date:", rightX, topY + 15)
      .font("Helvetica")
      .text(new Date(createdAt).toLocaleDateString("en-IN"), rightX + 70, topY + 15);

    doc
      .font("Helvetica-Bold")
      .text("Payment ID:", rightX, topY + 30)
      .font("Helvetica")
      .text(payment.razorpayPaymentId || "-", rightX + 70, topY + 30);

    doc
      .font("Helvetica-Bold")
      .text("Order ID:", rightX, topY + 45)
      .font("Helvetica")
      .text(payment.razorpayOrderId || "-", rightX + 70, topY + 45);

    // ---------- BILL TO ----------
    const billToTop = topY + 80;

    // Bill To title bar
    doc
      .rect(40, billToTop, doc.page.width - 80, 20)
      .fill(mainColor);

    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("Bill To", 50, billToTop + 4);

    // Bill To content box
    doc
      .rect(40, billToTop + 20, doc.page.width - 80, 70)
      .strokeColor(mainColor)
      .lineWidth(1)
      .stroke();

    const billY = billToTop + 30;

    doc
      .fillColor("#000000")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(payment.userName || "", 50, billY);

    doc
      .font("Helvetica")
      .text(payment.userEmail || "", 50, billY + 14);

    if (payment.userPhone) {
      doc.text(`Phone: ${payment.userPhone}`, 50, billY + 28);
    }

    // ---------- ITEMS TABLE ----------
    const tableTop = billToTop + 110;
    const colX = {
      sno: 40,
      desc: 80,
      qty: 330,
      price: 390,
      amount: 470
    };

    // Table header background
    doc
      .rect(40, tableTop, doc.page.width - 80, 22)
      .fill(mainColor);

    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Qty", colX.sno + 5, tableTop + 6)
      .text("Description", colX.desc, tableTop + 6)
      .text("Unit Price", colX.price, tableTop + 6)
      .text("Amount", colX.amount, tableTop + 6);

    // Single line item (subscription plan)
    const rowTop = tableTop + 22;

    doc
      .rect(40, rowTop, doc.page.width - 80, 22)
      .fill(lightRow);

    doc
      .fillColor("#000000")
      .font("Helvetica")
      .fontSize(10)
      .text("1", colX.sno + 10, rowTop + 6)
      .text(payment.planName || "Subscription Plan", colX.desc, rowTop + 6)
      .text(`₹${payment.amount.toFixed(2)}`, colX.price, rowTop + 6)
      .text(`₹${payment.amount.toFixed(2)}`, colX.amount, rowTop + 6);

    // ---------- TOTALS ----------
    const totalsTop = rowTop + 40;
    const rightTotalX = colX.amount + 60;

    doc
      .font("Helvetica")
      .fontSize(10)
      .text("Subtotal:", rightTotalX - 80, totalsTop)
      .text(`₹${payment.amount.toFixed(2)}`, rightTotalX, totalsTop, { align: "right" });

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("Total:", rightTotalX - 80, totalsTop + 18)
      .text(`₹${payment.amount.toFixed(2)}`, rightTotalX, totalsTop + 18, { align: "right" });

    // ---------- FOOTER NOTE ----------
    const footerTop = totalsTop + 60;

    doc
      .moveTo(40, footerTop)
      .lineTo(doc.page.width - 40, footerTop)
      .strokeColor("#CCCCCC")
      .lineWidth(0.5)
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#555555")
      .text(
        "Thank you for choosing Daily Fruit Co. " +
          "For any queries about this invoice, please contact dailyfruitco@gmail.com",
        40,
        footerTop + 10,
        { width: doc.page.width - 80, align: "center" }
      );

    doc.end();
  } catch (err) {
    console.error("downloadInvoiceForPayment error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
