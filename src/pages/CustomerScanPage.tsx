import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  AlertCircle, 
  Keyboard, 
  Scan,
  X 
} from "lucide-react";
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

  useEffect(() => {
    fetchStore();
  }, [slug]);

  const fetchStore = async () => {
    try {
      const res = await api.getBranding(slug || "");
      if (res) setStore(res);
    } catch (e) {
      console.error("Store fetch error", e);
    }
  };

  const handleScan = async (barcode: string) => {
    setScanning(false);
    setLoading(true);
    setError("");
    setShowManual(false);
    
    try {
      const res = await api.getProductBySlug(slug || "", barcode);
      if (res.error) {
        setError(res.error);
      } else {
        setProduct(res);
      }
    } catch (e: any) {
      setError(lang === 'tr' ? "Ürün bulunamadı veya sunucu hatası." : "Product not found or server error.");
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

  return (
    <div className="min-h-screen text-white p-6 flex flex-col items-center transition-colors duration-500 relative overflow-hidden font-sans" style={{ backgroundColor: primaryColor }}>
      {store?.background_image_url && (
        <div 
          className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${store.background_image_url})` }}
        />
      )}
      
      <div className="w-full max-w-md text-center mb-8 relative z-10 py-8">
        {store?.logo_url ? (
          <img src={store.logo_url} alt={store.store_name} className="h-20 mx-auto mb-6 object-contain drop-shadow-xl" referrerPolicy="no-referrer" />
        ) : (
          <div className="h-20 w-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/30 shadow-xl">
             <Scan size={40} className="text-white" />
          </div>
        )}
        <h1 className="text-4xl font-black mb-2 tracking-tight drop-shadow-lg">{store?.store_name || "LookPrice"}</h1>
        <p className="text-lg font-medium opacity-90 drop-shadow-md">
          {lang === 'tr' ? 'Fiyat Rezaletine Son! Barkodu okut, fiyatı gör.' : 'Scan barcode to see the price.'}
        </p>
      </div>

      <div className="w-full max-w-md relative z-10 flex-1 flex flex-col items-center justify-center">
        {scanning ? (
          <div className="w-full space-y-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-white/30 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative">
                <Scanner onResult={handleScan} />
              </div>
            </div>
            
            <div className="flex flex-col items-center space-y-6">
              <button 
                onClick={() => setShowManual(!showManual)}
                className="flex items-center text-base font-black uppercase tracking-widest opacity-80 hover:opacity-100 transition-all bg-white/10 px-6 py-3 rounded-2xl border border-white/20 backdrop-blur-sm"
              >
                <Keyboard className="h-5 w-5 mr-3" /> 
                {showManual ? (lang === 'tr' ? 'Kameraya Dön' : 'Back to Camera') : (lang === 'tr' ? 'Barkodu Elle Gir' : 'Manual Entry')}
              </button>
  
              <AnimatePresence>
                {showManual && (
                  <motion.form 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onSubmit={handleManualSubmit}
                    className="w-full flex flex-col space-y-3"
                  >
                    <input 
                      type="text" 
                      placeholder={lang === 'tr' ? 'Barkod No...' : 'Barcode No...'}
                      className="w-full bg-white text-gray-900 rounded-2xl px-6 py-4 text-xl font-bold shadow-2xl focus:ring-4 focus:ring-white/50 outline-none transition-all"
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value)}
                      autoFocus
                    />
                    <button 
                      type="submit"
                      className="w-full bg-indigo-900 text-white px-6 py-4 rounded-2xl font-black text-xl active:scale-95 transition-all shadow-xl border border-white/10"
                    >
                      {lang === 'tr' ? 'SORGULA' : 'SEARCH'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full bg-white text-gray-900 rounded-[3rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100"
          >
            {loading ? (
              <div className="text-center py-20 space-y-6">
                <div className="relative h-20 w-20 mx-auto">
                    <div className="absolute inset-0 border-8 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-xl font-bold text-gray-600 animate-pulse">{lang === 'tr' ? 'Fiyat Soruluyor...' : 'Checking Price...'}</p>
              </div>
            ) : product ? (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">{product.barcode}</span>
                  <h2 className="text-4xl font-black text-gray-900 leading-tight">{product.name}</h2>
                </div>

                <div className="bg-gray-50 rounded-[2.5rem] p-8 text-center border border-gray-100 shadow-inner group">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">{lang === 'tr' ? 'GÜNCEL FİYAT' : 'CURRENT PRICE'}</span>
                  <div className="text-6xl font-black text-indigo-600 tracking-tighter transition-transform group-hover:scale-110 duration-300">
                    {Number(product.price).toLocaleString('tr-TR', { 
                      style: 'currency', 
                      currency: product.currency || store?.default_currency || 'TRY' 
                    })}
                  </div>
                </div>

                {product.description && (
                  <div className="bg-amber-50/50 p-6 rounded-2xl text-gray-600 text-sm font-medium leading-relaxed border border-amber-100/50 italic">
                    "{product.description}"
                  </div>
                )}
                
                <button 
                  onClick={() => { setProduct(null); setScanning(true); setError(""); setManualBarcode(""); }}
                  className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-black active:scale-95 transition-all flex items-center justify-center space-x-3"
                >
                  <Scan size={24} />
                  <span>{lang === 'tr' ? 'YENİ TARAMA' : 'NEW SCAN'}</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-10 space-y-6">
                <div className="h-24 w-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border-4 border-red-100">
                    <AlertCircle size={48} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-900">{lang === 'tr' ? 'Hata!' : 'Error!'}</h2>
                    <p className="text-gray-500 font-bold px-4">{error || (lang === 'tr' ? "Barkod tanınmadı." : "Barcode not recognized.")}</p>
                </div>
                <button 
                  onClick={() => { setScanning(true); setError(""); setManualBarcode(""); }}
                  className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all"
                >
                  {lang === 'tr' ? 'TEKRAR DENE' : 'TRY AGAIN'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <div className="w-full max-w-md mt-12 py-8 text-center relative z-10 border-t border-white/10">
          <p className="text-xs font-black tracking-widest opacity-40 uppercase">Powered by LookPrice SaaS</p>
      </div>
    </div>
  );
}
