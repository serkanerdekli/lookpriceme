import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Keyboard, 
  Plus, 
  ShoppingBag, 
  Trash2, 
  X 
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Logo from "../components/Logo";
import Scanner from "../components/Scanner";
import { api } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";

export default function CustomerScanPage() {
  const { slug } = useParams();
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [product, setProduct] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [basket, setBasket] = useState<any[]>(() => {
    const saved = localStorage.getItem(`basket_${slug}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [showBasket, setShowBasket] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [saleId, setSaleId] = useState<number | null>(null);
  const [saleStatus, setSaleStatus] = useState<string>("pending");

  useEffect(() => {
    let interval: any;
    if (orderCompleted && saleId) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/api/public/sales/${saleId}/status`);
          if (res.status === 'completed') {
            setSaleStatus('completed');
            clearInterval(interval);
          }
        } catch (e) {
          console.error("Status check error", e);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [orderCompleted, saleId]);

  useEffect(() => {
    fetchStore();
  }, [slug]);

  useEffect(() => {
    localStorage.setItem(`basket_${slug}`, JSON.stringify(basket));
  }, [basket, slug]);

  const fetchStore = async () => {
    const res = await api.get(`/api/public/store/${slug}`);
    if (!res.error) setStore(res);
  };

  const handleScan = async (barcode: string) => {
    setScanning(false);
    setLoading(true);
    setError("");
    setShowManual(false);
    
    try {
      const res = await api.get(`/api/public/scan/${slug}/${barcode}`);
      if (res.error) {
        setError(res.error);
        if (res.store) setStore(res.store);
      } else {
        setProduct(res);
        if (res.store) setStore(res.store);
      }
    } catch (e) {
      setError("Sunucu hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const addToBasket = (p: any) => {
    setBasket(prev => {
      const existing = prev.find(item => item.id === p.id);
      if (existing) {
        return prev.map(item => item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...p, quantity: 1 }];
    });
    setProduct(null);
    setScanning(true);
  };

  const removeFromBasket = (id: number) => {
    setBasket(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setBasket(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totalAmount = basket.reduce((acc, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 0;
    const itemCurrency = item.currency || 'TRY';
    const storeCurrency = store?.default_currency || 'TRY';
    
    if (itemCurrency === storeCurrency) {
      return acc + (price * qty);
    }
    
    const rates = store?.currency_rates || { "USD": 1, "EUR": 1, "GBP": 1 };
    let rate = 1;
    
    if (storeCurrency === 'TRY') {
      rate = rates[itemCurrency] || 1;
      return acc + (price * qty * rate);
    } else if (itemCurrency === 'TRY') {
      rate = 1 / (rates[storeCurrency] || 1);
      return acc + (price * qty * rate);
    } else {
      const toTry = rates[itemCurrency] || 1;
      const fromTry = 1 / (rates[storeCurrency] || 1);
      return acc + (price * qty * toTry * fromTry);
    }
  }, 0);

  const handleCheckout = async () => {
    if (basket.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post("/api/public/sales", {
        storeId: store.id,
        items: basket,
        totalAmount,
        currency: store.default_currency || 'TRY',
        customerName: 'Mobil Müşteri'
      });
      if (!res.error) {
        setSaleId(res.saleId);
        setOrderCompleted(true);
        setBasket([]);
        localStorage.removeItem(`basket_${slug}`);
      } else {
        alert(res.error);
      }
    } catch (e) {
      alert("Sipariş oluşturulurken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      handleScan(manualBarcode.trim());
    }
  };

  const primaryColor = store?.primary_color || "#4f46e5";

  if (orderCompleted) {
    return (
      <div className="min-h-screen text-white p-6 flex flex-col items-center justify-center transition-colors duration-500" style={{ backgroundColor: primaryColor }}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white text-gray-900 rounded-3xl p-8 w-full max-w-md text-center shadow-2xl"
        >
          <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {saleStatus === 'completed' ? (lang === 'tr' ? 'Ödeme Alındı!' : 'Payment Received!') : t.saleCompleted}
          </h2>
          <p className="text-gray-500 mb-8">
            {saleStatus === 'completed' ? (lang === 'tr' ? 'Alışverişiniz için teşekkür ederiz.' : 'Thank you for your purchase.') : t.orderSent}
          </p>
          
          <div className="bg-gray-50 p-6 rounded-2xl mb-8 flex flex-col items-center">
            <p className="text-xs font-bold text-gray-400 uppercase mb-4">{t.orderCode}</p>
            <div className={`bg-white p-4 rounded-xl shadow-sm border mb-4 transition-all ${saleStatus === 'completed' ? 'border-green-500 bg-green-50' : 'border-gray-100'}`}>
              <QRCodeSVG value={String(saleId)} size={180} />
            </div>
            <p className={`text-3xl font-black tracking-widest ${saleStatus === 'completed' ? 'text-green-600' : 'text-indigo-600'}`}>#{saleId}</p>
            {saleStatus === 'pending' && (
              <div className="mt-4 flex items-center text-xs text-orange-500 font-bold animate-pulse">
                <Clock size={12} className="mr-1" /> {lang === 'tr' ? 'Ödeme Bekleniyor...' : 'Awaiting Payment...'}
              </div>
            )}
          </div>

          <button 
            onClick={() => setOrderCompleted(false)}
            className="w-full py-4 rounded-xl font-bold text-white shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            {t.close}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 flex flex-col items-center transition-colors duration-500 relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
      {store?.background_image_url && (
        <div 
          className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${store.background_image_url})` }}
        />
      )}
      
      <div className="w-full max-w-md text-center mb-8 relative z-10">
        {store?.logo_url ? (
          <img src={store.logo_url} alt={store.name} className="h-16 mx-auto mb-4 object-contain" referrerPolicy="no-referrer" />
        ) : (
          <Logo size={64} className="mx-auto mb-4 opacity-80 text-white" />
        )}
        <h1 className="text-3xl font-bold mb-2">{store?.name || "Price Checker"}</h1>
        <p className="opacity-80">Ürün barkodunu tarayarak detayları görün</p>
      </div>

      <div className="w-full max-w-md relative z-10">
        {scanning ? (
          <div className="w-full max-w-md space-y-6">
            <Scanner onResult={handleScan} />
            
            <div className="flex flex-col items-center space-y-4">
              <button 
                onClick={() => setShowManual(!showManual)}
                className="flex items-center text-sm font-bold opacity-70 hover:opacity-100 transition-opacity"
              >
                <Keyboard className="h-4 w-4 mr-2" /> 
                {showManual ? "Kameraya Dön" : "Barkodu Elle Gir"}
              </button>
  
              <AnimatePresence>
                {showManual && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleManualSubmit}
                    className="w-full flex space-x-2 overflow-hidden"
                  >
                    <input 
                      type="text" 
                      placeholder="Barkod numarasını yazın..."
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/50 outline-none"
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value)}
                      autoFocus
                    />
                    <button 
                      type="submit"
                      className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold active:scale-95 transition-transform"
                    >
                      Sorgula
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white text-gray-900 rounded-3xl p-8 shadow-2xl"
          >
            {loading ? (
              <div className="text-center py-12 space-y-4">
                <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-600 font-medium">Ürün Bilgileri Getiriliyor...</p>
              </div>
            ) : product ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full" style={{ backgroundColor: `${primaryColor}15` }}>
                    <Logo size={48} className="text-indigo-600" />
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                  <p className="text-gray-500 mt-1">Barcode: {product.barcode}</p>
                </div>
                <div className="text-white p-6 rounded-2xl text-center" style={{ backgroundColor: primaryColor }}>
                  <span className="text-sm uppercase tracking-widest opacity-80">Fiyat</span>
                  <div className="text-4xl font-black mt-1">
                    {product.price.toLocaleString('tr-TR', { 
                      style: 'currency', 
                      currency: product.currency || store?.default_currency || 'TRY' 
                    })}
                  </div>
                </div>
                {product.description && (
                  <div className="text-gray-600 text-sm border-t pt-4">
                    {product.description}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => addToBasket(product)}
                    className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center shadow-lg active:scale-95"
                  >
                    <Plus className="mr-2 h-5 w-5" /> {t.addToBasket}
                  </button>
                  <button 
                    onClick={() => { setProduct(null); setScanning(true); setError(""); }}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold active:scale-95"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                <h2 className="text-xl font-bold">Ürün Bulunamadı</h2>
                <p className="text-gray-500">{error || "Bu barkoda ait bir ürün kaydı bulunamadı."}</p>
                <button 
                  onClick={() => { setScanning(true); setError(""); }}
                  className="w-full text-white py-4 rounded-xl font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  Tekrar Dene
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {basket.length > 0 && (
        <motion.button 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={() => setShowBasket(true)}
          className="fixed bottom-8 right-8 bg-white text-gray-900 p-4 rounded-full shadow-2xl z-50 flex items-center space-x-2 border-4 border-white"
          style={{ borderColor: `${primaryColor}40` }}
        >
          <div className="relative">
            <ShoppingBag size={24} />
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {basket.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          </div>
          <span className="font-black pr-2">
            {totalAmount.toLocaleString('tr-TR')} {store?.default_currency || 'TRY'}
          </span>
        </motion.button>
      )}

      <AnimatePresence>
        {showBasket && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">{t.basket}</h3>
                <button onClick={() => setShowBasket(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {basket.map(item => (
                  <div key={item.id} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-2xl">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">
                        {Number(item.price).toLocaleString('tr-TR')} {item.currency || store?.default_currency || 'TRY'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600"
                      >
                        -
                      </button>
                      <span className="font-bold w-4 text-center text-gray-900">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => removeFromBasket(item.id)}
                        className="ml-2 text-red-500 p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-gray-50 border-t">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-500 font-medium">{t.total}</span>
                  <span className="text-2xl font-black text-gray-900">
                    {totalAmount.toLocaleString('tr-TR')} {store?.default_currency || 'TRY'}
                  </span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={loading || basket.length === 0}
                  className="w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  {loading ? "Sipariş Veriliyor..." : t.completeOrder}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
