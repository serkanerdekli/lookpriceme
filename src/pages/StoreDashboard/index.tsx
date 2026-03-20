import React, { useState, useEffect, useCallback } from "react";
import { 
  Package, 
  Settings as SettingsIcon, 
  LogOut, 
  Trash2, 
  Upload, 
  AlertTriangle,
  Save,
  Menu,
  X,
  ChevronRight,
  User as UserIcon,
  LayoutDashboard,
  Search,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";
import { api } from "../../services/api";
import { User, Product } from "../../types";

// Import Tabs
import InventoryTab from "./InventoryTab";
import SettingsTab from "./SettingsTab";

interface StoreDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function StoreDashboard({ user, onLogout }: StoreDashboardProps) {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [activeTab, setActiveTab] = useState("inventory");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [branding, setBranding] = useState<any>({
    name: "LookPrice",
    primary_color: "#4f46e5",
    logo_url: "",
    default_currency: "TRY",
    language: "tr"
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isViewer = user.role === 'viewer';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsRes, brandingRes] = await Promise.all([
        api.getProducts(user.store_id),
        api.getBranding(user.store_slug)
      ]);
      setProducts(productsRes || []);
      if (brandingRes) setBranding(brandingRes);
      setErrorMsg(null);
    } catch (error: any) {
      console.error("Fetch error:", error);
      setErrorMsg(error.message || "Veriler yüklenirken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  }, [user.store_id, user.store_slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    try {
      await api.post(`/api/store/products`, { ...data, store_id: user.store_id });
      setShowProductModal(false);
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    try {
      await api.put(`/api/store/products/${editingProduct.id}`, data);
      setShowProductModal(false);
      setEditingProduct(null);
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm(lang === 'tr' ? 'Emin misiniz?' : 'Are you sure?')) return;
    try {
      await api.delete(`/api/store/products/${id}`);
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const navItems = [
    { id: "inventory", label: t.products, icon: Package },
    { id: "settings", label: t.settings, icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar - GitHub Style */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setSidebarOpen(false)} 
            className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-[2px]" 
          />
        )}
      </AnimatePresence>

      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-slate-900 z-50 transition-transform duration-300 ease-in-out border-r border-slate-800 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-slate-800/50">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Package className="text-white h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-lg font-bold tracking-tight text-white block truncate">{branding.name || 'LookPrice'}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Store Panel</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-3 mb-4">Main Menu</div>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  activeTab === item.id 
                  ? "bg-slate-800 text-white shadow-sm" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`h-4.5 w-4.5 transition-colors ${activeTab === item.id ? "text-indigo-400" : "group-hover:text-slate-300"}`} />
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
                {activeTab === item.id && <ChevronRight className="h-3.5 w-3.5 text-indigo-400/50" />}
              </button>
            ))}
          </nav>

          {/* User Section - Bottom */}
          <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
            <div className="flex items-center space-x-3 p-2.5 mb-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="h-9 w-9 bg-slate-700 rounded-lg flex items-center justify-center text-slate-200 font-bold border border-slate-600">
                {user.email ? user.email[0].toUpperCase() : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.email}</p>
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
            <button 
              onClick={onLogout} 
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200/60 flex items-center justify-between px-4 lg:px-8 shrink-0 relative z-30">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors bg-white rounded-lg border border-slate-200"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2 text-slate-400">
              <LayoutDashboard className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Dashboard</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-sm font-bold text-slate-900">{navItems.find(i => i.id === activeTab)?.label}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
             <div className="hidden sm:flex items-center px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 group focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                <Search className="h-4 w-4 text-slate-400 mr-2 group-focus-within:text-indigo-500" />
                <input type="text" placeholder={lang === 'tr' ? 'Hızlı ara...' : 'Quick search...'} className="bg-transparent border-none text-sm font-medium focus:ring-0 w-32 md:w-48 placeholder:text-slate-400" />
             </div>
             <button 
                onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
                className="h-10 px-4 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-sm hover:bg-indigo-700 transition-all flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline">Yeni Ekle</span>
             </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto w-full bg-[#FBFCFE]">
          <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-center font-bold text-sm shadow-sm">
                <AlertTriangle className="mr-3 h-5 w-5 text-rose-500" />
                {errorMsg}
              </div>
            )}
            
            {activeTab === "inventory" && (
              <InventoryTab 
                products={products}
                loading={loading}
                isViewer={isViewer}
                onAddProduct={() => { setEditingProduct(null); setShowProductModal(true); }}
                onEdit={(p) => { setEditingProduct(p); setShowProductModal(true); }}
                onDelete={handleDeleteProduct}
                onImportExcel={() => setShowImportModal(true)}
                onExportExcel={() => api.get(`/api/store/products/export/${user.store_id}`).then(res => window.open(res.url))}
              />
            )}
            
            {activeTab === "settings" && (
              <SettingsTab 
                branding={branding}
                onBrandingChange={(field: string, value: any) => setBranding({ ...branding, [field]: value })}
                onSaveBranding={async () => {
                  try {
                    await api.put(`/api/store/branding/${user.store_id}`, branding);
                    alert(lang === 'tr' ? "Ayarlar kaydedildi." : "Settings saved.");
                  } catch (e: any) { alert(e.message); }
                }}
                onLogoUpload={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('file', file);
                  try {
                    const res = await api.post(`/api/store/upload/${user.store_id}`, formData);
                    setBranding({ ...branding, logo_url: res.url });
                  } catch (e: any) { alert(e.message); }
                }}
                onFaviconUpload={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('file', file);
                  try {
                    const res = await api.post(`/api/store/upload/${user.store_id}`, formData);
                    setBranding({ ...branding, background_image_url: res.url });
                  } catch (e: any) { alert(e.message); }
                }}
                onAddUser={() => fetchData()}
                onDeleteUser={(id) => api.delete(`/api/store/users/${id}`).then(fetchData)}
                users={[]} 
                currentUser={user}
                onUpgradePlan={() => window.open("https://wa.me/905322521586", "_blank")}
              />
            )}
          </div>
        </div>
      </main>

      {/* Shared Modals Redesign */}
      {/* ... keeping logic same but styling them in next step or here if small ... */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 bg-slate-900/60 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{editingProduct ? t.editProduct : t.addManual}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">{editingProduct ? 'Ürün bilgilerini güncelleyin' : 'Yeni ürünü sisteme manuel ekleyin'}</p>
                </div>
                <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.barcode}</label>
                    <input name="barcode" defaultValue={editingProduct?.barcode} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold outline-none" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.productName}</label>
                    <input name="name" defaultValue={editingProduct?.name} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold outline-none" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.price}</label>
                    <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-indigo-600 outline-none" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang === 'tr' ? 'Para Birimi' : 'Currency'}</label>
                    <select name="currency" defaultValue={editingProduct?.currency || branding?.default_currency || 'TRY'} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-semibold">
                      <option value="TRY">TRY (₺)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2">
                  <Save className="h-5 w-5" /> 
                  <span>{editingProduct ? t.update : t.saveChanges}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showImportModal && (
          <div className="fixed inset-0 bg-slate-900/60 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">{t.importExcel}</h3>
                <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleImport} className="space-y-6">
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-500 transition-all group relative bg-slate-50/50">
                   <Upload className="h-8 w-8 text-slate-300 mx-auto mb-4 group-hover:text-indigo-500 transition-colors" />
                   <p className="text-sm font-bold text-slate-500 text-center">Excel dosyasını sürükleyin veya <span className="text-indigo-600">tıklayın</span></p>
                   <input type="file" name="file" accept=".xlsx, .xls" required className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl">{t.importExcel}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
