import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function reset() {
  console.log("Starting Database Reset...");
  
  try {
    // 1. Wipe Data
    await pool.query("DELETE FROM scan_logs");
    await pool.query("DELETE FROM products");
    await pool.query("DELETE FROM users");
    await pool.query("DELETE FROM stores");
    console.log("Data wiped successfully.");

    // 2. Create SuperAdmin
    const hashedPassword = await bcrypt.hash("LookPrice2026!", 10);
    await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3)",
      ["serkanerdekli@gmail.com", hashedPassword, "superadmin"]
    );
    console.log("SuperAdmin created: serkanerdekli@gmail.com / LookPrice2026!");

    console.log("Reset Complete! 🚀");
  } catch (error) {
    console.error("Reset Failed:", error);
  } finally {
    await pool.end();
  }
}

reset();
