import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pinCodes: [{ type: String }]
});

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true },
    deliveryFee: { type: Number, default: 0 },
    minOrderAmount: { type: Number, default: 0 },
    zones: [zoneSchema]
  },
  { timestamps: true }
);

const City = mongoose.model('City', citySchema);
export default City;
