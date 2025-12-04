import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

export const generateInvoicePDF = async ({ invoiceNumber, user, payment, subscription }) => {
  return new Promise((resolve, reject) => {
    try {
      const invoicesDir = path.join(process.cwd(), 'invoices');
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      const fileName = `${invoiceNumber}.pdf`;
      const filePath = path.join(invoicesDir, fileName);

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('Daily Fruit Co.', { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(10).text('Fresh Fruit Salads Delivered Daily', { align: 'left' });
      doc.moveDown(1);
      doc.fontSize(16).text('INVOICE', { align: 'right' });
      doc.moveDown();

      // Invoice + dates
      const createdAt = new Date();
      doc.fontSize(10)
        .text(`Invoice No: ${invoiceNumber}`)
        .text(`Invoice Date: ${createdAt.toDateString()}`)
        .moveDown();

      // Bill to
      doc.fontSize(12).text('Bill To:');
      doc.fontSize(10)
        .text(user?.name || '')
        .text(user?.email || '')
        .moveDown();

      // Plan / payment info
      doc.fontSize(12).text('Order Details:');
      doc.fontSize(10)
        .text(`Plan: ${payment.planName || ''}`)
        .text(`Amount: ₹${payment.amount}`)
        .text(`Payment ID: ${payment.razorpayPaymentId || 'N/A'}`)
        .text(`Order ID: ${payment.razorpayOrderId || 'N/A'}`);

      if (subscription) {
        const start = subscription.startDate ? new Date(subscription.startDate).toDateString() : '';
        const end = subscription.endDate ? new Date(subscription.endDate).toDateString() : '';
        doc.text(`Subscription Start: ${start}`);
        doc.text(`Subscription End: ${end}`);
      }

      doc.moveDown(2);
      doc.fontSize(9).text('This is a system generated invoice for your Daily Fruit Co. subscription purchase.');

      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};
