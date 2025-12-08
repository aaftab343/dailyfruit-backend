// controllers/invoiceController.js
import fs from 'fs';
import path from 'path';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';

const isAdminRole = (role) => ['superAdmin', 'admin', 'staffAdmin'].includes(role);

export const downloadInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // 🔹 Use req.user.role instead of req.userRole
    const role = req.user?.role;

    if (!role) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // If not admin, must be the owner of this invoice
    if (!isAdminRole(role)) {
      if (!invoice.userId || invoice.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    if (!invoice.pdfPath) {
      return res.status(404).json({ message: 'Invoice file missing (no pdfPath)' });
    }

    const absolutePath = path.isAbsolute(invoice.pdfPath)
      ? invoice.pdfPath
      : path.join(process.cwd(), invoice.pdfPath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'Invoice file missing on disk' });
    }

    const fileName = path.basename(absolutePath);
    return res.download(absolutePath, fileName);
  } catch (err) {
    console.error('downloadInvoiceById error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const downloadInvoiceForPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const invoice = await Invoice.findOne({ paymentId: payment._id });
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found for this payment' });
    }

    // 🔹 Use req.user.role instead of req.userRole
    const role = req.user?.role;

    if (!role) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!isAdminRole(role)) {
      if (!invoice.userId || invoice.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    if (!invoice.pdfPath) {
      return res.status(404).json({ message: 'Invoice file missing (no pdfPath)' });
    }

    const absolutePath = path.isAbsolute(invoice.pdfPath)
      ? invoice.pdfPath
      : path.join(process.cwd(), invoice.pdfPath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'Invoice file missing on disk' });
    }

    const fileName = path.basename(absolutePath);
    return res.download(absolutePath, fileName);
  } catch (err) {
    console.error('downloadInvoiceForPayment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
