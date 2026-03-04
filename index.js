// ... (Önceki Firebase ve Express tanımlamaları aynı kalacak) ...

// 1. MAĞAZANIN TÜM ÜRÜNLERİNİ LİSTELE (Dashboard İçin)
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

// 2. YENİ ÜRÜN EKLE (Dashboard Formundan Gelen Veri)
app.post('/api/v1/products/add', async (req, res) => {
    try {
        const { storeSlug, name, price, markerId, description } = req.body;
        
        // Veritabanına ekle
        const newDoc = await db.collection('products').add({
            storeSlug,
            name,
            price: Number(price),
            markerId,
            description,
            createdAt: new Date()
        });
        
        res.json({ success: true, id: newDoc.id, message: "Ürün başarıyla eklendi!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ... (Geri kalan route ve listen kısımları aynı kalsın) ...
