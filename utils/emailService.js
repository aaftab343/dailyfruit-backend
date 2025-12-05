import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    console.log("📨 Preparing to send email...");
    console.log("📨 Using Host:", process.env.EMAIL_HOST);

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false, 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"Daily Fruit Co." <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📨 Email sent! Message ID:", info.messageId);

  } catch (err) {
    console.error("❌ sendEmail error:", err);
  }
};
