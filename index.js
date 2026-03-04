const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. ÖNCE: Statik dosyaları (public klasörü) dışarı açıyoruz
app.use(express.static('public'));

// Firebase Bağlantısı
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// --- API KATMANI ---

// Bize Ulaşın / Lead Kaydı
app.post('/api/contact', async (req, res) => {
    try {
        const { name, storeName, phone, email } = req.body;
        await db.collection('leads').add({
            name, storeName, phone, email, status: "Yeni", date: new Date()
        });
        res.json({ success: true, message: "Harika! Talebiniz alındı. Ekibimiz sizinle iletişime geçecek." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Ürün Detay Getirme (AR İçin)
app.get('/api/v1/:storeSlug/:markerId', async (req, res) => {
    const { storeSlug, markerId } = req.params;
    try {
        const snapshot = await db.collection('products')
            .where('storeSlug', '==', storeSlug)
            .where('markerId', '==', markerId)
            .limit(1).get();
        if (snapshot.empty) return res.status(404).json({ error: "Bulunamadı" });
        res.json({ success: true, ...snapshot.docs[0].data() });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- DİNAMİK MAĞAZA YÖNLENDİRMESİ ---
// Önemli: Bu rota en altta olmalı.
app.get('/:storeSlug', (req, res) => {
    const slug = req.params.storeSlug;
    // Eğer rezerve edilmiş bir kelime değilse, AR ekranını aç
    const reserved = ['login', 'dashboard', 'admin', 'api', 'index.html', 'ar.html'];
    if (reserved.includes(slug)) {
        return res.sendFile(path.join(__dirname, 'public', slug + '.html'));
    }
    // Burası sihirli an: serkan-mobilya yazınca ar.html'e gizlice yönlendiriyoruz
    res.sendFile(path.join(__dirname, 'public', 'ar.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`--- lookpriceme Platformu Canlıda ---`));
