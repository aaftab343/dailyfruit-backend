import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    address: { type: String },
    citySlug: { type: String, required: true },
    active: { type: Boolean, default: true },
    capacityPerDay: { type: Number, default: 0 },
    contactPhone: { type: String },
    managerName: { type: String }
  },
  { timestamps: true }
);

const Warehouse = mongoose.model('Warehouse', warehouseSchema);
export default Warehouse;
