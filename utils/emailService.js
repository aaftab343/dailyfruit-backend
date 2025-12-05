import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html) => {
  console.log("📨 Sending Email to:", to);

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("❌ EMAIL_USER / EMAIL_PASS missing in .env");
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,       // smtp-relay.brevo.com
      port: Number(process.env.EMAIL_PORT), // 587
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,     // Gmail
        pass: process.env.EMAIL_PASS      // Brevo SMTP Key
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    console.log("✅ Email sent successfully to:", to);

  } catch (err) {
    console.error("❌ sendEmail error:", err);
  }
};
