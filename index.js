const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path'); // Yeni eklendi
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- ÖNEMLİ: Statik dosyaları (HTML, CSS, JS) dışarı açıyoruz ---
app.use(express.static('public'));

try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log("Firebase Admin SDK Hazır.");
} catch (error) {
  console.error("Firebase Hatası:", error.message);
}

const db = admin.firestore();

// API UCU: Ürün Bilgisi Getir
app.get('/api/v1/:storeSlug/:markerId', async (req, res) => {
  const { storeSlug, markerId } = req.params;
  try {
    const snapshot = await db.collection('products')
      .where('storeSlug', '==', storeSlug)
      .where('markerId', '==', markerId)
      .limit(1).get();

    if (snapshot.empty) return res.status(404).json({ error: "Ürün yok" });
    res.json({ success: true, ...snapshot.docs[0].data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sistem ${PORT} portunda yayında!`));
