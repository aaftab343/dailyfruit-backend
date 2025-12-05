// utils/emailService.js

import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    console.log("📨 Email service called with:", to, subject);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️ EMAIL_USER / EMAIL_PASS missing → Email not sent");
      return;
    }

    // Gmail SMTP Transport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Daily Fruit Co" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments
    };

    await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully to:", to);

  } catch (err) {
    console.error("❌ sendEmail error:", err.message);
  }
};
