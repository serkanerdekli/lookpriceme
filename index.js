const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Firebase Bağlantısı
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// 1. İletişim Formu API (Müşteri Taleplerini Alır)
app.post('/api/contact', async (req, res) => {
    try {
        const { name, storeName, phone, email } = req.body;
        await db.collection('leads').add({
            name, storeName, phone, email, date: new Date()
        });
        res.json({ success: true, message: "Talebiniz alındı, sizinle iletişime geçeceğiz!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. MAĞAZA ÖZEL LİNKİ YÖNLENDİRMESİ (En Kritik Kısım)
// Bu rota, /login gibi sabit rotalar haricindeki her şeyi bir mağaza slug'ı kabul eder.
app.get('/:storeSlug', (req, res) => {
    const slug = req.params.storeSlug;
    const reservedWords = ['api', 'login', 'admin', 'dashboard', 'assets', 'index.html'];
    
    if (reservedWords.includes(slug)) {
        return; // Normal akışına bırak
    }
    
    // Müşteriyi ar.html'e mağaza parametresiyle gönderiyoruz (Perde arkasında)
    res.sendFile(path.join(__dirname, 'public', 'ar.html'));
});

// Sunucu Başlatma
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`--- lookpriceme Platformu Hazır (${PORT}) ---`));
