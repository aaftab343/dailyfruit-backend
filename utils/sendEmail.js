import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("EMAIL_USER / EMAIL_PASS not set, skipping email send");
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Daily Fruit Co" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    if (attachments && attachments.length) {
      mailOptions.attachments = attachments;
    }

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("sendEmail error:", err.message);
  }
};
