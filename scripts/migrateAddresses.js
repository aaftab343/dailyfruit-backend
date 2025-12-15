import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import { connectDB } from "../config/db.js";

dotenv.config();

const migrateAddresses = async () => {
  try {
    await connectDB();
    console.log("✅ Database connected");

    const users = await User.find({
      $or: [
        { addresses: { $exists: false } },
        { addresses: { $size: 0 } }
      ],
      address: { $exists: true }
    });

    console.log(`🔍 Found ${users.length} users to migrate`);

    for (const user of users) {
      if (!user.address) continue;

      user.addresses = [
        {
          label: "Home",
          house: user.address.house || "",
          street: user.address.street || "",
          area: user.address.area || "",
          city: user.address.city || "",
          pincode: user.address.pincode || "",
          isDefault: true
        }
      ];

      // OPTIONAL: remove old address field
      user.address = undefined;

      await user.save();
      console.log(`✅ Migrated user: ${user.email}`);
    }

    console.log("🎉 Address migration completed");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
};

migrateAddresses();
