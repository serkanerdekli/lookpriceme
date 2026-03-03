const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Yetkilendirme (Render.com'da Environment Variable olarak tanımlayacağız)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// TEST UCU: Sunucu çalışıyor mu?
app.get('/', (req, res) => {
  res.send('lookpriceme API Canlıda! 🚀');
});

// ÜRÜN GETİRME UCU: /api/v1/magaza-slug/urun-id
app.get('/api/v1/:storeSlug/:markerId', async (req, res) => {
  const { storeSlug, markerId } = req.params;

  try {
    const productRef = db.collection('products');
    const snapshot = await productRef
      .where('storeSlug', '==', storeSlug)
      .where('markerId', '==', markerId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }

    const productData = snapshot.docs[0].data();
    res.json({ id: snapshot.docs[0].id, ...productData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda hazır!`));
