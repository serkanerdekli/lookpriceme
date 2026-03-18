
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Scan, 
  Zap, 
  BarChart3, 
  Play, 
  CheckCircle2, 
  ExternalLink, 
  ChevronRight, 
  FileText, 
  Palette, 
  TrendingUp, 
  Instagram, 
  Phone, 
  MessageCircle, 
  Mail, 
  X,
  Globe,
  Upload,
  Search,
  Lock,
  AlertCircle,
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
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
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
  const [currentSlide, setCurrentSlide] = useState(0);
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
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
        setDemoStatus({ 
          type: "success", 
          text: lang === 'tr' ? "Talebiniz alındı! En kısa sürede sizinle iletişime geçeceğiz." : "Request received! We will contact you shortly." 
        });
        setDemoForm({ name: "", storeName: "", phone: "", email: "", notes: "" });
        setTimeout(() => {
          setShowDemoModal(false);
          setDemoStatus({ type: "", text: "" });
        }, 3000);
      } else {
        setDemoStatus({ 
          type: "error", 
          text: lang === 'tr' ? "Bir hata oluştu. Lütfen tekrar deneyin." : "An error occurred. Please try again." 
        });
      }
    } catch (err) {
      setDemoStatus({ 
        type: "error", 
        text: lang === 'tr' ? "Bağlantı hatası." : "Connection error." 
      });
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
      const response = await api.post("/api/public/register-request", {
        ...registerForm,
        plan: selectedPlan
      });

      if (response.success) {
        setRegisterStatus({ 
          type: "success", 
          text: translations[lang].registration.success.message 
        });
        setTimeout(() => {
          setShowRegisterModal(false);
          setRegisterStep(1);
          setRegisterStatus({ type: "", text: "" });
          setRegisterForm({
            storeName: "",
            username: "",
            password: "",
            companyTitle: "",
            address: "",
            phone: "",
            language: lang as string,
            currency: "TRY",
            uploadMethod: "manual",
            excelData: [],
            mapping: { barcode: "", name: "", price: "", description: "" }
          });
        }, 5000);
      } else {
        setRegisterStatus({ 
          type: "error", 
          text: response.error || (lang === 'tr' ? "Bir hata oluştu." : "An error occurred.") 
        });
      }
    } catch (err) {
      setRegisterStatus({ 
        type: "error", 
        text: lang === 'tr' ? "Bağlantı hatası." : "Connection error." 
      });
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Barkod": "8690000000001", "Ürün Adı": "Örnek Ürün 1", "Fiyat": 100, "Açıklama": "Açıklama 1" },
      { "Barkod": "8690000000002", "Ürün Adı": "Örnek Ürün 2", "Fiyat": 200, "Açıklama": "Açıklama 2" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ürünler");
    XLSX.writeFile(wb, "LookPrice_Urun_Sablonu.xlsx");
  };

  const references = [
    { name: "Güneş Plaza", logo: "https://scontent.fecn3-1.fna.fbcdn.net/v/t39.30808-1/365310681_122103211940009695_6924289774686929491_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=111&ccb=1-7&_nc_sid=2d3e12&_nc_ohc=vftvhw0ffugQ7kNvwEDx-BU&_nc_oc=Adly1F1pAvus0pzX2ttYGoz26b6Ndgzq3EzkPEI-Li6DxqTC0p0dpV7LgbrKtqIfqWI&_nc_zt=24&_nc_ht=scontent.fecn3-1.fna&_nc_gid=PxaDxdSAZhjcGfNJgwwOlg&_nc_ss=8&oh=00_Afve0fadiLFZMroBxnZqoJysdB0NKs33yhrWa7YTaTlX4A&oe=69A9D210" },
    { name: "Cyprus Outdoor Shop", logo: "https://cyprusoutdoorshop.com/wp-content/uploads/2025/10/cropped-COS-logo-yatay-1.png" },
    { name: "GAP", logo: "https://11d46382.cdn.akinoncloud.com/static_omnishop/gapzero164/img/gap_black.svg" },
    { name: "BAMIX", logo: "https://bamixhome.com/wp-content/uploads/2025/07/cropped-logo-scaled-1-1024x292.png" },
    { name: "Deniz Medikal", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZT8PDqi7qCfNatYPUTG7KdsWaRPmK2ZGdfg&s" }
  ];

  return (
    <div className="bg-white font-sans">
      {/* Language Switcher Floating */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col space-y-2">
        {['tr', 'en', 'de'].map((l) => (
          <button 
            key={l}
            onClick={() => setLang(l as 'tr' | 'en' | 'de')}
            className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-bold transition-all shadow-lg ${
              lang === l 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white/80 backdrop-blur-md text-gray-600 hover:bg-white'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Hero Section - SaaS Split Layout Touch */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Global Launch 2026</span>
              </div>
              
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-tighter mb-8">
                {t.hero.title.split(' ').map((word, i) => (
                  <span key={i} className={i === 0 ? "text-indigo-500" : ""}>{word} </span>
                ))}
              </h1>
              
              <p className="text-xl text-gray-400 max-w-lg mb-12 leading-relaxed">
                {t.hero.subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-col">
                  <button 
                    onClick={() => {
                      setSelectedPlan("free");
                      setShowRegisterModal(true);
                    }}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all transform hover:-translate-y-1"
                  >
                    {t.hero.cta}
                  </button>
                  <p className="text-[10px] text-gray-500 mt-2 text-center font-bold uppercase tracking-widest">{t.hero.ctaSubtext}</p>
                </div>
                <button 
                  onClick={() => setShowVideoModal(true)}
                  className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center backdrop-blur-sm"
                >
                  <Play className="h-5 w-5 mr-2" /> {t.hero.watchDemo}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative mt-12 lg:mt-0"
            >
              <div className="relative z-10 bg-gradient-to-br from-gray-900 to-black p-2 rounded-[3.5rem] border border-white/10 shadow-2xl max-w-[320px] mx-auto lg:ml-auto">
                <div className="bg-black rounded-[3rem] overflow-hidden aspect-[9/16] relative">
                  <iframe 
                    src={`https://www.youtube.com/embed/SiCv2skX0uY?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=SiCv2skX0uY&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&cc_load_policy=1&hl=en`}
                    className="absolute inset-0 w-full h-full pointer-events-none scale-[1.02]"
                    allow="autoplay; encrypted-media"
                    title="LookPrice Demo Video"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Mute/Unmute Toggle */}
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20 text-white hover:bg-white/20 transition-all"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>

                  {/* Floating UI Elements */}
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute top-10 left-10 bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/10"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Daily Scans</p>
                        <p className="text-lg font-black text-white">+1,240</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute bottom-10 right-10 bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/10"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Efficiency</p>
                        <p className="text-lg font-black text-white">99.9%</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
              
              {/* Decorative Rings */}
              <div className="absolute -top-20 -right-20 w-64 h-64 border border-indigo-500/20 rounded-full" />
              <div className="absolute -bottom-20 -left-20 w-96 h-96 border border-emerald-500/10 rounded-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Rail - Clean Utility */}
      <section className="bg-white border-y border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-1">1.2M+</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t.stats.scans}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-1">850+</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t.stats.stores}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-1">99.9%</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t.stats.uptime}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-1">24/7</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Minimal Grid */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              {t.features.title}
            </h2>
            <p className="text-lg sm:text-xl text-gray-500">
              {t.features.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Scan, color: "bg-indigo-50 text-indigo-600", title: t.features.scan.title, desc: t.features.scan.desc },
              { icon: Zap, color: "bg-emerald-50 text-emerald-600", title: t.features.update.title, desc: t.features.update.desc },
              { icon: BarChart3, color: "bg-purple-50 text-purple-600", title: t.features.analytics.title, desc: t.features.analytics.desc }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo - Brutalist Touch */}
      <section className="py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-8 leading-[0.95] tracking-tighter">
                {t.demo.title}<br />
                <span className="text-indigo-600">{t.demo.subtitle}</span>
              </h2>
              <p className="text-xl text-gray-500 mb-12 leading-relaxed">
                {t.demo.desc}
              </p>
              
              <div className="space-y-6 mb-12">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-black">01</div>
                  <div>
                    <h4 className="font-bold text-gray-900">{t.demo.noApp}</h4>
                    <p className="text-sm text-gray-500">{t.demo.noAppDesc}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-black">02</div>
                  <div>
                    <h4 className="font-bold text-gray-900">{t.demo.fast}</h4>
                    <p className="text-sm text-gray-500">{t.demo.fastDesc}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => window.open(`${window.location.origin}/scan/demo-store`, '_blank')}
                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg flex items-center justify-center hover:bg-black transition-all"
              >
                <ExternalLink className="h-5 w-5 mr-3" /> {t.demo.startBtn}
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, rotate: 5 }}
              whileInView={{ opacity: 1, rotate: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-indigo-600 rounded-[3rem] rotate-3 scale-105 opacity-5"></div>
              <div className="relative bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col items-center">
                <div className="bg-gray-50 p-8 rounded-[2.5rem] mb-8 border border-gray-100">
                  <QRCodeSVG 
                    value={`${window.location.origin}/scan/demo-store`} 
                    size={240}
                    level="H"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] mb-3">Live Demo</p>
                  <p className="text-sm text-gray-400">{t.demo.scanText}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quotation System - Dark Luxury */}
      <section className="py-32 bg-[#0a0a0a] text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-6">
              {t.quotation.badge}
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-8 leading-[0.95] tracking-tighter">
              {t.quotation.title}
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              {t.quotation.desc}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-12">
              <div className="flex items-start space-x-6">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
                  <Zap className="h-7 w-7 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold mb-3">{t.quotation.fast}</h4>
                  <p className="text-gray-400 leading-relaxed">{t.quotation.fastDesc}</p>
                </div>
              </div>
              <div className="flex items-start space-x-6">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
                  <Palette className="h-7 w-7 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold mb-3">{t.quotation.custom}</h4>
                  <p className="text-gray-400 leading-relaxed">{t.quotation.customDesc}</p>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <button 
                  onClick={() => {
                    setSelectedPlan("free");
                    setShowRegisterModal(true);
                  }}
                  className="px-10 py-5 bg-white text-black rounded-2xl font-black text-lg hover:bg-gray-100 transition-all"
                >
                  {t.quotation.cta}
                </button>
                <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest">{t.hero.ctaSubtext}</p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-1 rounded-[2.5rem] shadow-2xl">
                <div className="bg-white rounded-[2.2rem] overflow-hidden min-h-[480px] relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="p-10 space-y-8 h-full"
                    >
                      <div className="flex justify-between items-center">
                        <Logo size={40} className={currentSlide === 0 ? "text-indigo-600" : currentSlide === 1 ? "text-emerald-600" : "text-rose-600"} />
                        <div className="text-right">
                          <div className={`w-24 h-2 rounded-full mb-2 ml-auto ${currentSlide === 0 ? "bg-indigo-100" : currentSlide === 1 ? "bg-emerald-100" : "bg-rose-100"}`} />
                          <div className={`w-16 h-2 rounded-full ml-auto ${currentSlide === 0 ? "bg-indigo-50" : currentSlide === 1 ? "bg-emerald-50" : "bg-rose-50"}`} />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                          {currentSlide === 0 ? "Modern Minimal" : currentSlide === 1 ? "Corporate Pro" : "Luxury Boutique"}
                        </h5>
                        <div className={`h-1 w-12 rounded-full ${currentSlide === 0 ? "bg-indigo-600" : currentSlide === 1 ? "bg-emerald-600" : "bg-rose-600"}`} />
                      </div>

                      <div className="space-y-4">
                        {(currentSlide === 0 ? [
                          { name: "Premium Watch", price: "₺12.500" },
                          { name: "Leather Strap", price: "₺1.200" }
                        ] : currentSlide === 1 ? [
                          { name: "Diamond Ring", price: "₺45.000" },
                          { name: "Gift Box", price: "₺150" }
                        ] : [
                          { name: "Silk Scarf", price: "₺3.400" },
                          { name: "Handbag", price: "₺18.900" }
                        ]).map((item, i) => (
                          <div key={i} className="flex justify-between items-center py-4 border-b border-gray-50">
                            <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentSlide === 0 ? "bg-indigo-50" : currentSlide === 1 ? "bg-emerald-50" : "bg-rose-50"}`}>
                                <FileText className={`h-6 w-6 ${currentSlide === 0 ? "text-indigo-600" : currentSlide === 1 ? "text-emerald-600" : "text-rose-600"}`} />
                              </div>
                              <div className="text-sm font-bold text-gray-900">{item.name}</div>
                            </div>
                            <div className={`px-4 py-2 rounded-full text-[10px] font-black ${currentSlide === 0 ? "bg-indigo-50 text-indigo-600" : currentSlide === 1 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                              {item.price}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end pt-4">
                        <div className={`w-full h-14 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xl ${currentSlide === 0 ? "bg-indigo-600 shadow-indigo-600/20" : currentSlide === 1 ? "bg-emerald-600 shadow-emerald-600/20" : "bg-rose-600 shadow-rose-600/20"}`}>
                          {lang === 'tr' ? 'TEKLİFİ ONAYLA' : 'APPROVE QUOTE'}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
                    {[0, 1, 2].map((i) => (
                      <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-500 ${currentSlide === i ? 'w-8 bg-indigo-600' : 'w-2 bg-gray-200'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator - Clean Minimal */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 rounded-[3rem] p-12 md:p-20 border border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-4xl font-black text-gray-900 mb-6 leading-tight">
                  {t.roi.title}
                </h2>
                <p className="text-xl text-gray-500 mb-12">
                  {t.roi.subtitle}
                </p>
                
                <div className="space-y-10">
                  <div>
                    <div className="flex justify-between text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                      <span>{t.roi.customers}</span>
                      <span className="text-indigo-600">500+</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '75%' }}
                        className="h-full bg-indigo-600" 
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                      <span>{t.roi.time}</span>
                      <span className="text-emerald-600">40h</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '50%' }}
                        className="h-full bg-emerald-600" 
                      />
                    </div>
                  </div>
                </div>
                
                <p className="mt-12 text-sm text-gray-400 italic leading-relaxed">
                  {t.roi.disclaimer}
                </p>
              </div>

              <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <TrendingUp className="h-10 w-10 text-emerald-600" />
                </div>
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">{t.roi.annual}</p>
                <h3 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-4 break-words">{lang === 'tr' ? '₺45.000+' : '$1,500+'}</h3>
                <p className="text-gray-500 mb-10">{t.roi.annualDesc}</p>
                <button 
                  onClick={() => {
                    setSelectedPlan("free");
                    setShowRegisterModal(true);
                  }}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20"
                >
                  {t.roi.cta}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight">
              {t.pricing.title}
            </h2>
            <p className="text-xl text-gray-500">
              {t.pricing.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Free Plan */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t.pricing.free.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-black text-gray-900">{t.pricing.free.price}</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {t.pricing.free.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-center text-gray-600 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-3 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => {
                  setSelectedPlan("free");
                  setShowRegisterModal(true);
                }}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
              >
                {t.pricing.free.cta}
              </button>
            </div>

            {/* Basic Plan */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col relative overflow-hidden">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t.pricing.basic.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-black text-gray-900">{t.pricing.basic.price}</span>
                  <span className="text-gray-400 text-sm ml-1">{t.pricing.basic.period}</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {t.pricing.basic.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-center text-gray-600 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-3 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                disabled
                className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-bold cursor-not-allowed"
              >
                {t.pricing.basic.cta}
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-600 shadow-xl flex flex-col relative">
              <div className="absolute top-4 right-8">
                <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Popular</span>
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t.pricing.pro.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-black text-gray-900">{t.pricing.pro.price}</span>
                  <span className="text-gray-400 text-sm ml-1">{t.pricing.pro.period}</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {t.pricing.pro.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-center text-gray-600 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-3 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                disabled
                className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-bold cursor-not-allowed"
              >
                {t.pricing.pro.cta}
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-sm flex flex-col text-white">
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">{t.pricing.enterprise.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-black">{t.pricing.enterprise.price}</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {t.pricing.enterprise.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-center text-gray-400 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 mr-3 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => setShowDemoModal(true)}
                className="w-full py-4 bg-white text-gray-900 rounded-2xl font-bold hover:bg-gray-100 transition-all"
              >
                {t.pricing.enterprise.cta}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Compact & Organized */}
      <footer className="bg-[#0a0a0a] py-16 text-gray-500 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
            <div className="md:col-span-4">
              <div className="flex items-center mb-6">
                <Logo size={28} className="text-white" />
                <span className="ml-2 text-lg font-bold text-white tracking-tighter">Look<span className="text-indigo-500">Price</span></span>
              </div>
              <p className="text-sm leading-relaxed mb-6 max-w-xs">
                {t.footer.desc}
              </p>
              <div className="flex space-x-3">
                <a href="https://www.instagram.com/lookprice.me/" target="_blank" className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all border border-white/5">
                  <Instagram className="h-4 w-4 text-white" />
                </a>
                <a href="https://wa.me/905488902309" target="_blank" className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all border border-white/5">
                  <MessageCircle className="h-4 w-4 text-white" />
                </a>
              </div>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-white font-bold mb-6 text-[10px] uppercase tracking-[0.2em]">{t.footer.menu}</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => navigate("/login")} className="hover:text-white transition-colors">{t.nav.login}</button></li>
                <li><button onClick={() => setShowDemoModal(true)} className="hover:text-white transition-colors">{t.nav.demo}</button></li>
                <li><button className="hover:text-white transition-colors">{t.footer.privacy}</button></li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h4 className="text-white font-bold mb-6 text-[10px] uppercase tracking-[0.2em]">{t.footer.contact}</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <Phone className="h-3.5 w-3.5 mr-3 text-indigo-500" />
                  <a href="tel:+905488902309" className="hover:text-white transition-colors">+90 548 890 23 09</a>
                </li>
                <li className="flex items-center">
                  <Mail className="h-3.5 w-3.5 mr-3 text-indigo-500" />
                  <a href="mailto:lookprice.me@gmail.com" className="hover:text-white transition-colors">lookprice.me@gmail.com</a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3 flex flex-col items-start md:items-end">
              <h4 className="text-white font-bold mb-6 text-[10px] uppercase tracking-[0.2em]">Instagram</h4>
              <div className="bg-white p-1.5 rounded-xl w-24 h-24 flex items-center justify-center shadow-2xl">
                <QRCodeSVG 
                  value="https://www.instagram.com/lookprice.me/" 
                  size={88}
                  level="H"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-medium uppercase tracking-widest">{t.footer.rights}</p>
            <div className="flex space-x-6 text-[10px] font-medium uppercase tracking-widest">
              <button className="hover:text-white transition-colors">Terms</button>
              <button className="hover:text-white transition-colors">Privacy</button>
              <button className="hover:text-white transition-colors">Cookies</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Live Activity Notification */}
      <AnimatePresence>
        {liveActivity && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed bottom-8 left-8 z-[100] bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 flex items-center space-x-4 max-w-xs"
          >
            <div className="bg-indigo-100 p-2 rounded-full">
              <Zap className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{liveActivity.name}</p>
              <p className="text-xs text-gray-500">{liveActivity.location}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo Request Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 relative"
            >
              <button onClick={() => setShowDemoModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600"><X /></button>
              <h2 className="text-3xl font-black text-gray-900 mb-3">{lang === 'tr' ? 'Demo Talebi' : 'Request Demo'}</h2>
              <p className="text-gray-500 mb-10 leading-relaxed">{lang === 'tr' ? 'Bilgilerinizi bırakın, sizi arayalım ve LookPrice\'ı anlatalım.' : 'Leave your details, we will call you and explain LookPrice.'}</p>
              
              <form onSubmit={handleDemoSubmit} className="space-y-5">
                {demoStatus.text && (
                  <div className={`p-4 rounded-2xl text-sm font-bold ${demoStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-indigo-50 text-indigo-700'}`}>
                    {demoStatus.text}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'Ad Soyad' : 'Full Name'}</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                    value={demoForm.name} 
                    onChange={e => setDemoForm({...demoForm, name: e.target.value})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'Mağaza Adı' : 'Store Name'}</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                    value={demoForm.storeName} 
                    onChange={e => setDemoForm({...demoForm, storeName: e.target.value})} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'Telefon' : 'Phone'}</label>
                    <input 
                      type="tel" 
                      required 
                      placeholder="+90..."
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                      value={demoForm.phone} 
                      onChange={e => {
                        let val = e.target.value;
                        if (val && !val.startsWith('+')) val = '+' + val;
                        setDemoForm({...demoForm, phone: val});
                      }} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-posta</label>
                    <input 
                      type="email" 
                      required 
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                      value={demoForm.email} 
                      onChange={e => setDemoForm({...demoForm, email: e.target.value})} 
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={demoStatus.type === 'loading'}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {demoStatus.type === 'loading' ? (lang === 'tr' ? 'Gönderiliyor...' : 'Sending...') : (lang === 'tr' ? 'Talebi Gönder' : 'Send Request')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[110] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-5xl w-full aspect-video bg-black rounded-[2.5rem] overflow-hidden relative shadow-2xl border border-white/10"
            >
              <button onClick={() => setShowVideoModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white z-[120] bg-black/50 p-2 rounded-full backdrop-blur-md"><X /></button>
              <div className="w-full h-full">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/9zJzDUso6Uk?autoplay=1" 
                  title="LookPrice Demo Video" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                ></iframe>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Registration Modal */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full p-10 relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setShowRegisterModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600"><X /></button>
              
              <div className="mb-10">
                <div className="flex items-center space-x-2 mb-6">
                  {[1, 2, 3, 4].map((step) => (
                    <React.Fragment key={step}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        registerStep >= step ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step}
                      </div>
                      {step < 4 && <div className={`flex-grow h-0.5 ${registerStep > step ? 'bg-indigo-600' : 'bg-gray-100'}`} />}
                    </React.Fragment>
                  ))}
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">
                  {registerStep === 1 && translations[lang].registration.steps.account}
                  {registerStep === 2 && translations[lang].registration.steps.company}
                  {registerStep === 3 && translations[lang].registration.steps.products}
                  {registerStep === 4 && translations[lang].registration.steps.mapping}
                </h2>
              </div>

              {registerStatus.text && (
                <div className={`mb-6 p-4 rounded-2xl text-sm font-bold ${
                  registerStatus.type === 'success' ? 'bg-green-50 text-green-700' : 
                  registerStatus.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'
                }`}>
                  {registerStatus.text}
                </div>
              )}

              {registerStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{translations[lang].registration.account.storeName}</label>
                    <input 
                      type="text" 
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                      value={registerForm.storeName} 
                      onChange={e => setRegisterForm({...registerForm, storeName: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{translations[lang].registration.account.username}</label>
                    <input 
                      type="email" 
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                      value={registerForm.username} 
                      onChange={e => setRegisterForm({...registerForm, username: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{translations[lang].registration.account.password}</label>
                    <input 
                      type="password" 
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                      value={registerForm.password} 
                      onChange={e => setRegisterForm({...registerForm, password: e.target.value})} 
                    />
                  </div>
                </div>
              )}

              {registerStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{translations[lang].registration.company.companyTitle}</label>
                    <input 
                      type="text" 
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                      value={registerForm.companyTitle} 
                      onChange={e => setRegisterForm({...registerForm, companyTitle: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{translations[lang].registration.company.address}</label>
                    <textarea 
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                      value={registerForm.address} 
                      onChange={e => setRegisterForm({...registerForm, address: e.target.value})} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{translations[lang].registration.company.phone}</label>
                      <input 
                        type="tel" 
                        placeholder="+90..."
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                        value={registerForm.phone} 
                        onChange={e => {
                          let val = e.target.value;
                          if (val && !val.startsWith('+')) val = '+' + val;
                          setRegisterForm({...registerForm, phone: val});
                        }} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{translations[lang].registration.company.language}</label>
                      <select 
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                        value={registerForm.language} 
                        onChange={e => setRegisterForm({...registerForm, language: e.target.value})} 
                      >
                        <option value="tr">Türkçe</option>
                        <option value="en">English</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{translations[lang].registration.company.currency}</label>
                    <select 
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                      value={registerForm.currency} 
                      onChange={e => setRegisterForm({...registerForm, currency: e.target.value})} 
                    >
                      <option value="TRY">TL (₺)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>
              )}

              {registerStep === 3 && (
                <div className="space-y-8">
                  <p className="text-gray-500">{translations[lang].registration.products.title}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="cursor-pointer group">
                      <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                      <div className="h-full p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center text-center group-hover:border-indigo-600 group-hover:bg-indigo-50 transition-all">
                        <Upload className="h-10 w-10 text-gray-400 group-hover:text-indigo-600 mb-4" />
                        <h4 className="font-bold text-gray-900 mb-2">{translations[lang].registration.products.excel}</h4>
                      </div>
                    </label>
                    <button 
                      onClick={() => {
                        setRegisterForm({...registerForm, uploadMethod: "manual"});
                        setRegisterStep(4);
                      }}
                      className="p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center text-center hover:border-indigo-600 hover:bg-indigo-50 transition-all"
                    >
                      <Palette className="h-10 w-10 text-gray-400 mb-4" />
                      <h4 className="font-bold text-gray-900 mb-2">{translations[lang].registration.products.manual}</h4>
                    </button>
                  </div>
                  <button 
                    onClick={downloadTemplate}
                    className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold flex items-center justify-center hover:bg-indigo-100 transition-all"
                  >
                    <FileText className="h-5 w-5 mr-2" /> {translations[lang].registration.products.template}
                  </button>
                </div>
              )}

              {registerStep === 4 && (
                <div className="space-y-8">
                  {registerForm.uploadMethod === "excel" ? (
                    <>
                      <div className="bg-indigo-50 p-6 rounded-2xl">
                        <h4 className="font-bold text-indigo-900 mb-2">{translations[lang].registration.mapping.title}</h4>
                        <p className="text-sm text-indigo-700">{translations[lang].registration.mapping.desc}</p>
                      </div>
                      
                      <div className="space-y-4">
                        {Object.keys(registerForm.mapping).map((key) => (
                          <div key={key} className="grid grid-cols-2 gap-4 items-center">
                            <label className="text-sm font-bold text-gray-700">
                              {key === 'barcode' && translations[lang].registration.mapping.barcode}
                              {key === 'name' && translations[lang].registration.mapping.name}
                              {key === 'price' && translations[lang].registration.mapping.price}
                              {key === 'description' && translations[lang].registration.mapping.description}
                            </label>
                            <select 
                              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm"
                              value={registerForm.mapping[key as keyof typeof registerForm.mapping]}
                              onChange={e => setRegisterForm({
                                ...registerForm, 
                                mapping: { ...registerForm.mapping, [key]: e.target.value }
                              })}
                            >
                              <option value="">Seçiniz</option>
                              {registerForm.excelData.length > 0 && Object.keys(registerForm.excelData[0]).map(col => (
                                <option key={col} value={col}>{col}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="bg-gray-50 p-10 rounded-[2rem] text-center">
                      <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{translations[lang].registration.products.manual}</h4>
                      <p className="text-gray-500">{lang === 'tr' ? 'Hesabınız onaylandıktan sonra ürünlerinizi panel üzerinden tek tek ekleyebilirsiniz.' : 'You can add your products one by one through the panel after your account is approved.'}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-10 flex space-x-4">
                {registerStep > 1 && (
                  <button 
                    onClick={() => setRegisterStep(prev => prev - 1)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    {translations[lang].registration.buttons.back}
                  </button>
                )}
                {registerStep < 4 ? (
                  <button 
                    onClick={() => setRegisterStep(prev => prev + 1)}
                    disabled={registerStep === 3 && registerForm.uploadMethod === "excel" && registerForm.excelData.length === 0}
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {translations[lang].registration.buttons.next}
                  </button>
                ) : (
                  <button 
                    onClick={handleRegisterSubmit}
                    disabled={registerStatus.type === 'loading'}
                    className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {registerStatus.type === 'loading' ? (lang === 'tr' ? 'Gönderiliyor...' : 'Sending...') : translations[lang].registration.buttons.submit}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
