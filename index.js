const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// --- ARA YAZILIMLAR (MIDDLEWARE) ---
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- FIREBASE BAĞLANTISI ---
try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK Başarıyla Bağlandı.");
} catch (error) {
    console.error("Firebase Bağlantı Hatası:", error.message);
}

const db = admin.firestore();

// --- API ROTLARI ---

// 1. İletişim Formu (Lead Generation)
app.post('/api/contact', async (req, res) => {
    try {
        const { name, storeName, phone, email } = req.body;
        await db.collection('leads').add({
            name, storeName, phone, email, status: "Yeni", date: new Date()
        });
        res.json({ success: true, message: "Talebiniz başarıyla alındı!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// MAĞAZA BULMA: Email adresine göre mağaza slug'ını getirir
app.get('/api/v1/get-store-by-owner/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const snapshot = await db.collection('stores')
            .where('ownerEmail', '==', email)
            .limit(1).get();

        if (snapshot.empty) return res.status(404).json({ error: "Mağaza bulunamadı" });
        
        const storeData = snapshot.docs[0].data();
        res.json({ success: true, slug: storeData.slug || storeData.name.toLowerCase().replace(/ /g, "-") });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 2. Mağazanın Tüm Ürünlerini Listele (Dashboard İçin)
app.get('/api/v1/:storeSlug/products/all', async (req, res) => {
    const { storeSlug } = req.params;
    try {
        const snapshot = await db.collection('products')
            .where('storeSlug', '==', storeSlug)
            .get();
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Yeni Ürün Ekle (Dashboard'dan)
app.post('/api/v1/products/add', async (req, res) => {
    try {
        const { storeSlug, name, price, markerId, description } = req.body;
        const newDoc = await db.collection('products').add({
            storeSlug,
            name,
            price: Number(price),
            markerId,
            description,
            createdAt: new Date()
        });
        res.json({ success: true, id: newDoc.id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Tekli Ürün Getir (AR Ekranı İçin)
app.get('/api/v1/:storeSlug/:markerId', async (req, res) => {
    const { storeSlug, markerId } = req.params;
    try {
        const snapshot = await db.collection('products')
            .where('storeSlug', '==', storeSlug)
            .where('markerId', '==', markerId)
            .limit(1).get();
        if (snapshot.empty) return res.status(404).json({ error: "Ürün bulunamadı" });
        res.json({ success: true, ...snapshot.docs[0].data() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- DİNAMİK YÖNLENDİRME (EN ALTA OLMALI) ---
app.get('/:storeSlug', (req, res) => {
    const slug = req.params.storeSlug;
    const reserved = ['login', 'dashboard', 'admin', 'api', 'index.html', 'ar.html', 'assets'];
    
    // Eğer bir dosya adı veya özel kelime değilse mağaza AR sayfasına yönlendir
    if (reserved.includes(slug) || slug.includes('.')) {
        return res.sendFile(path.join(__dirname, 'public', slug + (slug.includes('.') ? '' : '.html')));
    }
    
    res.sendFile(path.join(__dirname, 'public', 'ar.html'));
});

// --- SUNUCU BAŞLATMA ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`lookpriceme Sunucusu ${PORT} portunda fırtına gibi esiyor!`);
});
