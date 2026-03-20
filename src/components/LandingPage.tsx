import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Scan, 
  Zap, 
  BarChart3, 
  Play, 
  CheckCircle2, 
  ExternalLink, 
  Palette, 
  TrendingUp, 
  Instagram, 
  Phone, 
  MessageCircle, 
  Mail, 
  X,
  Upload,
  Volume2,
  VolumeX
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import * as XLSX from "xlsx";
import Logo from "./Logo";
import { translations } from "../translations";
import { api } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";

export const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang } = useLanguage();
  const t = translations[lang];

  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [registerForm, setRegisterForm] = useState({
    storeName: "",
    username: "",
    password: "",
    companyTitle: "",
    address: "",
    phone: "",
    language: lang as string,
    currency: "TRY",
    uploadMethod: "manual" as "manual" | "excel",
    excelData: [] as any[],
    mapping: {
      barcode: "",
      name: "",
      price: "",
      description: ""
    }
  });
  const [registerStatus, setRegisterStatus] = useState({ type: "", text: "" });
  const [liveActivity, setLiveActivity] = useState<{name: string, location: string} | null>(null);
  const [demoForm, setDemoForm] = useState({ name: "", storeName: "", phone: "", email: "", notes: "" });
  const [demoStatus, setDemoStatus] = useState({ type: "", text: "" });
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const activities = lang === 'tr' ? [
      { name: "Bir müşteri barkod okuttu", location: "İstanbul, Kadıköy" },
      { name: "Yeni bir mağaza katıldı", location: "Ankara, Çankaya" },
      { name: "Fiyat güncellemesi yapıldı", location: "İzmir, Alsancak" },
      { name: "Bir müşteri fiyat sorguladı", location: "Antalya, Muratpaşa" }
    ] : [
      { name: "A customer scanned a barcode", location: "London, UK" },
      { name: "A new store joined", location: "Berlin, Germany" },
      { name: "Price update completed", location: "Paris, France" },
      { name: "A customer checked a price", location: "New York, USA" }
    ];

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const activity = activities[Math.floor(Math.random() * activities.length)];
        setLiveActivity(activity);
        setTimeout(() => setLiveActivity(null), 5000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [lang]);

  useEffect(() => {
    if (location.state?.openDemo) {
      setShowDemoModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoStatus({ type: "loading", text: lang === 'tr' ? "Gönderiliyor..." : "Sending..." });
    
    try {
      const data = await api.post("/api/public/demo-request", demoForm);
      if (data.success) {
        setDemoStatus({ type: "success", text: lang === 'tr' ? "Talebiniz alındı!" : "Request received!" });
        setDemoForm({ name: "", storeName: "", phone: "", email: "", notes: "" });
        setTimeout(() => setShowDemoModal(false), 3000);
      }
    } catch (err) {
      setDemoStatus({ type: "error", text: "Bağlantı hatası." });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setRegisterForm(prev => ({ ...prev, excelData: data, uploadMethod: "excel" }));
      setRegisterStep(4);
    };
    reader.readAsBinaryString(file);
  };

  const handleRegisterSubmit = async () => {
    setRegisterStatus({ type: "loading", text: lang === 'tr' ? "Gönderiliyor..." : "Sending..." });
    try {
      const response = await api.post("/api/public/register-request", registerForm);
      if (response.success) {
        setRegisterStatus({ type: "success", text: translations[lang].registration.success.message });
        setTimeout(() => {
          setShowRegisterModal(false);
          setRegisterStep(1);
          setRegisterStatus({ type: "", text: "" });
        }, 5000);
      }
    } catch (err) {
      setRegisterStatus({ type: "error", text: "Bağlantı hatası." });
    }
  };

  return (
    <div className="bg-white font-sans">
      {/* Language Switcher */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col space-y-2">
        {['tr', 'en'].map((l) => (
          <button 
            key={l}
            onClick={() => setLang(l as 'tr' | 'en')}
            className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-bold transition-all shadow-lg ${
              lang === l ? 'bg-indigo-600 text-white' : 'bg-white/80 backdrop-blur-md text-gray-600 hover:bg-white'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-tighter mb-8">
                {t.hero.title}
              </h1>
              <p className="text-xl text-gray-400 max-w-lg mb-12 leading-relaxed">
                {t.hero.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setShowRegisterModal(true)}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:bg-indigo-700 transition-all"
                >
                  {t.hero.cta}
                </button>
                <button 
                  onClick={() => setShowVideoModal(true)}
                  className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center backdrop-blur-sm"
                >
                  <Play className="h-5 w-5 mr-2" /> {t.hero.watchDemo}
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative">
              <div className="relative z-10 bg-gradient-to-br from-gray-900 to-black p-2 rounded-[3.5rem] border border-white/10 shadow-2xl max-w-[320px] mx-auto lg:ml-auto">
                <div className="bg-black rounded-[3rem] overflow-hidden aspect-[9/16] relative">
                   <iframe 
                    src="https://www.youtube.com/embed/SiCv2skX0uY?autoplay=1&mute=1&loop=1&playlist=SiCv2skX0uY&controls=0"
                    className="absolute inset-0 w-full h-full pointer-events-none scale-[1.02]"
                    allow="autoplay; encrypted-media"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-y border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { val: "1.2M+", label: t.stats.scans },
              { val: "850+", label: t.stats.stores },
              { val: "99.9%", label: t.stats.uptime },
              { val: "24/7", label: "Support" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-black text-gray-900 mb-1">{stat.val}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-20">
            <h2 className="text-5xl font-black text-gray-900 mb-6 leading-tight">{t.features.title}</h2>
            <p className="text-xl text-gray-500">{t.features.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Scan, color: "bg-indigo-50 text-indigo-600", title: t.features.scan.title, desc: t.features.scan.desc },
              { icon: Zap, color: "bg-emerald-50 text-emerald-600", title: t.features.update.title, desc: t.features.update.desc },
              { icon: BarChart3, color: "bg-purple-50 text-purple-600", title: t.features.analytics.title, desc: t.features.analytics.desc }
            ].map((f, i) => (
              <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                <div className={`w-16 h-16 ${f.color} rounded-2xl flex items-center justify-center mb-8`}>
                  <f.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo QR Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-5xl font-black text-gray-900 mb-8 tracking-tighter">
                {t.demo.title}<br /><span className="text-indigo-600">{t.demo.subtitle}</span>
              </h2>
              <p className="text-xl text-gray-500 mb-12 leading-relaxed">{t.demo.desc}</p>
              <button 
                onClick={() => window.open(`${window.location.origin}/scan/demo-store`, '_blank')}
                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg flex items-center justify-center hover:bg-black transition-all"
              >
                <ExternalLink className="h-5 w-5 mr-3" /> {t.demo.startBtn}
              </button>
            </motion.div>
            <div className="relative bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col items-center">
              <div className="bg-gray-50 p-8 rounded-[2.5rem] mb-8 border border-gray-100">
                <QRCodeSVG value={`${window.location.origin}/scan/demo-store`} size={240} level="H" />
              </div>
              <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em]">{t.demo.scanText}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] py-16 text-gray-500 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
            <div className="md:col-span-4">
              <div className="flex items-center mb-6">
                <Logo size={28} className="text-white" />
                <span className="ml-2 text-lg font-bold text-white tracking-tighter">Look<span className="text-indigo-500">Price</span></span>
              </div>
              <p className="text-sm mb-6 max-w-xs">{t.footer.desc}</p>
              <div className="flex space-x-3">
                <a href="https://www.instagram.com/lookprice.me/" target="_blank" className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all border border-white/5">
                  <Instagram className="h-4 w-4 text-white" />
                </a>
                <a href="https://wa.me/905488902309" target="_blank" className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all border border-white/5">
                  <MessageCircle className="h-4 w-4 text-white" />
                </a>
              </div>
            </div>
            <div className="md:col-span-4">
               <h4 className="text-white font-bold mb-6 text-[10px] uppercase tracking-[0.2em]">{t.footer.contact}</h4>
               <p className="text-sm">lookprice.me@gmail.com</p>
               <p className="text-sm">+90 548 890 23 09</p>
            </div>
          </div>
          <p className="text-[10px] font-medium uppercase tracking-widest pt-8 border-t border-white/5">{t.footer.rights}</p>
        </div>
      </footer>

      {/* Registration Modal */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full p-10 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowRegisterModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600"><X /></button>
              
              <div className="mb-10">
                <div className="flex items-center space-x-2 mb-6">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${registerStep >= step ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {step}
                    </div>
                  ))}
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">Mağaza Kaydı</h2>
              </div>

              {registerStep === 1 && (
                <div className="space-y-6">
                   <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{translations[lang].registration.account.storeName}</label>
                    <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" value={registerForm.storeName} onChange={e => setRegisterForm({...registerForm, storeName: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{translations[lang].registration.account.username}</label>
                    <input type="email" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" value={registerForm.username} onChange={e => setRegisterForm({...registerForm, username: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{translations[lang].registration.account.password}</label>
                    <input type="password" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} />
                  </div>
                  <button onClick={() => setRegisterStep(2)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold mt-6">Devam Et</button>
                </div>
              )}

              {registerStep === 2 && (
                <div className="space-y-6">
                   <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mağaza Adresi</label>
                    <textarea className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" value={registerForm.address} onChange={e => setRegisterForm({...registerForm, address: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Telefon</label>
                    <input type="tel" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" value={registerForm.phone} onChange={e => setRegisterForm({...registerForm, phone: e.target.value})} />
                  </div>
                  <button onClick={handleRegisterSubmit} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold mt-6">Kaydı Tamamla</button>
                  {registerStatus.text && <p className="text-center text-sm font-bold text-indigo-600 mt-4">{registerStatus.text}</p>}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
