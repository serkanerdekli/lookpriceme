import express from "express";
import "express-async-errors";
import pkg from 'pg';
const { Pool } = pkg;
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
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
  try { await pool.query("SELECT 1"); console.log("Supabase Keep-Alive: OK"); } catch (e) { console.error("Keep-Alive Error:", e); }
};
setInterval(keepAliveSupabase, 1000 * 60 * 60 * 24 * 3);
keepAliveSupabase();

// =============================================
// DATABASE SCHEMA
// =============================================
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      -- Core Tables
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        address TEXT, contact_person TEXT, phone TEXT, email TEXT,
        logo_url TEXT, primary_color TEXT DEFAULT '#4f46e5',
        default_currency TEXT DEFAULT 'TRY', language TEXT DEFAULT 'tr',
        plan TEXT DEFAULT 'free', subscription_end DATE,
        background_image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        store_id INTEGER,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        barcode TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL DEFAULT 0,
        currency TEXT DEFAULT 'TRY',
        unit TEXT DEFAULT 'Adet',
        description TEXT,
        stock_quantity INTEGER DEFAULT 0,
        min_stock_level INTEGER DEFAULT 5,
        category TEXT,
        image_url TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        UNIQUE(store_id, barcode)
      );

      -- Accounts (Cari Hesaplar)
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        company_name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        country TEXT DEFAULT 'TR',
        tax_office TEXT,
        tax_number TEXT,
        balance REAL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );

      -- Account Transactions (Cari Hareketler)
      CREATE TABLE IF NOT EXISTS account_transactions (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        reference_no TEXT,
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      );

      -- Quotations (Teklifler)
      CREATE TABLE IF NOT EXISTS quotations (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        quotation_no TEXT NOT NULL,
        account_id INTEGER,
        company_name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        status TEXT DEFAULT 'Beklemede',
        subtotal REAL DEFAULT 0,
        tax_rate REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        total REAL DEFAULT 0,
        currency TEXT DEFAULT 'TRY',
        notes TEXT,
        valid_until DATE,
        converted_at TIMESTAMP,
        payment_method TEXT,
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
      );

      -- Quotation Items (Teklif Kalemleri)
      CREATE TABLE IF NOT EXISTS quotation_items (
        id SERIAL PRIMARY KEY,
        quotation_id INTEGER NOT NULL,
        product_id INTEGER,
        barcode TEXT,
        product_name TEXT NOT NULL,
        unit TEXT DEFAULT 'Adet',
        quantity REAL NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        currency TEXT DEFAULT 'TRY',
        FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      );

      -- Stock Movements (Stok Hareketleri)
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        quantity REAL NOT NULL,
        reference_type TEXT,
        reference_id INTEGER,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      -- Cash Registers (Kasa Kayıtları)
      CREATE TABLE IF NOT EXISTS cash_registers (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        register_type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        reference_no TEXT,
        company_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );

      -- Legacy tables
      CREATE TABLE IF NOT EXISTS scan_logs (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL, product_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL, store_name TEXT NOT NULL, phone TEXT NOT NULL,
        email TEXT, status TEXT DEFAULT 'Yeni', notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS registration_requests (
        id SERIAL PRIMARY KEY,
        store_name TEXT NOT NULL, username TEXT NOT NULL, password TEXT NOT NULL,
        company_title TEXT, address TEXT, phone TEXT, language TEXT, currency TEXT,
        excel_data JSONB, mapping JSONB, status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration: Add columns to existing tables
    const migrations = [
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'Adet'",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'TRY'",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 5",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT",
      "ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free'",
      "ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_end DATE",
    ];
    for (const m of migrations) { try { await client.query(m); } catch(e) {} }

    // Seed Super Admin
    const adminEmail = "serkanerdekli@gmail.com";
    const existingAdmin = await client.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
    if (existingAdmin.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync("LookPrice2026!", 10);
      await client.query("INSERT INTO users (email, password, role) VALUES ($1, $2, $3)", [adminEmail, hashedPassword, "superadmin"]);
    }
  } finally { client.release(); }
}

// =============================================
// SERVER START
// =============================================
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
    try { req.user = jwt.verify(token, JWT_SECRET); next(); }
    catch (e) { res.status(401).json({ error: "Invalid token" }); }
  };

  const getStoreId = async (req: any) => {
    const explicitId = req.query.storeId || req.body.storeId;
    if (explicitId) return parseInt(explicitId);
    if (req.user?.store_id) return req.user.store_id;
    if (req.query.slug) {
      const store = (await pool.query("SELECT id FROM stores WHERE slug = $1", [req.query.slug])).rows[0];
      if (store) return store.id;
    }
    return null;
  };

  // Generate store-based quotation number
  const generateQuotationNo = async (storeId: number) => {
    const store = (await pool.query("SELECT slug FROM stores WHERE id = $1", [storeId])).rows[0];
    const prefix = (store?.slug || 'STR').toUpperCase().slice(0, 5);
    const count = (await pool.query("SELECT COUNT(*)::INT as c FROM quotations WHERE store_id = $1", [storeId])).rows[0].c;
    return `${prefix}-TKL-${String(count + 1).padStart(4, '0')}`;
  };

  // =============================================
  // API ROUTES
  // =============================================
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // --- AUTH ---
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const userRes = await pool.query("SELECT u.*, s.slug as store_slug FROM users u LEFT JOIN stores s ON u.store_id = s.id WHERE u.email = $1", [email]);
    const user = userRes.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, role: user.role, store_id: user.store_id, store_slug: user.store_slug }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, store_id: user.store_id, store_slug: user.store_slug } });
  });

  // --- PUBLIC ---
  app.get("/api/public/scan/:slug/:barcode", async (req, res) => {
    const { slug, barcode } = req.params;
    const storeRes = await pool.query("SELECT * FROM stores WHERE slug = $1", [slug]);
    let store = storeRes.rows[0];
    if (!store && (slug === 'demo-store' || slug === 'demo')) store = { id: -1, name: "Demo Store", primary_color: "#4f46e5", default_currency: "TRY" };
    if (!store) return res.status(404).json({ error: "Store not found" });
    const productRes = await pool.query("SELECT * FROM products WHERE store_id = $1 AND barcode = $2", [store.id, barcode]);
    const product = productRes.rows[0];
    if (!product) return res.json({ barcode, name: "Demo Product", price: 129.90, currency: store.default_currency, is_demo: true, store });
    await pool.query("INSERT INTO scan_logs (store_id, product_id) VALUES ($1, $2)", [store.id, product.id]);
    res.json({ ...product, store });
  });

  app.post("/api/public/demo-request", async (req, res) => {
    const { name, storeName, phone, email, notes } = req.body;
    await pool.query("INSERT INTO leads (name, store_name, phone, email, notes) VALUES ($1, $2, $3, $4, $5)", [name, storeName, phone, email, notes]);
    res.json({ success: true });
  });

  app.post("/api/public/register-request", async (req, res) => {
    const { storeName, username, password, companyTitle, address, phone, language, currency, excelData, mapping } = req.body;
    await pool.query(
      "INSERT INTO registration_requests (store_name, username, password, company_title, address, phone, language, currency, excel_data, mapping) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [storeName, username, password, companyTitle, address, phone, language, currency, JSON.stringify(excelData || []), JSON.stringify(mapping || {})]
    );
    res.json({ success: true });
  });

  // =============================================
  // STORE: PRODUCTS / STOCK
  // =============================================
  app.get("/api/store/products", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    const { search, category } = req.query;
    let q = "SELECT * FROM products WHERE store_id = $1";
    const params: any[] = [storeId];
    if (search) { q += " AND (name ILIKE $2 OR barcode ILIKE $2)"; params.push(`%${search}%`); }
    q += " ORDER BY created_at DESC";
    res.json((await pool.query(q, params)).rows);
  });

  app.post("/api/store/products", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    const { barcode, name, price, currency, unit, description, stock_quantity, category } = req.body;
    const result = await pool.query(
      "INSERT INTO products (store_id, barcode, name, price, currency, unit, description, stock_quantity, category) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
      [storeId, barcode, name, price || 0, currency || 'TRY', unit || 'Adet', description, stock_quantity || 0, category]
    );
    res.json(result.rows[0]);
  });

  app.put("/api/store/products/:id", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    const { barcode, name, price, currency, unit, description, stock_quantity, category } = req.body;
    await pool.query(
      "UPDATE products SET barcode=$1, name=$2, price=$3, currency=$4, unit=$5, description=$6, stock_quantity=$7, category=$8, updated_at=CURRENT_TIMESTAMP WHERE id=$9 AND store_id=$10",
      [barcode, name, price, currency, unit, description, stock_quantity, category, req.params.id, storeId]
    );
    res.json({ success: true });
  });

  app.delete("/api/store/products/:id", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    await pool.query("DELETE FROM products WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
    res.json({ success: true });
  });

  // Stock Movements
  app.get("/api/store/stock-movements", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    const { product_id } = req.query;
    let q = "SELECT sm.*, p.name as product_name, p.barcode FROM stock_movements sm JOIN products p ON sm.product_id = p.id WHERE sm.store_id = $1";
    const params: any[] = [storeId];
    if (product_id) { q += " AND sm.product_id = $2"; params.push(product_id); }
    q += " ORDER BY sm.created_at DESC";
    res.json((await pool.query(q, params)).rows);
  });

  app.post("/api/store/stock-movements", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    const { product_id, type, quantity, reference_type, reference_id, description } = req.body;
    await pool.query(
      "INSERT INTO stock_movements (store_id, product_id, type, quantity, reference_type, reference_id, description) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [storeId, product_id, type, quantity, reference_type, reference_id, description]
    );
    // Update stock quantity
    const modifier = type === 'in' ? quantity : -quantity;
    await pool.query("UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [modifier, product_id]);
    res.json({ success: true });
  });

  // =============================================
  // STORE: ACCOUNTS (CARİ HESAPLAR)
  // =============================================
  app.get("/api/store/accounts", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    const { search } = req.query;
    let q = "SELECT * FROM accounts WHERE store_id = $1";
    const params: any[] = [storeId];
    if (search) { q += " AND (company_name ILIKE $2 OR contact_person ILIKE $2 OR phone ILIKE $2)"; params.push(`%${search}%`); }
    q += " ORDER BY created_at DESC";
    res.json((await pool.query(q, params)).rows);
  });

  app.get("/api/store/accounts/:id", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    const account = (await pool.query("SELECT * FROM accounts WHERE id = $1 AND store_id = $2", [req.params.id, storeId])).rows[0];
    if (!account) return res.status(404).json({ error: "Account not found" });
    const transactions = (await pool.query("SELECT * FROM account_transactions WHERE account_id = $1 ORDER BY created_at DESC", [req.params.id])).rows;
    res.json({ ...account, transactions });
  });

  app.post("/api/store/accounts", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    const { company_name, contact_person, phone, email, address, country, tax_office, tax_number, notes } = req.body;
    const result = await pool.query(
      "INSERT INTO accounts (store_id, company_name, contact_person, phone, email, address, country, tax_office, tax_number, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *",
      [storeId, company_name, contact_person, phone, email, address, country || 'TR', tax_office, tax_number, notes]
    );
    res.json(result.rows[0]);
  });

  app.put("/api/store/accounts/:id", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    const { company_name, contact_person, phone, email, address, country, tax_office, tax_number, notes } = req.body;
    await pool.query(
      "UPDATE accounts SET company_name=$1, contact_person=$2, phone=$3, email=$4, address=$5, country=$6, tax_office=$7, tax_number=$8, notes=$9 WHERE id=$10 AND store_id=$11",
      [company_name, contact_person, phone, email, address, country, tax_office, tax_number, notes, req.params.id, storeId]
    );
    res.json({ success: true });
  });

  app.delete("/api/store/accounts/:id", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    await pool.query("DELETE FROM accounts WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
    res.json({ success: true });
  });

  // Account Transactions
  app.post("/api/store/account-transactions", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    const { account_id, type, amount, description, reference_no, due_date } = req.body;
    await pool.query(
      "INSERT INTO account_transactions (store_id, account_id, type, amount, description, reference_no, due_date) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [storeId, account_id, type, amount, description, reference_no, due_date]
    );
    // Update balance: BORÇ (+), ALACAK (-)
    const modifier = type === 'debit' ? amount : -amount;
    await pool.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [modifier, account_id]);
    res.json({ success: true });
  });

  // =============================================
  // STORE: QUOTATIONS (TEKLİFLER)
  // =============================================
  app.get("/api/store/quotations", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    const { search, status } = req.query;
    let q = "SELECT q.*, a.company_name as account_company FROM quotations q LEFT JOIN accounts a ON q.account_id = a.id WHERE q.store_id = $1";
    const params: any[] = [storeId];
    let paramIdx = 2;
    if (search) { q += ` AND (q.quotation_no ILIKE $${paramIdx} OR q.company_name ILIKE $${paramIdx})`; params.push(`%${search}%`); paramIdx++; }
    if (status) { q += ` AND q.status = $${paramIdx}`; params.push(status); paramIdx++; }
    q += " ORDER BY q.created_at DESC";
    res.json((await pool.query(q, params)).rows);
  });

  app.get("/api/store/quotations/:id", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    const quotation = (await pool.query("SELECT * FROM quotations WHERE id = $1 AND store_id = $2", [req.params.id, storeId])).rows[0];
    if (!quotation) return res.status(404).json({ error: "Quotation not found" });
    const items = (await pool.query("SELECT qi.*, p.barcode as product_barcode FROM quotation_items qi LEFT JOIN products p ON qi.product_id = p.id WHERE qi.quotation_id = $1 ORDER BY qi.id", [req.params.id])).rows;
    res.json({ ...quotation, items });
  });

  app.post("/api/store/quotations", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    const { company_name, contact_person, phone, email, address, items, notes, currency, tax_rate, valid_until } = req.body;

    // 1. Auto-create or find account
    let accountId = null;
    if (company_name) {
      const existing = (await pool.query("SELECT id FROM accounts WHERE store_id = $1 AND company_name ILIKE $2", [storeId, company_name])).rows[0];
      if (existing) {
        accountId = existing.id;
      } else {
        const newAcc = await pool.query(
          "INSERT INTO accounts (store_id, company_name, contact_person, phone, email, address) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
          [storeId, company_name, contact_person, phone, email, address]
        );
        accountId = newAcc.rows[0].id;
      }
    }

    // 2. Calculate totals
    let subtotal = 0;
    const processedItems: any[] = [];
    for (const item of (items || [])) {
      let productId = item.product_id;
      // Auto-create product if new
      if (!productId && item.barcode && item.product_name) {
        const existingProduct = (await pool.query("SELECT id FROM products WHERE store_id = $1 AND barcode = $2", [storeId, item.barcode])).rows[0];
        if (existingProduct) {
          productId = existingProduct.id;
        } else {
          const newProd = await pool.query(
            "INSERT INTO products (store_id, barcode, name, price, currency, unit, stock_quantity) VALUES ($1,$2,$3,$4,$5,$6,0) RETURNING id",
            [storeId, item.barcode, item.product_name, item.unit_price || 0, currency || 'TRY', item.unit || 'Adet']
          );
          productId = newProd.rows[0].id;
        }
      }
      const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
      subtotal += lineTotal;
      processedItems.push({ ...item, product_id: productId, total: lineTotal });
    }

    const taxAmt = subtotal * ((tax_rate || 0) / 100);
    const total = subtotal + taxAmt;
    const quotationNo = await generateQuotationNo(storeId);

    // 3. Insert quotation
    const qRes = await pool.query(
      "INSERT INTO quotations (store_id, quotation_no, account_id, company_name, contact_person, phone, email, address, subtotal, tax_rate, tax_amount, total, currency, notes, valid_until) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *",
      [storeId, quotationNo, accountId, company_name, contact_person, phone, email, address, subtotal, tax_rate || 0, taxAmt, total, currency || 'TRY', notes, valid_until]
    );
    const quotation = qRes.rows[0];

    // 4. Insert items
    for (const item of processedItems) {
      await pool.query(
        "INSERT INTO quotation_items (quotation_id, product_id, barcode, product_name, unit, quantity, unit_price, total, currency) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [quotation.id, item.product_id, item.barcode, item.product_name, item.unit || 'Adet', item.quantity || 1, item.unit_price || 0, item.total, currency || 'TRY']
      );
    }

    res.json(quotation);
  });

  app.put("/api/store/quotations/:id", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    const { status, notes } = req.body;
    await pool.query("UPDATE quotations SET status=$1, notes=$2 WHERE id=$3 AND store_id=$4", [status, notes, req.params.id, storeId]);
    res.json({ success: true });
  });

  app.delete("/api/store/quotations/:id", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    await pool.query("DELETE FROM quotations WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
    res.json({ success: true });
  });

  // =============================================
  // CONVERT QUOTATION TO SALE (SATIŞA DÖNÜŞTÜR)
  // =============================================
  app.post("/api/store/quotations/:id/convert", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    const { payment_method, due_date } = req.body;
    // payment_method: "cash" | "credit_card" | "bank_eft" | "deferred"

    const quotation = (await pool.query("SELECT * FROM quotations WHERE id = $1 AND store_id = $2", [req.params.id, storeId])).rows[0];
    if (!quotation) return res.status(404).json({ error: "Quotation not found" });
    if (quotation.status === 'Satış Yapıldı') return res.status(400).json({ error: "Already converted" });

    const items = (await pool.query("SELECT * FROM quotation_items WHERE quotation_id = $1", [req.params.id])).rows;

    // 1. Reduce stock for each item (STOK ÇIKIŞI)
    for (const item of items) {
      if (item.product_id) {
        await pool.query("UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [item.quantity, item.product_id]);
        await pool.query(
          "INSERT INTO stock_movements (store_id, product_id, type, quantity, reference_type, reference_id, description) VALUES ($1,$2,'out',$3,'quotation',$4,$5)",
          [storeId, item.product_id, item.quantity, quotation.id, `Satış: ${quotation.quotation_no}`]
        );
      }
    }

    // 2. Accounting entries
    if (quotation.account_id) {
      if (payment_method === 'deferred') {
        // Vadeli: BORÇ yaz, sıfırlama
        await pool.query(
          "INSERT INTO account_transactions (store_id, account_id, type, amount, description, reference_no, due_date) VALUES ($1,$2,'debit',$3,$4,$5,$6)",
          [storeId, quotation.account_id, quotation.total, `Vadeli Satış: ${quotation.quotation_no}`, quotation.quotation_no, due_date]
        );
        await pool.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [quotation.total, quotation.account_id]);
      } else {
        // Nakit/Kart/EFT: BORÇ + ALACAK (sıfırlama) + Kasa kaydı
        await pool.query(
          "INSERT INTO account_transactions (store_id, account_id, type, amount, description, reference_no) VALUES ($1,$2,'debit',$3,$4,$5)",
          [storeId, quotation.account_id, quotation.total, `Satış: ${quotation.quotation_no}`, quotation.quotation_no]
        );
        await pool.query(
          "INSERT INTO account_transactions (store_id, account_id, type, amount, description, reference_no) VALUES ($1,$2,'credit',$3,$4,$5)",
          [storeId, quotation.account_id, quotation.total, `Tahsilat: ${quotation.quotation_no}`, quotation.quotation_no]
        );
        // Balance stays 0 (debit + credit cancel)

        // Cash register entry
        const registerMap: Record<string, string> = { cash: 'Nakit Kasa', credit_card: 'Kredi Kartı', bank_eft: 'Banka/EFT' };
        await pool.query(
          "INSERT INTO cash_registers (store_id, register_type, amount, description, reference_no, company_name) VALUES ($1,$2,$3,$4,$5,$6)",
          [storeId, registerMap[payment_method] || payment_method, quotation.total, `Satış: ${quotation.quotation_no}`, quotation.quotation_no, quotation.company_name]
        );
      }
    }

    // 3. Update quotation status
    await pool.query("UPDATE quotations SET status='Satış Yapıldı', converted_at=CURRENT_TIMESTAMP, payment_method=$1, due_date=$2 WHERE id=$3",
      [payment_method, due_date, req.params.id]);

    res.json({ success: true });
  });

  // =============================================
  // STORE: CASH REGISTERS (KASA TAKİBİ)
  // =============================================
  app.get("/api/store/cash-registers", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    const { register_type, search } = req.query;
    let q = "SELECT * FROM cash_registers WHERE store_id = $1";
    const params: any[] = [storeId];
    let idx = 2;
    if (register_type) { q += ` AND register_type = $${idx}`; params.push(register_type); idx++; }
    if (search) { q += ` AND (reference_no ILIKE $${idx} OR company_name ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    q += " ORDER BY created_at DESC";
    res.json((await pool.query(q, params)).rows);
  });

  app.get("/api/store/cash-registers/summary", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    const summary = (await pool.query(
      "SELECT register_type, SUM(amount)::REAL as total FROM cash_registers WHERE store_id = $1 GROUP BY register_type",
      [storeId]
    )).rows;
    res.json(summary);
  });

  // =============================================
  // STORE INFO & BRANDING & USERS
  // =============================================
  app.get("/api/store/info", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    const slug = req.query.slug;
    let storeRes;
    if (storeId) storeRes = await pool.query("SELECT * FROM stores WHERE id = $1", [storeId]);
    else if (slug) storeRes = await pool.query("SELECT * FROM stores WHERE slug = $1", [slug]);
    else return res.status(400).json({ error: "Store ID or Slug required" });
    const store = storeRes.rows[0];
    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json(store);
  });

  app.put("/api/store/branding/:id", authenticate, async (req: any, res) => {
    const storeId = parseInt(req.params.id);
    const { store_name, primary_color, logo_url, favicon_url, default_currency, language } = req.body;
    await pool.query(
      "UPDATE stores SET name=$1, primary_color=$2, logo_url=$3, background_image_url=$4, default_currency=$5, language=$6 WHERE id=$7",
      [store_name, primary_color, logo_url, favicon_url, default_currency, language, storeId]
    );
    res.json({ success: true });
  });

  app.post("/api/store/upload/:id", authenticate, upload.single("file"), async (req: any, res) => {
    if (!req.file) return res.status(400).send("No file uploaded.");
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  app.get("/api/store/users", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    res.json((await pool.query("SELECT id, email, role FROM users WHERE store_id = $1", [storeId])).rows);
  });

  app.delete("/api/store/users/:id", authenticate, async (req: any, res) => {
    const storeId = await getStoreId(req);
    await pool.query("DELETE FROM users WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
    res.json({ success: true });
  });

  // =============================================
  // SUPERADMIN ROUTES
  // =============================================
  app.get("/api/admin/stores", authenticate, async (req: any, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: "Forbidden" });
    res.json((await pool.query("SELECT * FROM stores ORDER BY created_at DESC")).rows);
  });

  app.post("/api/admin/stores", authenticate, async (req: any, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: "Unauthorized" });
    const { name, slug, address, contact_person, phone, email, admin_email, admin_password, subscription_end, default_currency, language, plan } = req.body;
    try {
      const storeRes = await pool.query(
        "INSERT INTO stores (name, slug, address, phone, email, default_currency, language, plan, subscription_end) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
        [name, slug, address, phone, email || admin_email, default_currency || 'TRY', language || 'tr', plan || 'free', subscription_end || null]
      );
      const store = storeRes.rows[0];
      if (admin_email && admin_password) {
        const hp = bcrypt.hashSync(admin_password, 10);
        await pool.query("INSERT INTO users (store_id, email, password, role) VALUES ($1,$2,$3,$4)", [store.id, admin_email, hp, "storeadmin"]);
      }
      res.json(store);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.put("/api/admin/stores/:id", authenticate, async (req: any, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: "Unauthorized" });
    const { name, slug, address, phone, email, default_currency, language, plan, subscription_end } = req.body;
    await pool.query("UPDATE stores SET name=$1,slug=$2,address=$3,phone=$4,email=$5,default_currency=$6,language=$7,plan=$8,subscription_end=$9 WHERE id=$10",
      [name, slug, address, phone, email, default_currency, language, plan, subscription_end, req.params.id]);
    res.json({ success: true });
  });

  app.delete("/api/admin/stores/:id", authenticate, async (req: any, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: "Unauthorized" });
    await pool.query("DELETE FROM stores WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  });

  app.get("/api/admin/leads", authenticate, async (req: any, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: "Forbidden" });
    res.json((await pool.query("SELECT * FROM leads ORDER BY created_at DESC")).rows);
  });

  app.put("/api/admin/leads/:id", authenticate, async (req: any, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: "Unauthorized" });
    const { status, notes } = req.body;
    await pool.query("UPDATE leads SET status=$1, notes=$2 WHERE id=$3", [status, notes, req.params.id]);
    res.json({ success: true });
  });

  app.get("/api/admin/registration-requests", authenticate, async (req: any, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: "Forbidden" });
    res.json((await pool.query("SELECT * FROM registration_requests ORDER BY created_at DESC")).rows);
  });

  app.post("/api/admin/reset", authenticate, async (req: any, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: "Unauthorized" });
    try {
      for (const t of ['cash_registers','stock_movements','quotation_items','quotations','account_transactions','accounts','scan_logs','products','leads','registration_requests']) {
        await pool.query(`DELETE FROM ${t}`);
      }
      await pool.query("DELETE FROM users WHERE role != 'superadmin'");
      await pool.query("DELETE FROM stores");
      res.json({ success: true, message: "Database reset complete." });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // =============================================
  // API 404 + STATIC FILES
  // =============================================
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  const distPath = path.join(__dirname, "dist");
  if (fs.existsSync(distPath)) {
    if (!fs.existsSync(path.join(__dirname, "uploads"))) fs.mkdirSync(path.join(__dirname, "uploads"));
    app.use("/uploads", express.static(path.join(__dirname, "uploads")));
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server on port ${PORT}`));
}

startServer();
