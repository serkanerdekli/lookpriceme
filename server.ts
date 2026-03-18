import express from "express";
import pkg from 'pg';
const { Pool } = pkg;
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import * as XLSX from "xlsx";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

console.log("Starting server process...");
console.log("Node Version:", process.version);
console.log("Environment:", process.env.NODE_ENV);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// --- Supabase Keep-Alive ---
// Prevents free-tier projects from pausing after 7 days of inactivity
const keepAliveSupabase = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Supabase Keep-Alive: System active, database pinged successfully.");
  } catch (e) {
    console.error("Supabase Keep-Alive Error:", e);
  }
};

// Ping every 3 days (Supabase pauses after 7 days)
setInterval(keepAliveSupabase, 1000 * 60 * 60 * 24 * 3);
keepAliveSupabase(); // Initial ping on startup

// Initialize Database
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        address TEXT,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        api_key TEXT UNIQUE,
        subscription_end DATE,
        logo_url TEXT,
        primary_color TEXT DEFAULT '#4f46e5',
        default_currency TEXT DEFAULT 'TRY',
        language TEXT DEFAULT 'tr',
        plan TEXT DEFAULT 'free',
        background_image_url TEXT,
        fiscal_brand TEXT,
        fiscal_terminal_id TEXT,
        fiscal_active BOOLEAN DEFAULT FALSE,
        currency_rates JSONB DEFAULT '{"USD": 1, "EUR": 1, "GBP": 1}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        barcode TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        currency TEXT DEFAULT 'TRY',
        description TEXT,
        stock_quantity INTEGER DEFAULT 0,
        min_stock_level INTEGER DEFAULT 5,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id),
        UNIQUE(store_id, barcode)
      );

      CREATE TABLE IF NOT EXISTS scan_logs (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        store_id INTEGER,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('superadmin', 'storeadmin', 'editor', 'viewer')) NOT NULL,
        reset_token TEXT,
        reset_token_expiry TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );

      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        store_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        status TEXT DEFAULT 'Yeni',
        probability TEXT DEFAULT 'Ilık',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quotations (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_title TEXT,
        total_amount DECIMAL(12,2) DEFAULT 0,
        currency TEXT DEFAULT 'TRY',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS quotation_items (
        id SERIAL PRIMARY KEY,
        quotation_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        barcode TEXT,
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL(12,2) NOT NULL,
        total_price DECIMAL(12,2) NOT NULL,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS registration_requests (
        id SERIAL PRIMARY KEY,
        store_name TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        company_title TEXT,
        address TEXT,
        phone TEXT,
        language TEXT,
        currency TEXT,
        plan TEXT,
        upload_method TEXT,
        excel_data JSONB,
        mapping JSONB,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        tax_office TEXT,
        tax_number TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        contact_person TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS current_account_transactions (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        company_id INTEGER NOT NULL,
        quotation_id INTEGER UNIQUE,
        type TEXT CHECK(type IN ('debt', 'credit')) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        description TEXT,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        total_amount DECIMAL(12,2) NOT NULL,
        currency TEXT DEFAULT 'TRY',
        status TEXT CHECK(status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
        customer_name TEXT,
        payment_method TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        barcode TEXT,
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL(12,2) NOT NULL,
        total_price DECIMAL(12,2) NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sale_payments (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
      );

      -- Update quotations table if needed
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='status') THEN
          ALTER TABLE quotations ADD COLUMN status TEXT DEFAULT 'pending';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='company_id') THEN
          ALTER TABLE quotations ADD COLUMN company_id INTEGER;
          ALTER TABLE quotations ADD CONSTRAINT fk_quotation_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Ensure columns exist
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='default_currency') THEN
          ALTER TABLE stores ADD COLUMN default_currency TEXT DEFAULT 'TRY';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='language') THEN
          ALTER TABLE stores ADD COLUMN language TEXT DEFAULT 'tr';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='plan') THEN
          ALTER TABLE stores ADD COLUMN plan TEXT DEFAULT 'free';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='background_image_url') THEN
          ALTER TABLE stores ADD COLUMN background_image_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='contact_person') THEN
          ALTER TABLE companies ADD COLUMN contact_person TEXT;
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reset_token') THEN
          ALTER TABLE users ADD COLUMN reset_token TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reset_token_expiry') THEN
          ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='updated_at') THEN
          ALTER TABLE products ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stock_quantity') THEN
          ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='min_stock_level') THEN
          ALTER TABLE products ADD COLUMN min_stock_level INTEGER DEFAULT 5;
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$ 
      BEGIN 
        -- 1. Update transactions to point to the first instance of a company
        UPDATE current_account_transactions t
        SET company_id = sub.min_id
        FROM (
          SELECT c1.id as old_id, (
            SELECT MIN(c2.id) 
            FROM companies c2 
            WHERE c2.store_id = c1.store_id 
            AND LOWER(TRIM(c2.title)) = LOWER(TRIM(c1.title))
          ) as min_id
          FROM companies c1
        ) sub
        WHERE t.company_id = sub.old_id AND t.company_id != sub.min_id;

        -- 2. Update quotations to point to the first instance of a company
        UPDATE quotations q
        SET company_id = sub.min_id
        FROM (
          SELECT c1.id as old_id, (
            SELECT MIN(c2.id) 
            FROM companies c2 
            WHERE c2.store_id = c1.store_id 
            AND LOWER(TRIM(c2.title)) = LOWER(TRIM(c1.title))
          ) as min_id
          FROM companies c1
        ) sub
        WHERE q.company_id = sub.old_id AND q.company_id != sub.min_id;

        -- 3. Delete duplicate companies (keep the one with the smallest ID)
        DELETE FROM companies
        WHERE id NOT IN (
          SELECT MIN(id)
          FROM companies
          GROUP BY store_id, LOWER(TRIM(title))
        );

        -- 4. Ensure unique index for case-insensitive uniqueness
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_companies_store_title_lower') THEN
          CREATE UNIQUE INDEX idx_companies_store_title_lower ON companies (store_id, LOWER(TRIM(title)));
        END IF;

        -- 5. Ensure unique constraint for transactions
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='current_account_transactions' AND constraint_type='UNIQUE' AND constraint_name='current_account_transactions_quotation_id_key') THEN
          ALTER TABLE current_account_transactions ADD CONSTRAINT current_account_transactions_quotation_id_key UNIQUE(quotation_id);
        END IF;
      END $$;
    `);

    // Ensure cascades for foreign keys to prevent 502 errors on deletion
    await client.query(`
      DO $$ 
      BEGIN 
        -- scan_logs -> products
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='scan_logs' AND constraint_type='FOREIGN KEY' AND (constraint_name='scan_logs_product_id_fkey' OR constraint_name LIKE '%product_id_fkey%')) THEN
          -- We'll try to drop by name if we can find it, or just drop and recreate
          ALTER TABLE scan_logs DROP CONSTRAINT IF EXISTS scan_logs_product_id_fkey;
        END IF;
        ALTER TABLE scan_logs ADD CONSTRAINT scan_logs_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

        -- scan_logs -> stores
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='scan_logs' AND constraint_type='FOREIGN KEY' AND (constraint_name='scan_logs_store_id_fkey' OR constraint_name LIKE '%store_id_fkey%')) THEN
          ALTER TABLE scan_logs DROP CONSTRAINT IF EXISTS scan_logs_store_id_fkey;
        END IF;
        ALTER TABLE scan_logs ADD CONSTRAINT scan_logs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

        -- products -> stores
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='products' AND constraint_type='FOREIGN KEY' AND (constraint_name='products_store_id_fkey' OR constraint_name LIKE '%store_id_fkey%')) THEN
          ALTER TABLE products DROP CONSTRAINT IF EXISTS products_store_id_fkey;
        END IF;
        ALTER TABLE products ADD CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

        -- users -> stores
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='users' AND constraint_type='FOREIGN KEY' AND (constraint_name='users_store_id_fkey' OR constraint_name LIKE '%store_id_fkey%')) THEN
          ALTER TABLE users DROP CONSTRAINT IF EXISTS users_store_id_fkey;
        END IF;
        ALTER TABLE users ADD CONSTRAINT users_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

        -- tickets -> stores
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='tickets' AND constraint_type='FOREIGN KEY' AND (constraint_name='tickets_store_id_fkey' OR constraint_name LIKE '%store_id_fkey%')) THEN
          ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_store_id_fkey;
        END IF;
        ALTER TABLE tickets ADD CONSTRAINT tickets_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
      END $$;
    `);

    // Seed Super Admin if not exists
    const adminEmail = "admin@pricecheck.com";
    const existingAdmin = await client.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
    if (existingAdmin.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      await client.query("INSERT INTO users (email, password, role) VALUES ($1, $2, $3)", [adminEmail, hashedPassword, "superadmin"]);
    }
  } finally {
    client.release();
  }
}

async function startServer() {
  console.log("Initializing Express app...");
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

  console.log(`Configured Port: ${PORT}`);

  // 1. Immediate Health Check for Render.com
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
  });

  // 2. Background Database Initialization
  initDb().then(() => {
    console.log("Database initialized successfully");
  }).catch((e) => {
    console.error("Database initialization failed (will retry on next request):", e.message);
  });

  app.use(express.json());

  const upload = multer({ dest: "uploads/" });

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- HELPER FUNCTIONS ---
  const PLAN_LIMITS: Record<string, number> = {
    'free': 50,
    'basic': 100,
    'pro': 500,
    'enterprise': 1000000
  };

  async function checkProductLimit(storeId: number, additionalCount: number = 1) {
    const storeRes = await pool.query("SELECT plan FROM stores WHERE id = $1", [storeId]);
    const plan = storeRes.rows[0]?.plan || 'free';
    const limit = PLAN_LIMITS[plan] || 50;
    
    const currentCountRes = await pool.query("SELECT COUNT(*)::INT as count FROM products WHERE store_id = $1", [storeId]);
    const currentCount = currentCountRes.rows[0].count;
    
    return currentCount + additionalCount <= limit;
  }

  // --- API ROUTES ---

  // Public: Get Product by Barcode and Store Slug
  app.get("/api/public/scan/:slug/:barcode", async (req, res) => {
    const { slug, barcode } = req.params;
    const storeRes = await pool.query("SELECT id, name, logo_url, primary_color, default_currency, background_image_url FROM stores WHERE slug = $1", [slug]);
    let store = storeRes.rows[0];
    
    if (!store && (slug === 'demo-store' || slug === 'demo')) {
      store = {
        id: -1,
        name: "Demo Mağaza",
        logo_url: "",
        primary_color: "#4f46e5",
        default_currency: "TRY",
        background_image_url: ""
      };
    }

    if (!store) return res.status(404).json({ error: "Store not found" });

    let product = null;
    if (store.id !== -1) {
      const productRes = await pool.query("SELECT * FROM products WHERE store_id = $1 AND barcode = $2", [store.id, barcode]);
      product = productRes.rows[0];
    }
    
    if (!product) {
      // Demo product logic: Return a sample product instead of 404 for any store
      const demoProduct = {
        id: 0,
        store_id: store.id,
        barcode: barcode,
        name: "Demo Ürün (Örnek)",
        price: 129.90,
        currency: store.default_currency || 'TRY',
        description: "Bu bir demo üründür. Sistemde gerçek bir ürün bulunamadığında bu örnek gösterilir.",
        updated_at: new Date().toISOString(),
        is_demo: true
      };
      return res.json({ ...demoProduct, store });
    }

    // Log the scan
    await pool.query("INSERT INTO scan_logs (store_id, product_id) VALUES ($1, $2)", [store.id, product.id]);

    res.json({ ...product, store });
  });

  // Admin: Leads Management
  app.get("/api/admin/leads", authenticate, async (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    try {
      const leads = await pool.query("SELECT * FROM leads ORDER BY created_at DESC");
      res.json(leads.rows);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/admin/leads/:id", authenticate, async (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    const { status, probability, notes } = req.body;
    try {
      await pool.query(
        "UPDATE leads SET status = $1, probability = $2, notes = $3 WHERE id = $4",
        [status, probability, notes, req.params.id]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/admin/leads/:id", authenticate, async (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    try {
      await pool.query("DELETE FROM leads WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      console.error("Delete lead error:", e);
      res.status(400).json({ error: e.message });
    }
  });

  // Public: Get Store Info (for branding on scan page load)
  // Public: Demo Request
  app.post("/api/public/demo-request", async (req, res) => {
    const { name, storeName, phone, email, notes } = req.body;
    try {
      await pool.query(
        "INSERT INTO leads (name, store_name, phone, email, notes) VALUES ($1, $2, $3, $4, $5)",
        [name, storeName, phone, email, notes]
      );
      res.json({ success: true, message: "Talebiniz başarıyla alındı." });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/public/store/:slug", async (req, res) => {
    const { slug } = req.params;
    const storeRes = await pool.query("SELECT name, logo_url, primary_color, default_currency, background_image_url FROM stores WHERE slug = $1", [slug]);
    let store = storeRes.rows[0];
    
    if (!store && (slug === 'demo-store' || slug === 'demo')) {
      store = {
        name: "Demo Mağaza",
        logo_url: "",
        primary_color: "#4f46e5",
        default_currency: "TRY",
        background_image_url: ""
      };
    }
    
    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json(store);
  });

  // Public: Create Sale (Customer Basket)
  app.post("/api/public/sales", async (req, res) => {
    const { storeId, items, totalAmount, currency, customerName } = req.body;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const saleRes = await client.query(
        "INSERT INTO sales (store_id, total_amount, currency, customer_name, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING id",
        [storeId, totalAmount, currency, customerName || 'Müşteri']
      );
      const saleId = saleRes.rows[0].id;

      for (const item of items) {
        await client.query(
          "INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [saleId, item.id, item.name, item.barcode, item.quantity, item.price, item.price * item.quantity]
        );
      }

      await client.query("COMMIT");
      res.json({ success: true, saleId });
    } catch (e: any) {
      await client.query("ROLLBACK");
      res.status(400).json({ error: e.message });
    } finally {
      client.release();
    }
  });

  // Public: Registration Request
  app.post("/api/public/register-request", async (req, res) => {
    const { 
      storeName, username, password, companyTitle, 
      address, phone, language, currency, plan, 
      uploadMethod, excelData, mapping 
    } = req.body;
    
    try {
      await pool.query(
        `INSERT INTO registration_requests 
        (store_name, username, password, company_title, address, phone, language, currency, plan, upload_method, excel_data, mapping) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [storeName, username, password, companyTitle, address, phone, language, currency, plan, uploadMethod, JSON.stringify(excelData || []), JSON.stringify(mapping || {})]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const userRes = await pool.query(`
        SELECT u.*, s.slug as store_slug 
        FROM users u 
        LEFT JOIN stores s ON u.store_id = s.id 
        WHERE u.email = $1
      `, [email]);
      
      const user = userRes.rows[0];
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const token = jwt.sign({ 
        id: user.id, 
        role: user.role, 
        store_id: user.store_id,
        store_slug: user.store_slug 
      }, JWT_SECRET);
      
      res.json({ 
        token, 
        user: { 
          email: user.email, 
          role: user.role, 
          store_id: user.store_id,
          store_slug: user.store_slug 
        } 
      });
    } catch (e: any) {
      console.error("Login error:", e);
      res.status(500).json({ error: "Database connection failed! Check DATABASE_URL in Render." });
    }
  });

  app.post("/api/auth/change-password", authenticate, async (req: any, res) => {
    const { currentPassword, newPassword } = req.body;
    const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    const user = userRes.rows[0];

    if (user && bcrypt.compareSync(currentPassword, user.password)) {
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, req.user.id]);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Mevcut şifre hatalı" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = userRes.rows[0];

    if (!user) {
      return res.status(404).json({ error: "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı" });
    }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await pool.query("UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3", [token, expiry, user.id]);

    console.log(`Password reset link: /reset-password/${token}`);
    
    res.json({ 
      success: true, 
      message: "Şifre sıfırlama bağlantısı simüle edildi.",
      debug_token: token
    });
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    const userRes = await pool.query("SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()", [token]);
    const user = userRes.rows[0];

    if (!user) {
      return res.status(400).json({ error: "Geçersiz veya süresi dolmuş sıfırlama bağlantısı" });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await pool.query("UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2", [hashedPassword, user.id]);
    res.json({ success: true });
  });

  // SuperAdmin: Manage Stores
  app.get("/api/admin/stats", authenticate, async (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    
    const totalStores = (await pool.query("SELECT COUNT(*)::INT as count FROM stores")).rows[0].count;
    const activeStores = (await pool.query("SELECT COUNT(*)::INT as count FROM stores WHERE subscription_end > CURRENT_DATE")).rows[0].count;
    const totalScans = (await pool.query("SELECT COUNT(*)::INT as count FROM scan_logs")).rows[0].count;
    const scansLast24h = (await pool.query("SELECT COUNT(*)::INT as count FROM scan_logs WHERE created_at > NOW() - INTERVAL '1 day'")).rows[0].count;

    res.json({
      totalStores: parseInt(totalStores),
      activeStores: parseInt(activeStores),
      totalScans: parseInt(totalScans),
      scansLast24h: parseInt(scansLast24h)
    });
  });

  app.get("/api/admin/stores", authenticate, async (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    const stores = await pool.query(`
      SELECT s.*, u.email as admin_email 
      FROM stores s 
      LEFT JOIN users u ON s.id = u.store_id AND u.role = 'storeadmin'
    `);
    res.json(stores.rows);
  });

  // Admin: Registration Requests
  app.get("/api/admin/registration-requests", authenticate, async (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    try {
      const requests = await pool.query("SELECT * FROM registration_requests ORDER BY created_at DESC");
      res.json(requests.rows);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/admin/registration-requests/:id/approve", authenticate, async (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    const { id } = req.params;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      const requestRes = await client.query("SELECT * FROM registration_requests WHERE id = $1", [id]);
      const request = requestRes.rows[0];
      if (!request) throw new Error("Request not found");
      if (request.status !== 'pending') throw new Error("Request already processed");

      // 1. Create Store
      const slug = request.store_name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.random().toString(36).substring(2, 5);
      const storeRes = await client.query(
        "INSERT INTO stores (name, slug, address, contact_person, phone, email, default_currency, language, plan, subscription_end) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE + INTERVAL '1 year') RETURNING id",
        [request.store_name, slug, request.address, request.company_title, request.phone, request.username, request.currency, request.language, request.plan || 'free']
      );
      const storeId = storeRes.rows[0].id;

      // 2. Create User
      const hashedPassword = bcrypt.hashSync(request.password, 10);
      await client.query("INSERT INTO users (store_id, email, password, role) VALUES ($1, $2, $3, $4)", [storeId, request.username, hashedPassword, "storeadmin"]);

      // 3. Import Products if any
      if (request.upload_method === 'excel' && request.excel_data && request.mapping) {
        const products = request.excel_data;
        const mapping = request.mapping;
        for (const p of products) {
          const barcode = String(p[mapping.barcode] || "");
          const name = String(p[mapping.name] || "");
          const price = parseFloat(p[mapping.price]) || 0;
          const description = String(p[mapping.description] || "");
          
          if (barcode && name) {
            await client.query(
              "INSERT INTO products (store_id, barcode, name, price, currency, description) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING",
              [storeId, barcode, name, price, request.currency, description]
            );
          }
        }
      }

      // 4. Update request status
      await client.query("UPDATE registration_requests SET status = 'approved' WHERE id = $1", [id]);

      await client.query("COMMIT");
      res.json({ success: true, slug });
    } catch (e: any) {
      await client.query("ROLLBACK");
      res.status(400).json({ error: e.message });
    } finally {
      client.release();
    }
  });

  app.post("/api/admin/registration-requests/:id/reject", authenticate, async (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    try {
      await pool.query("UPDATE registration_requests SET status = 'rejected' WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/admin/stores/bulk-subscription", authenticate, async (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    const { storeIds, days } = req.body;
    if (!storeIds || !Array.isArray(storeIds) || !days) return res.status(400).json({ error: "Invalid data" });

    try {
      await pool.query("BEGIN");
      for (const id of storeIds) {
        await pool.query(`
          UPDATE stores 
          SET subscription_end = COALESCE(subscription_end, CURRENT_DATE) + ($1 || ' days')::INTERVAL 
          WHERE id = $2
        `, [days, id]);
      }
      await pool.query("COMMIT");
      res.json({ success: true });
    } catch (e) {
      await pool.query("ROLLBACK");
      res.status(500).json({ error: "Bulk update failed" });
    }
  });

  app.post("/api/admin/stores", authenticate, async (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    const { name, slug, address, contact_person, phone, email, subscription_end, admin_email, admin_password, default_currency, language } = req.body;
    try {
      await pool.query("BEGIN");
      const storeRes = await pool.query(
        "INSERT INTO stores (name, slug, address, contact_person, phone, email, subscription_end, default_currency, language) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
        [name, slug, address, contact_person, phone, email, subscription_end, default_currency || 'TRY', language || 'tr']
      );
      const storeId = storeRes.rows[0].id;
      const hashedPassword = bcrypt.hashSync(admin_password, 10);
      await pool.query("INSERT INTO users (store_id, email, password, role) VALUES ($1, $2, $3, $4)", [storeId, admin_email, hashedPassword, "storeadmin"]);
      await pool.query("COMMIT");
      res.json({ success: true, storeId });
    } catch (e: any) {
      await pool.query("ROLLBACK");
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/admin/stores/:id", authenticate, async (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    const { name, slug, address, contact_person, phone, email, subscription_end, default_currency, language, admin_password, plan } = req.body;
    try {
      await pool.query("BEGIN");
      await pool.query(`
        UPDATE stores 
        SET name = $1, slug = $2, address = $3, contact_person = $4, phone = $5, email = $6, subscription_end = $7, default_currency = $8, language = $9, plan = $10
        WHERE id = $11
      `, [name, slug, address, contact_person, phone, email, subscription_end, default_currency || 'TRY', language || 'tr', plan || 'free', req.params.id]);

      if (admin_password) {
        const hashedPassword = bcrypt.hashSync(admin_password, 10);
        await pool.query(`
          UPDATE users 
          SET password = $1 
          WHERE store_id = $2 AND role = 'storeadmin'
        `, [hashedPassword, req.params.id]);
      }

      await pool.query("COMMIT");
      res.json({ success: true });
    } catch (e: any) {
      await pool.query("ROLLBACK");
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/admin/stores/:id/delete", authenticate, async (req: any, res) => {
    if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    const { id } = req.params;
    const { password } = req.body;

    if (!password) return res.status(400).json({ error: "Password required" });

    try {
      // Verify admin password
      const admin = await pool.query("SELECT password FROM users WHERE id = $1", [req.user.id]);
      if (!bcrypt.compareSync(password, admin.rows[0].password)) {
        return res.status(401).json({ error: "Invalid admin password" });
      }

      await pool.query("BEGIN");
      // Delete related records that don't have ON DELETE CASCADE
      await pool.query("DELETE FROM scan_logs WHERE store_id = $1", [id]);
      await pool.query("DELETE FROM tickets WHERE store_id = $1", [id]);
      await pool.query("DELETE FROM users WHERE store_id = $1", [id]);
      await pool.query("DELETE FROM products WHERE store_id = $1", [id]);
      // Quotations and quotation_items have ON DELETE CASCADE, so they will be handled by deleting the store
      await pool.query("DELETE FROM stores WHERE id = $1", [id]);
      await pool.query("COMMIT");
      
      res.json({ success: true });
    } catch (e: any) {
      await pool.query("ROLLBACK");
      res.status(400).json({ error: e.message });
    }
  });

  // StoreAdmin: Manage Products
  app.get("/api/store/info", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    const slug = req.query.slug;
    
    let storeRes;
    if (storeId) {
      storeRes = await pool.query("SELECT * FROM stores WHERE id = $1", [storeId]);
    } else if (slug) {
      storeRes = await pool.query("SELECT * FROM stores WHERE slug = $1", [slug]);
    } else {
      return res.status(400).json({ error: "Store ID or Slug required" });
    }

    const store = storeRes.rows[0];
    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json(store);
  });

  app.post("/api/store/branding", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.body.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });
  
    const { logo_url, primary_color, default_currency, background_image_url, language, fiscal_brand, fiscal_terminal_id, fiscal_active, currency_rates } = req.body;
    await pool.query(
      "UPDATE stores SET logo_url = $1, primary_color = $2, default_currency = $3, background_image_url = $4, language = $5, fiscal_brand = $6, fiscal_terminal_id = $7, fiscal_active = $8, currency_rates = $9 WHERE id = $10", 
      [logo_url, primary_color, default_currency || 'TRY', background_image_url, language || 'tr', fiscal_brand, fiscal_terminal_id, fiscal_active, JSON.stringify(currency_rates || {"USD": 1, "EUR": 1, "GBP": 1}), storeId]
    );
    res.json({ success: true });
  });

  app.get("/api/store/analytics", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const totalScans = (await pool.query("SELECT COUNT(*)::INT as count FROM scan_logs WHERE store_id = $1", [storeId])).rows[0];
    const scansByDay = await pool.query(`
      SELECT TO_CHAR(d.date, 'DD/MM') as date, COALESCE(s.count, 0)::INT as count FROM (
        SELECT (CURRENT_DATE - (n || ' days')::INTERVAL)::DATE as date
        FROM generate_series(0, 6) n
      ) d
      LEFT JOIN (
        SELECT DATE(created_at) as scan_date, COUNT(*)::INT as count 
        FROM scan_logs 
        WHERE store_id = $1 
        GROUP BY DATE(created_at)
      ) s ON d.date = s.scan_date
      ORDER BY d.date ASC
    `, [storeId]);

    const topProducts = await pool.query(`
      SELECT p.name, p.barcode, COUNT(l.id)::INT as count 
      FROM scan_logs l 
      JOIN products p ON l.product_id = p.id 
      WHERE l.store_id = $1 
      GROUP BY l.product_id, p.name, p.barcode 
      ORDER BY count DESC 
      LIMIT 5
    `, [storeId]);

    const recentScans = await pool.query(`
      SELECT p.name, p.barcode, l.created_at 
      FROM scan_logs l 
      JOIN products p ON l.product_id = p.id 
      WHERE l.store_id = $1 
      ORDER BY l.created_at DESC 
      LIMIT 10
    `, [storeId]);

    res.json({
      totalScans,
      scansByDay: scansByDay.rows,
      topProducts: topProducts.rows,
      recentScans: recentScans.rows
    });
  });

  app.get("/api/store/users", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const users = await pool.query("SELECT id, email, role FROM users WHERE store_id = $1", [storeId]);
    res.json(users.rows);
  });

  app.post("/api/store/users", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.body.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const { email, password, role } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      await pool.query("INSERT INTO users (store_id, email, password, role) VALUES ($1, $2, $3, $4)", [storeId, email, hashedPassword, role]);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.delete("/api/store/users/:id", authenticate, async (req: any, res) => {
    try {
      const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
      if (!storeId) return res.status(400).json({ error: "Store ID required" });

      // Ensure user belongs to this store
      const userRes = await pool.query("SELECT * FROM users WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
      if (userRes.rows.length === 0) return res.status(404).json({ error: "User not found" });

      await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      console.error("Delete user error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/store/products", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const products = await pool.query("SELECT * FROM products WHERE store_id = $1", [storeId]);
    res.json(products.rows);
  });

  app.post("/api/store/products", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.body.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const { barcode, name, price, currency, description, stock_quantity, min_stock_level } = req.body;
    if (!barcode || !name || !price) return res.status(400).json({ error: "Missing fields" });
    
    try {
      // Check if barcode already exists for this store
      const existing = await pool.query("SELECT id FROM products WHERE store_id = $1 AND barcode = $2", [storeId, String(barcode)]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: "Bu barkod ile ürün oluşturuldu!" });
      }

      // Check limit
      const canAdd = await checkProductLimit(storeId);
      if (!canAdd) {
        return res.status(400).json({ error: "Ürün limitine ulaşıldı. Lütfen planınızı yükseltin." });
      }

      await pool.query(`
        INSERT INTO products (store_id, barcode, name, price, currency, description, stock_quantity, min_stock_level, updated_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      `, [storeId, String(barcode), name, parseFloat(price), currency || 'TRY', description || '', parseInt(stock_quantity) || 0, parseInt(min_stock_level) || 5]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/store/products/:id", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.body.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const { id } = req.params;
    const { barcode, name, price, currency, description, stock_quantity, min_stock_level } = req.body;
    try {
      await pool.query("UPDATE products SET barcode = $1, name = $2, price = $3, currency = $4, description = $5, stock_quantity = $6, min_stock_level = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 AND store_id = $9", 
        [String(barcode), name, parseFloat(price), currency || 'TRY', description || '', parseInt(stock_quantity) || 0, parseInt(min_stock_level) || 5, id, storeId]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/store/products/all", authenticate, async (req: any, res) => {
    try {
      const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
      if (!storeId) return res.status(400).json({ error: "Store ID required" });

      await pool.query("DELETE FROM products WHERE store_id = $1", [storeId]);
      res.json({ success: true });
    } catch (e: any) {
      console.error("Delete all products error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/store/products/:id", authenticate, async (req: any, res) => {
    try {
      const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
      if (!storeId) return res.status(400).json({ error: "Store ID required" });

      const { id } = req.params;
      await pool.query("DELETE FROM products WHERE id = $1 AND store_id = $2", [id, storeId]);
      res.json({ success: true });
    } catch (e: any) {
      console.error("Delete product error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // --- QUOTATION ROUTES ---

  app.get("/api/store/quotations", authenticate, async (req: any, res) => {
    try {
      // Strictly enforce store isolation: only superadmins can override storeId via query
      const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
      if (!storeId) return res.status(400).json({ error: "Store ID required" });
      
      const { search, status, startDate, endDate } = req.query;
      let query = "SELECT * FROM quotations WHERE store_id = $1";
      let params: any[] = [storeId];
      
      if (search) {
        query += ` AND (customer_name ILIKE $${params.length + 1} OR customer_title ILIKE $${params.length + 1})`;
        params.push(`%${search}%`);
      }

      if (status && status !== 'all') {
        query += ` AND status = $${params.length + 1}`;
        params.push(status);
      }

      if (startDate) {
        query += ` AND created_at >= $${params.length + 1}`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND created_at <= $${params.length + 1}`;
        params.push(endDate);
      }
      
      query += " ORDER BY created_at DESC";
      const result = await pool.query(query, params);
      
      // Fetch items for each quotation
      const quotationsWithItems = await Promise.all(result.rows.map(async (q: any) => {
        const itemsResult = await pool.query(
          "SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY id ASC",
          [q.id]
        );
        return { ...q, items: itemsResult.rows };
      }));
      
      res.json(quotationsWithItems);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/store/quotations/:id", authenticate, async (req: any, res) => {
    try {
      const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
      const { id } = req.params;
      
      const quotRes = await pool.query("SELECT * FROM quotations WHERE id = $1 AND store_id = $2", [id, storeId]);
      if (quotRes.rows.length === 0) return res.status(404).json({ error: "Quotation not found" });
      
      const itemsRes = await pool.query("SELECT * FROM quotation_items WHERE quotation_id = $1", [id]);
      res.json({ ...quotRes.rows[0], items: itemsRes.rows });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/store/quotations", authenticate, async (req: any, res) => {
    const client = await pool.connect();
    try {
      const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
      const { customer_name, customer_title, total_amount, currency, notes, items, company_id } = req.body;
      
      await client.query("BEGIN");
      
      const quotRes = await client.query(
        "INSERT INTO quotations (store_id, customer_name, customer_title, total_amount, currency, notes, company_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
        [storeId, customer_name, customer_title, total_amount, currency, notes, company_id || null]
      );
      const quotationId = quotRes.rows[0].id;
      
      for (const item of items) {
        await client.query(
          "INSERT INTO quotation_items (quotation_id, product_id, product_name, barcode, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [quotationId, item.product_id || null, item.product_name, item.barcode || null, item.quantity, item.unit_price, item.total_price]
        );
      }
      
      await client.query("COMMIT");
      res.json({ success: true, id: quotationId });
    } catch (e: any) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: e.message });
    } finally {
      client.release();
    }
  });

  app.put("/api/store/quotations/:id", authenticate, async (req: any, res) => {
    const client = await pool.connect();
    try {
      const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
      const { id } = req.params;
      const { customer_name, customer_title, total_amount, currency, notes, items, company_id } = req.body;
      
      await client.query("BEGIN");
      
      const quotRes = await client.query(
        "UPDATE quotations SET customer_name = $1, customer_title = $2, total_amount = $3, currency = $4, notes = $5, company_id = $6 WHERE id = $7 AND store_id = $8 RETURNING id",
        [customer_name, customer_title, total_amount, currency, notes, company_id || null, id, storeId]
      );
      
      if (quotRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Quotation not found" });
      }
      
      await client.query("DELETE FROM quotation_items WHERE quotation_id = $1", [id]);
      
      for (const item of items) {
        await client.query(
          "INSERT INTO quotation_items (quotation_id, product_id, product_name, barcode, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [id, item.product_id || null, item.product_name, item.barcode || null, item.quantity, item.unit_price, item.total_price]
        );
      }
      
      await client.query("COMMIT");
      res.json({ success: true });
    } catch (e: any) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: e.message });
    } finally {
      client.release();
    }
  });

  app.delete("/api/store/quotations/:id", authenticate, async (req: any, res) => {
    try {
      const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
      const { id } = req.params;
      await pool.query("DELETE FROM quotations WHERE id = $1 AND store_id = $2", [id, storeId]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Company & Current Account Endpoints ---

  app.get("/api/store/companies", authenticate, async (req: any, res) => {
    try {
      const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
      const result = await pool.query(
        `SELECT 
          c.*,
          COALESCE(SUM(CASE WHEN t.type = 'debt' THEN t.amount ELSE -t.amount END), 0) as balance
        FROM companies c
        LEFT JOIN current_account_transactions t ON c.id = t.company_id
        WHERE c.store_id = $1
        GROUP BY c.id
        ORDER BY c.title ASC`,
        [storeId]
      );
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/store/companies", authenticate, async (req: any, res) => {
    const { tax_office, tax_number, address, phone, email, contact_person } = req.body;
    const title = String(req.body.title || "").trim();
    const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
    try {
      // Check for unique title per store
      const existing = await pool.query("SELECT * FROM companies WHERE store_id = $1 AND LOWER(TRIM(title)) = LOWER($2)", [storeId, title]);
      if (existing.rows.length > 0) {
        return res.json(existing.rows[0]);
      }

      const result = await pool.query(
        "INSERT INTO companies (store_id, title, tax_office, tax_number, address, phone, email, contact_person) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
        [storeId, title, tax_office, tax_number, address, phone, email, contact_person]
      );
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/store/companies/:id", authenticate, async (req: any, res) => {
    const { title, tax_office, tax_number, address, phone, email, contact_person } = req.body;
    const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
    try {
      // Check for unique title per store (excluding current company)
      const existing = await pool.query("SELECT id FROM companies WHERE store_id = $1 AND LOWER(title) = LOWER($2) AND id != $3", [storeId, title, req.params.id]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: "Bu isimde bir şirket zaten mevcut." });
      }

      const result = await pool.query(
        "UPDATE companies SET title = $1, tax_office = $2, tax_number = $3, address = $4, phone = $5, email = $6, contact_person = $7 WHERE id = $8 AND store_id = $9 RETURNING *",
        [title, tax_office, tax_number, address, phone, email, contact_person, req.params.id, storeId]
      );
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/store/companies/:id", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    try {
      await pool.query("DELETE FROM companies WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/store/companies/:id/transactions", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    try {
      const result = await pool.query(
        "SELECT * FROM current_account_transactions WHERE company_id = $1 AND store_id = $2 ORDER BY transaction_date DESC",
        [req.params.id, storeId]
      );
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/store/companies/:id/transactions", authenticate, async (req: any, res) => {
    const { type, amount, description, transaction_date } = req.body;
    const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
    try {
      const result = await pool.query(
        "INSERT INTO current_account_transactions (store_id, company_id, type, amount, description, transaction_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [storeId, req.params.id, type, amount, description, transaction_date || new Date()]
      );
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/store/quotations/:id/approve", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      const qResult = await client.query(
        "SELECT * FROM quotations WHERE id = $1 AND store_id = $2 FOR UPDATE",
        [req.params.id, storeId]
      );
      
      if (qResult.rows.length === 0) {
        throw new Error("Quotation not found");
      }
      
      const quotation = qResult.rows[0];
      
      if (quotation.status === 'approved') {
        throw new Error("Quotation already approved");
      }
      
      if (!quotation.company_id) {
        throw new Error("Quotation must be linked to a company to be approved");
      }

      // Check if transaction already exists for this quotation (extra safety)
      const existingTx = await client.query("SELECT id FROM current_account_transactions WHERE quotation_id = $1", [quotation.id]);
      if (existingTx.rows.length > 0) {
        throw new Error("Quotation already has an associated transaction");
      }

      await client.query(
        "UPDATE quotations SET status = 'approved' WHERE id = $1",
        [req.params.id]
      );

      await client.query(
        "INSERT INTO current_account_transactions (store_id, company_id, quotation_id, type, amount, description) VALUES ($1, $2, $3, 'debt', $4, $5)",
        [
          storeId, 
          quotation.company_id, 
          quotation.id, 
          quotation.total_amount, 
          `Onaylanan Teklif #${quotation.id}`
        ]
      );

      await client.query("COMMIT");
      res.json({ success: true });
    } catch (err: any) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: err.message || "Failed to approve quotation" });
    } finally {
      client.release();
    }
  });

  // Public Sales Status
  app.get("/api/public/sales/:id/status", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query("SELECT status FROM sales WHERE id = $1", [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: "Sale not found" });
      res.json({ status: result.rows[0].status });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Store: Manage Sales (POS)
  app.get("/api/store/sales", authenticate, async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    const status = req.query.status;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let query = "SELECT * FROM sales WHERE store_id = $1";
    const params: any[] = [storeId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (startDate) {
      params.push(startDate);
      query += ` AND created_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate + ' 23:59:59');
      query += ` AND created_at <= $${params.length}`;
    }

    query += " ORDER BY created_at DESC";

    try {
      const sales = await pool.query(query, params);
      
      const salesWithDetails = [];
      for (const sale of sales.rows) {
        const items = await pool.query("SELECT * FROM sale_items WHERE sale_id = $1", [sale.id]);
        const payments = await pool.query("SELECT * FROM sale_payments WHERE sale_id = $1", [sale.id]);
        salesWithDetails.push({ ...sale, items: items.rows, payments: payments.rows });
      }
      
      res.json(salesWithDetails);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/store/sales/:id/complete", authenticate, async (req: any, res) => {
    const { id } = req.params;
    const { paymentMethod, payments } = req.body; // payments: [{method: 'cash', amount: 60}, {method: 'card', amount: 40}]
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      // 1. Get sale items to update stock
      const itemsRes = await client.query("SELECT * FROM sale_items WHERE sale_id = $1", [id]);
      
      for (const item of itemsRes.rows) {
        if (item.product_id) {
          await client.query(
            "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
            [item.quantity, item.product_id]
          );
        }
      }

      // 2. Update sale status and payment method (for backward compatibility, store primary or 'multiple')
      const primaryMethod = payments && payments.length > 0 ? (payments.length > 1 ? 'multiple' : payments[0].method) : (paymentMethod || 'cash');
      await client.query(
        "UPDATE sales SET status = 'completed', payment_method = $1 WHERE id = $2",
        [primaryMethod, id]
      );

      // 3. Save detailed payments if provided
      if (payments && payments.length > 0) {
        for (const p of payments) {
          await client.query(
            "INSERT INTO sale_payments (sale_id, payment_method, amount) VALUES ($1, $2, $3)",
            [id, p.method, p.amount]
          );
        }
      } else {
        // Fallback for single payment
        const saleRes = await client.query("SELECT total_amount FROM sales WHERE id = $1", [id]);
        const total = saleRes.rows[0].total_amount;
        await client.query(
          "INSERT INTO sale_payments (sale_id, payment_method, amount) VALUES ($1, $2, $3)",
          [id, paymentMethod || 'cash', total]
        );
      }

      await client.query("COMMIT");
      res.json({ success: true });
    } catch (e: any) {
      await client.query("ROLLBACK");
      res.status(400).json({ error: e.message });
    } finally {
      client.release();
    }
  });

  app.post("/api/store/sales/:id/cancel", authenticate, async (req: any, res) => {
    try {
      await pool.query("UPDATE sales SET status = 'cancelled' WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // StoreAdmin: Import Data
  app.post("/api/store/import", authenticate, upload.single("file"), async (req: any, res) => {
    const storeId = req.user.role === "superadmin" ? req.body.storeId : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    let mapping;
    try {
      mapping = JSON.parse(req.body.mapping);
    } catch (e) {
      return res.status(400).json({ error: "Invalid mapping data" });
    }

    if (!mapping.barcode || !mapping.name || !mapping.price) {
      return res.status(400).json({ error: "Barcode, Name, and Price columns must be mapped" });
    }
    
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer', codepage: 65001 });
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (data.length === 0) {
        return res.status(400).json({ error: "The uploaded file is empty" });
      }

      let successCount = 0;
      
      // Check limit for the whole batch
      const canAddBatch = await checkProductLimit(storeId, data.length);
      if (!canAddBatch) {
        // Find out how many more we can add
        const storeRes = await pool.query("SELECT plan FROM stores WHERE id = $1", [storeId]);
        const plan = storeRes.rows[0]?.plan || 'free';
        const limit = PLAN_LIMITS[plan] || 50;
        const currentCountRes = await pool.query("SELECT COUNT(*)::INT as count FROM products WHERE store_id = $1", [storeId]);
        const currentCount = currentCountRes.rows[0].count;
        const remaining = limit - currentCount;
        
        if (remaining <= 0) {
          throw new Error(`Ürün limitine ulaşıldı (${limit}). Lütfen planınızı yükseltin.`);
        }
        // We could potentially import only up to the limit, but for now let's just error out
        throw new Error(`Bu dosya ile toplam ürün sayınız limitinizi (${limit}) aşıyor. En fazla ${remaining} ürün daha ekleyebilirsiniz.`);
      }

      await pool.query("BEGIN");
      for (const item of data as any[]) {
        const barcode = String(item[mapping.barcode] || "").trim();
        const name = String(item[mapping.name] || "").trim();
        const priceStr = String(item[mapping.price] || "0").replace(/[^0-9.,]/g, "").replace(",", ".");
        const price = parseFloat(priceStr);

        if (barcode && name && !isNaN(price)) {
          // Check for existence to satisfy user requirement of "no duplicate entry"
          const existing = await pool.query("SELECT id FROM products WHERE store_id = $1 AND barcode = $2", [storeId, barcode]);
          if (existing.rows.length > 0) {
            throw new Error(`Barkod çakışması: ${barcode} barkodu ile ürün oluşturuldu!`);
          }

          const currency = item[mapping.currency] || mapping.currency || 'TRY';
          await pool.query(`
            INSERT INTO products (store_id, barcode, name, price, currency, description, updated_at) 
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          `, [
            storeId,
            barcode,
            name,
            price,
            currency,
            item[mapping.description] || ''
          ]);
          successCount++;
        }
      }
      await pool.query("COMMIT");
      fs.unlinkSync(req.file.path);
      res.json({ success: true, count: successCount, total: data.length });
    } catch (e: any) {
      await pool.query("ROLLBACK");
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(400).json({ error: e.message });
    }
  });

  // CRM: Tickets
  app.get("/api/tickets", authenticate, async (req: any, res) => {
    let tickets;
    if (req.user.role === "superadmin") {
      tickets = await pool.query("SELECT t.*, s.name as store_name FROM tickets t JOIN stores s ON t.store_id = s.id");
    } else {
      tickets = await pool.query("SELECT * FROM tickets WHERE store_id = $1", [req.user.store_id]);
    }
    res.json(tickets.rows);
  });

  app.post("/api/tickets", authenticate, async (req: any, res) => {
    if (req.user.role !== "storeadmin") return res.status(403).json({ error: "Forbidden" });
    const { subject, message } = req.body;
    await pool.query("INSERT INTO tickets (store_id, subject, message) VALUES ($1, $2, $3)", [req.user.store_id, subject, message]);
    res.json({ success: true });
  });

  const distPath = path.join(__dirname, "dist");
  
  if (process.env.NODE_ENV !== "production") {
    console.log("Loading Vite middleware for development...");
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware loaded.");
    } catch (e) {
      console.error("Failed to load Vite middleware, falling back to static dist:", e);
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
      }
    }
  } else {
    console.log("Serving static files from dist...");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
      console.log("Static file serving configured.");
    } else {
      console.error("Dist directory not found! Did you run 'npm run build'?");
    }
  }

  console.log(`Attempting to listen on 0.0.0.0:${PORT}...`);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server successfully running on http://0.0.0.0:${PORT}`);
    
    // Keep-Alive Mechanism for Render.com
    const APP_URL = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
    if (APP_URL) {
      console.log(`Keep-alive active for: ${APP_URL}`);
      setInterval(async () => {
        try {
          const res = await fetch(`${APP_URL}/api/health`);
          if (res.ok) {
            console.log(`Keep-alive ping successful: ${new Date().toISOString()}`);
          }
        } catch (e) {
          console.error("Keep-alive ping failed:", e);
        }
      }, 10 * 60 * 1000); // Every 10 minutes
    }
  });
}


startServer();
