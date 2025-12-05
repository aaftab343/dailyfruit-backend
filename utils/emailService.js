import axios from "axios";

export const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.warn("BREVO_API_KEY missing");
      return;
    }

    console.log("📨 Sending via Brevo API to:", to);

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: process.env.EMAIL_FROM_NAME || "Daily Fruit Co.",
          email: process.env.EMAIL_FROM
        },
        to: [
          { email: to }
        ],
        subject,
        htmlContent: html
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Email sent!", response.data);
  } catch (err) {
    console.error("❌ Brevo API error:", err.response?.data || err.message);
  }
};

