import mongoose from 'mongoose';

const deliveryBoySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    pinCode: { type: String },
    citySlug: { type: String },
    active: { type: Boolean, default: true },
    passwordHash: { type: String, required: true },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

const DeliveryBoy = mongoose.model('DeliveryBoy', deliveryBoySchema);
export default DeliveryBoy;
