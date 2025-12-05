import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import adminPasswordRoutes from './routes/adminPasswordRoutes.js';
import otpRoutes from './routes/otpRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import planRoutes from './routes/planRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import passwordRoutes from './routes/passwordRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import cityRoutes from './routes/cityRoutes.js';
import cmsRoutes from './routes/cmsRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import warehouseRoutes from './routes/warehouseRoutes.js';
import loyaltyRoutes from './routes/loyaltyRoutes.js';
import analyticsAdvancedRoutes from './routes/analyticsAdvancedRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import experimentRoutes from './routes/experimentRoutes.js';
import deliveryBoyRoutes from './routes/deliveryBoyRoutes.js';

import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { requestLogger } from './middleware/requestLoggerMiddleware.js';
import { rateLimiter } from './middleware/rateLimitMiddleware.js';

dotenv.config();
connectDB();

const app = express();

// ⭐ REQUIRED FOR RENDER ⭐
app.set('trust proxy', 1);

// Security and logging
app.use(helmet());
app.use(morgan('dev'));

const allowedOrigin = process.env.FRONTEND_URL || '*';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true
  })
);

app.use(express.json());
app.use(requestLogger);
app.use(rateLimiter({ windowMs: 60 * 1000, max: 200 }));

// Rate limiting fallback
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 200
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/password', adminPasswordRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/analytics-advanced', analyticsAdvancedRoutes);
app.use('/api/experiments', experimentRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/delivery-boys', deliveryBoyRoutes);

// Errors
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
