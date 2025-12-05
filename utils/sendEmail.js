import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    console.log("📨 Email service started...");

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("❌ EMAIL_USER / EMAIL_PASS missing");
      return;
    }

    console.log("📧 Using Gmail:", process.env.EMAIL_USER);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: { rejectUnauthorized: false }
    });

    console.log("✅ Transporter created.");

    const mailOptions = {
      from: `"Daily Fruit Co" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments
    };

    console.log("📤 Sending email to:", to);
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email Sent:", info.messageId);

  } catch (err) {
    console.error("❌ sendEmail error:", err);
  }
};
