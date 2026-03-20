import express from "express";
import "express-async-errors";
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
const keepAliveSupabase = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Supabase Keep-Alive: System active.");
  } catch (e) {
    console.error("Supabase Keep-Alive Error:", e);
  }
};

setInterval(keepAliveSupabase, 1000 * 60 * 60 * 24 * 3);
keepAliveSupabase(); 

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
        logo_url TEXT,
        primary_color TEXT DEFAULT '#4f46e5',
        default_currency TEXT DEFAULT 'TRY',
        language TEXT DEFAULT 'tr',
        background_image_url TEXT,
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
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        UNIQUE(store_id, barcode)
      );

      CREATE TABLE IF NOT EXISTS scan_logs (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        store_id INTEGER,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        store_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        status TEXT DEFAULT 'Yeni',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        excel_data JSONB,
        mapping JSONB,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
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
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

  await initDb();

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

  const getStoreId = (req: any) => {
    const explicitId = req.query.storeId || req.body.storeId;
    if (explicitId) return parseInt(explicitId);
    return req.user?.store_id || null;
  };

  // --- API ROUTES ---

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // Public: Scan
  app.get("/api/public/scan/:slug/:barcode", async (req, res) => {
    const { slug, barcode } = req.params;
    const storeRes = await pool.query("SELECT * FROM stores WHERE slug = $1", [slug]);
    let store = storeRes.rows[0];
    
    if (!store && (slug === 'demo-store' || slug === 'demo')) {
      store = { id: -1, name: "Demo Store", primary_color: "#4f46e5", default_currency: "TRY" };
    }
    if (!store) return res.status(404).json({ error: "Store not found" });

    const productRes = await pool.query("SELECT * FROM products WHERE store_id = $1 AND barcode = $2", [store.id, barcode]);
    const product = productRes.rows[0];
    
    if (!product) {
      return res.json({ 
        barcode, name: "Demo Product", price: 129.90, currency: store.default_currency, 
        description: "Demo product info.", is_demo: true, store 
      });
    }

    await pool.query("INSERT INTO scan_logs (store_id, product_id) VALUES ($1, $2)", [store.id, product.id]);
    res.json({ ...product, store });
  });

  // Public: Demo Request
  app.post("/api/public/demo-request", async (req, res) => {
    const { name, storeName, phone, email, notes } = req.body;
    await pool.query("INSERT INTO leads (name, store_name, phone, email, notes) VALUES ($1, $2, $3, $4, $5)", [name, storeName, phone, email, notes]);
    res.json({ success: true });
  });

  // Public: Register
  app.post("/api/public/register-request", async (req, res) => {
    const { storeName, username, password, companyTitle, address, phone, language, currency, excelData, mapping } = req.body;
    await pool.query(
      "INSERT INTO registration_requests (store_name, username, password, company_title, address, phone, language, currency, excel_data, mapping) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
      [storeName, username, password, companyTitle, address, phone, language, currency, JSON.stringify(excelData || []), JSON.stringify(mapping || {})]
    );
    res.json({ success: true });
  });

  // Auth
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const userRes = await pool.query("SELECT u.*, s.slug as store_slug FROM users u LEFT JOIN stores s ON u.store_id = s.id WHERE u.email = $1", [email]);
    const user = userRes.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Invalid credentials" });
    
    const token = jwt.sign({ id: user.id, role: user.role, store_id: user.store_id, store_slug: user.store_slug }, JWT_SECRET);
    res.json({ token, user: { email: user.email, role: user.role, store_id: user.store_id, store_slug: user.store_slug } });
  });

  // Store Admin: Products
  app.get("/api/store/products", authenticate, async (req: any, res) => {
    const storeId = getStoreId(req);
    const products = await pool.query("SELECT * FROM products WHERE store_id = $1", [storeId]);
    res.json(products.rows);
  });

  app.post("/api/store/products", authenticate, async (req: any, res) => {
    const storeId = getStoreId(req);
    const { barcode, name, price, currency, description } = req.body;
    await pool.query("INSERT INTO products (store_id, barcode, name, price, currency, description) VALUES ($1, $2, $3, $4, $5, $6)", [storeId, barcode, name, price, currency, description]);
    res.json({ success: true });
  });

  app.put("/api/store/products/:id", authenticate, async (req: any, res) => {
    const storeId = getStoreId(req);
    const { barcode, name, price, currency, description } = req.body;
    await pool.query("UPDATE products SET barcode = $1, name = $2, price = $3, currency = $4, description = $5 WHERE id = $6 AND store_id = $7", [barcode, name, price, currency, description, req.params.id, storeId]);
    res.json({ success: true });
  });

  app.delete("/api/store/products/:id", authenticate, async (req: any, res) => {
    const storeId = getStoreId(req);
    await pool.query("DELETE FROM products WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
    res.json({ success: true });
  });

  // Store Admin: Info & Branding
  app.get("/api/store/info", authenticate, async (req: any, res) => {
    const storeId = getStoreId(req);
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

  app.put("/api/store/branding/:id", authenticate, async (req: any, res) => {
    const storeId = parseInt(req.params.id);
    const { store_name, primary_color, logo_url, favicon_url, default_currency, language } = req.body;
    await pool.query(
      "UPDATE stores SET name = $1, primary_color = $2, logo_url = $3, background_image_url = $4, default_currency = $5, language = $6 WHERE id = $7",
      [store_name, primary_color, logo_url, favicon_url, default_currency, language, storeId]
    );
    res.json({ success: true });
  });

  // File Upload
  app.post("/api/store/upload/:id", authenticate, upload.single("file"), async (req: any, res) => {
    if (!req.file) return res.status(400).send("No file uploaded.");
    // In a real app, you'd upload to S3/Supabase. For now, we return a local or mock URL.
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // Excel Import/Export
  app.post("/api/store/products/import/:id", authenticate, upload.single("file"), async (req: any, res) => {
    const storeId = parseInt(req.params.id);
    const workbook = XLSX.readFile(req.file!.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = XLSX.utils.sheet_to_json(sheet);

    for (const row of data) {
      const barcode = row.barcode || row.Barkod;
      const name = row.name || row.UrunAdi || row.Ad;
      const price = parseFloat(row.price || row.Fiyat || 0);
      if (barcode && name) {
        await pool.query(
          "INSERT INTO products (store_id, barcode, name, price) VALUES ($1, $2, $3, $4) ON CONFLICT (store_id, barcode) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price",
          [storeId, barcode, name, price]
        );
      }
    }
    res.json({ success: true });
  });

  app.get("/api/store/products/export/:id", authenticate, async (req: any, res) => {
    const storeId = parseInt(req.params.id);
    const products = (await pool.query("SELECT barcode, name, price, currency FROM products WHERE store_id = $1", [storeId])).rows;
    const ws = XLSX.utils.json_to_sheet(products);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    const filePath = path.join(__dirname, `uploads/export_${storeId}.xlsx`);
    XLSX.writeFile(wb, filePath);
    res.json({ url: `/uploads/export_${storeId}.xlsx` });
  });

  // Store Admin: Users
  app.get("/api/store/users", authenticate, async (req: any, res) => {
    const storeId = getStoreId(req);
    const users = (await pool.query("SELECT id, email, role FROM users WHERE store_id = $1", [storeId])).rows;
    res.json(users);
  });

  app.delete("/api/store/users/:id", authenticate, async (req: any, res) => {
    const storeId = getStoreId(req);
    await pool.query("DELETE FROM users WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
    res.json({ success: true });
  });

  // Store Admin: Analytics
  app.get("/api/store/analytics", authenticate, async (req: any, res) => {
    const storeId = getStoreId(req);
    const totalScans = (await pool.query("SELECT COUNT(*)::INT as count FROM scan_logs WHERE store_id = $1", [storeId])).rows[0];
    const topProducts = (await pool.query("SELECT p.name, COUNT(l.id)::INT as count FROM scan_logs l JOIN products p ON l.product_id = p.id WHERE l.store_id = $1 GROUP BY p.name ORDER BY count DESC LIMIT 5", [storeId])).rows;
    res.json({ totalScans, topProducts });
  });

  // SuperAdmin Routes
  app.get("/api/admin/stores", authenticate, async (req: any, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).send("Forbidden");
    const stores = (await pool.query("SELECT * FROM stores")).rows;
    res.json(stores);
  });

  app.get("/api/admin/leads", authenticate, async (req: any, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).send("Forbidden");
    const leads = (await pool.query("SELECT * FROM leads ORDER BY created_at DESC")).rows;
    res.json(leads);
  });

  app.get("/api/admin/registration-requests", authenticate, async (req: any, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).send("Forbidden");
    const requests = (await pool.query("SELECT * FROM registration_requests ORDER BY created_at DESC")).rows;
    res.json(requests);
  });

  // API 404 Handler
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Serve Frontend
  const distPath = path.join(__dirname, "dist");
  if (fs.existsSync(distPath)) {
    if (!fs.existsSync(path.join(__dirname, "uploads"))) {
      fs.mkdirSync(path.join(__dirname, "uploads"));
    }
    app.use("/uploads", express.static(path.join(__dirname, "uploads")));
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server on port ${PORT}`));
}

startServer();
