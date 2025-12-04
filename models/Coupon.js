import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String },
  discountType: { type: String, enum: ['flat', 'percent'], required: true },
  discountValue: { type: Number, required: true }, // amount or percent
  minAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number }, // only used for percent
  validFrom: { type: Date },
  validTo: { type: Date },
  active: { type: Boolean, default: true },
  usageLimit: { type: Number }, // null => unlimited
  perUserLimit: { type: Number, default: 1 },
  totalUsed: { type: Number, default: 0 },
  allowedPlanIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan' }]
}, { timestamps: true });

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
