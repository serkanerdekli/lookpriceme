const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// --- API ROTLARI ---

// 1. İletişim Formu
app.post('/api/contact', async (req, res) => {
    try {
        await db.collection('leads').add({ ...req.body, date: new Date() });
        res.json({ success: true, message: "Talebiniz alındı!" });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// 2. Email'den Mağaza Slug'ını Bul (Kritik!)
app.get('/api/v1/get-store-by-owner/:email', async (req, res) => {
    try {
        const snapshot = await db.collection('stores').where('ownerEmail', '==', req.params.email).limit(1).get();
        if (snapshot.empty) return res.status(404).json({ error: "Mağaza bulunamadı" });
        res.json({ success: true, slug: snapshot.docs[0].data().slug });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Mağazanın Ürünlerini Listele
app.get('/api/v1/:storeSlug/products/all', async (req, res) => {
    try {
        const snapshot = await db.collection('products').where('storeSlug', '==', req.params.storeSlug).get();
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, products });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// 4. Yeni Ürün Ekle
app.post('/api/v1/products/add', async (req, res) => {
    try {
        const { storeSlug, name, price, markerId, description } = req.body;
        await db.collection('products').add({ storeSlug, name, price: Number(price), markerId, description, createdAt: new Date() });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// 5. AR İçin Tekli Ürün Getir
app.get('/api/v1/:storeSlug/:markerId', async (req, res) => {
    try {
        const snapshot = await db.collection('products').where('storeSlug', '==', req.params.storeSlug).where('markerId', '==', req.params.markerId).limit(1).get();
        if (snapshot.empty) return res.status(404).json({ error: "Bulunamadı" });
        res.json({ success: true, ...snapshot.docs[0].data() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- DİNAMİK YÖNLENDİRME ---
app.get('/:storeSlug', (req, res) => {
    const slug = req.params.storeSlug;
    const reserved = ['login', 'dashboard', 'admin', 'api', 'index.html', 'ar.html'];
    if (reserved.includes(slug) || slug.includes('.')) return res.sendFile(path.join(__dirname, 'public', slug + (slug.includes('.') ? '' : '.html')));
    res.sendFile(path.join(__dirname, 'public', 'ar.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sistem ${PORT} portunda hazır!`));
