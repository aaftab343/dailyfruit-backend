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

    if (!req.userRole) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!isAdminRole(req.userRole)) {
      if (!invoice.userId || invoice.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    if (!invoice.pdfPath || !fs.existsSync(invoice.pdfPath)) {
      return res.status(404).json({ message: 'Invoice file missing' });
    }

    const fileName = path.basename(invoice.pdfPath);
    return res.download(invoice.pdfPath, fileName);
  } catch (err) {
    console.error('downloadInvoiceById error:', err.message);
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

    if (!req.userRole) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!isAdminRole(req.userRole)) {
      if (!invoice.userId || invoice.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    if (!invoice.pdfPath || !fs.existsSync(invoice.pdfPath)) {
      return res.status(404).json({ message: 'Invoice file missing' });
    }

    const fileName = path.basename(invoice.pdfPath);
    return res.download(invoice.pdfPath, fileName);
  } catch (err) {
    console.error('downloadInvoiceForPayment error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
