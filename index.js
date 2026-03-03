const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS ayarı: İleride AR ekranımız (frontend) bu API'ye erişebilsin diye.
app.use(cors());
app.use(express.json());

// --- FIREBASE BAĞLANTISI ---
try {
  // Render.com'daki FIREBASE_SERVICE_ACCOUNT isimli ortam değişkenini okuyoruz
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin SDK başarıyla başlatıldı.");
} catch (error) {
  console.error("Firebase başlatma hatası! Lütfen Environment Variables kısmını kontrol edin:", error.message);
}

const db = admin.firestore();

// --- ROUTER (YOLLAR) ---

// 1. Ana Sayfa (Sunucu çalışıyor mu kontrolü için)
app.get('/', (req, res) => {
  res.send('lookpriceme API Canlıda! 🚀 Veritabanı sorgusu için /api/v1/magaza-adi/urun-id formatını kullanın.');
});

// 2. Ürün Sorgulama Ucu (SaaS Yapısı)
app.get('/api/v1/:storeSlug/:markerId', async (req, res) => {
  const { storeSlug, markerId } = req.params;

  // Render loglarında ne aradığımızı net görelim (Hata ayıklama için)
  console.log(`--- YENİ SORGU ---`);
  console.log(`Aranan Mağaza Slug: [${storeSlug}]`);
  console.log(`Aranan Ürün ID (markerId): [${markerId}]`);

  try {
    const productRef = db.collection('products');
    
    // Firestore sorgusu
    const snapshot = await productRef
      .where('storeSlug', '==', storeSlug)
      .where('markerId', '==', markerId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.warn(`DİKKAT: Veritabanında [${storeSlug}] mağazasına ait [${markerId}] kodlu ürün bulunamadı.`);
      return res.status(404).json({ 
        error: "Ürün bulunamadı", 
        detail: `Mağaza: ${storeSlug}, Ürün: ${markerId} kombinasyonu hatalı veya veritabanında yok.`
      });
    }

    // Ürün bulundu
    const productData = snapshot.docs[0].data();
    console.log(`BAŞARILI: Ürün bulundu -> ${productData.name}`);
    
    res.json({ 
      success: true,
      id: snapshot.docs[0].id, 
      ...productData 
    });

  } catch (error) {
    console.error("FIREBASE SORGUSU SIRASINDA HATA OLUŞTU:", error);
    res.status(500).json({ error: "Sunucu hatası", message: error.message });
  }
});

// --- SUNUCU BAŞLATMA ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`--- lookpriceme SISTEMI HAZIR ---`);
  console.log(`Port: ${PORT}`);
  console.log(`---------------------------------`);
});
