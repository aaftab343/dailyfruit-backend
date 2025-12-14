// server.js
import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";

// ================= DB & MODELS =================
import { connectDB } from "./config/db.js";
import Admin from "./models/Admin.js";

// ================= ROUTES =================

// Auth
import authRoutes from "./routes/authRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminPasswordRoutes from "./routes/adminPasswordRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// ✅ ADMIN MODULE ROUTES
import adminOrdersRoutes from "./routes/adminOrdersRoutes.js";
import adminPlansRoutes from "./routes/adminPlansRoutes.js";
import adminDeliveryRoutes from "./routes/adminDeliveryRoutes.js";
import adminInventoryRoutes from "./routes/adminInventoryRoutes.js";
import adminCmsRoutes from "./routes/adminCmsRoutes.js";
import adminSettingsRoutes from "./routes/adminSettingsRoutes.js";

// Customer / Business
import otpRoutes from "./routes/otpRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import passwordRoutes from "./routes/passwordRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import referralRoutes from "./routes/referralRoutes.js";
import cityRoutes from "./routes/cityRoutes.js";
import cmsRoutes from "./routes/cmsRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import analyticsAdvancedRoutes from "./routes/analyticsAdvancedRoutes.js";
import warehouseRoutes from "./routes/warehouseRoutes.js";
import loyaltyRoutes from "./routes/loyaltyRoutes.js";
import experimentRoutes from "./routes/experimentRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import deliveryBoyRoutes from "./routes/deliveryBoyRoutes.js";

// ================= MIDDLEWARE =================
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { requestLogger } from "./middleware/requestLoggerMiddleware.js";
import { rateLimiter } from "./middleware/rateLimitMiddleware.js";

dotenv.config();

const app = express();

// Required for Render / proxies
app.set("trust proxy", 1);

// ================= SECURITY & CORE =================
app.use(helmet());
app.use(morgan("dev"));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

app.use(express.json());
app.use(requestLogger);

// Custom rate limiter
app.use(
  rateLimiter({
    windowMs: 60 * 1000,
    max: 200,
  })
);

// Backup rate limit
app.use(
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 200,
  })
);

// ================= ROOT =================
app.get("/", (req, res) => {
  res.json({ message: "DailyFruitCo API is running 🚀" });
});

// ================= API ROUTES =================

// Auth
app.use("/api/auth", authRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/password", adminPasswordRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/otp", otpRoutes);

// ---------------- ADMIN CORE ----------------
app.use("/api/admin", adminRoutes);

// ---------------- ADMIN BUSINESS MODULES ----------------
app.use("/api/admin/orders", adminOrdersRoutes);
app.use("/api/admin/plans", adminPlansRoutes);
app.use("/api/admin/delivery", adminDeliveryRoutes);
app.use("/api/admin/inventory", adminInventoryRoutes);
app.use("/api/admin/cms", adminCmsRoutes);
app.use("/api/admin/settings", adminSettingsRoutes);

// ---------------- CUSTOMER / BUSINESS ----------------
app.use("/api/plans", planRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/profile", profileRoutes);

// ---------------- GROWTH & CMS ----------------
app.use("/api/cms", cmsRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/cities", cityRoutes);

// ---------------- ANALYTICS & OPS ----------------
app.use("/api/analytics", analyticsRoutes);
app.use("/api/analytics-advanced", analyticsAdvancedRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/experiments", experimentRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/delivery-boys", deliveryBoyRoutes);

// ---------------- WEBHOOKS ----------------
app.use("/api/webhooks", webhookRoutes);

// ================= ERROR HANDLERS =================
app.use(notFound);
app.use(errorHandler);

// ================= AUTO-CREATE DEFAULT ADMIN =================
const createDefaultAdmin = async () => {
  try {
    if (!process.env.DEFAULT_ADMIN_EMAIL) return;

    const email = process.env.DEFAULT_ADMIN_EMAIL.toLowerCase();
    const exists = await Admin.findOne({ email });

    if (exists) {
      console.log("ℹ️ Default admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123",
      10
    );

    await Admin.create({
      name: process.env.DEFAULT_ADMIN_NAME || "Super Admin",
      email,
      password: hashedPassword,
      role: process.env.DEFAULT_ADMIN_ROLE || "SUPER_ADMIN",
    });

    console.log("✅ Default admin created automatically");
  } catch (err) {
    console.error("❌ Default admin creation failed:", err.message);
  }
};

// ================= START SERVER =================
const startServer = async () => {
  await connectDB();
  await createDefaultAdmin();

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
