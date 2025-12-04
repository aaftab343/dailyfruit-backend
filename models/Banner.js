import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: String,
    subtitle: String,
    imageUrl: { type: String, required: true },
    linkUrl: String,
    position: {
      type: String,
      enum: ['hero', 'homepage', 'dashboard'],
      default: 'homepage'
    },
    citySlug: { type: String },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const Banner = mongoose.model('Banner', bannerSchema);
export default Banner;
