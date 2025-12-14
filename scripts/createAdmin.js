import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import Admin from "../models/Admin.js";

dotenv.config();

const run = async () => {
  try {
    // 1️⃣ Connect to MongoDB
    await connectDB();

    // 2️⃣ Read admin details from .env
    const email = process.env.DEFAULT_ADMIN_EMAIL;
    const password = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
    const name = process.env.DEFAULT_ADMIN_NAME || "Super Admin";
    const role = process.env.DEFAULT_ADMIN_ROLE || "superAdmin";

    // 3️⃣ Validate required env
    if (!email) {
      console.error("❌ DEFAULT_ADMIN_EMAIL not set in .env / Render env");
      process.exit(1);
    }

    // 4️⃣ Check if admin already exists
    const existingAdmin = await Admin.findOne({
      email: email.toLowerCase()
    });

    if (existingAdmin) {
      console.log("ℹ️ Admin already exists");
      console.log("Email:", existingAdmin.email);
      console.log("Role:", existingAdmin.role);
      process.exit(0);
    }

    // 5️⃣ Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6️⃣ Create admin
    await Admin.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role
    });

    // 7️⃣ Success log
    console.log("✅ Admin created successfully");
    console.log("━━━━━━━━━━━━━━━━━━━━");
    console.log("Email    :", email);
    console.log("Password :", password);
    console.log("Role     :", role);
    console.log("━━━━━━━━━━━━━━━━━━━━");

    process.exit(0);
  } catch (err) {
    console.error("❌ createAdmin error:", err.message);
    process.exit(1);
  }
};

run();

