import { sendEmail } from "../utils/emailService.js";

const signupOtpStore = {}; // temporary store

export const sendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: 'Email required' });

    const emailLower = email.toLowerCase();

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = Date.now() + 5 * 60 * 1000;

    signupOtpStore[emailLower] = { otp, expiresAt };

    const html = `<p>Your Daily Fruit signup OTP is <b>${otp}</b>. Valid for 5 minutes.</p>`;

    console.log("📨 Sending OTP to:", emailLower);

    await sendEmail(emailLower, 'Daily Fruit Signup OTP', html);

    res.json({ message: 'OTP sent to email' });

  } catch (err) {
    console.error("sendSignupOtp error:", err);
    res.status(500).json({ message: 'Server error sending OTP' });
  }
};

export const verifySignupOtp = (req, res) => {
  try {
    const { email, otp } = req.body;
    const emailLower = (email || '').toLowerCase();

    const rec = signupOtpStore[emailLower];
    if (!rec)
      return res.status(400).json({ message: 'OTP not found or expired' });

    if (Date.now() > rec.expiresAt) {
      delete signupOtpStore[emailLower];
      return res.status(400).json({ message: 'OTP expired' });
    }

    if (String(rec.otp) !== String(otp))
      return res.status(400).json({ message: 'Invalid OTP' });

    delete signupOtpStore[emailLower];
    res.json({ message: 'OTP verified' });

  } catch (err) {
    console.error("verifySignupOtp error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};
