import { sendEmail } from "../utils/emailService.js";

const signupOtpStore = {}; // { email: { otp, expiresAt } }

// ================================
// SEND OTP
// ================================
export const sendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const emailLower = email.toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min

    signupOtpStore[emailLower] = { otp, expiresAt };

    console.log("📨 OTP Generated:", otp, "for", emailLower);

    // ==========================
    // PROFESSIONAL EMAIL TEMPLATE
    // ==========================
    const html = `
    <table width="100%" cellpadding="0" cellspacing="0" 
      style="background:#f5f6fa;padding:30px 0;font-family:Arial,sans-serif;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" 
            style="background:white;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);overflow:hidden;">

            <tr>
              <td style="background:linear-gradient(90deg,#06b6d4,#7c3aed);
                padding:18px 24px;color:white;font-size:20px;font-weight:bold;">
                Daily Fruit Co — Email Verification
              </td>
            </tr>

            <tr>
              <td style="padding:24px;font-size:16px;color:#333;">
                Hi,<br><br>
                Use the One-Time Password below to verify your email address.
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:10px 24px;">
                <div style="
                  font-size:38px;
                  font-weight:bold;
                  color:#1e293b;
                  letter-spacing:4px;
                  padding:14px 0;">
                  ${otp}
                </div>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:0 24px 20px;color:#555;font-size:14px;">
                This OTP is valid for <b>5 minutes</b>.
              </td>
            </tr>

            <tr>
              <td style="padding:24px;font-size:14px;color:#666;line-height:22px;">
                If you did not request this OTP, please ignore this email.
              </td>
            </tr>

            <tr>
              <td align="center" style="background:#f0f0f5;padding:16px;font-size:12px;color:#888;">
                © ${new Date().getFullYear()} Daily Fruit Co. All rights reserved.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
    `;

    // SEND EMAIL
    await sendEmail(emailLower, "Your Daily Fruit Email Verification Code", html);

    res.json({ message: "OTP sent to email" });

  } catch (err) {
    console.error("❌ sendSignupOtp error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};


// ================================
// VERIFY OTP
// ================================
export const verifySignupOtp = (req, res) => {
  try {
    const { email, otp } = req.body;
    const emailLower = (email || "").toLowerCase();

    const rec = signupOtpStore[emailLower];

    if (!rec) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }

    if (Date.now() > rec.expiresAt) {
      delete signupOtpStore[emailLower];
      return res.status(400).json({ message: "OTP expired" });
    }

    if (String(rec.otp) !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    delete signupOtpStore[emailLower];
    res.json({ message: "OTP verified" });

  } catch (err) {
    console.error("❌ verifySignupOtp error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
