import React, { useState, useEffect, useCallback } from "react";
import { 
  Package, 
  Settings as SettingsIcon, 
  LogOut, 
  Trash2, 
  Upload, 
  AlertTriangle,
  CreditCard,
  Save,
  Menu,
  X
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
    store_name: "LookPrice",
    primary_color: "#4f46e5",
    logo_url: "",
    favicon_url: "",
    default_currency: "TRY",
    default_language: "tr"
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

  const handleSaveBranding = async () => {
    try {
      await api.put(`/api/store/branding/${user.store_id}`, branding);
      alert(lang === 'tr' ? "Ayarlar kaydedildi." : "Settings saved.");
    } catch (e: any) { alert(e.message); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    try {
      const res = await api.post(`/api/store/upload/${user.store_id}`, formData);
      setBranding({ ...branding, [type]: res.url });
    } catch (e: any) { alert(e.message); }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    try {
      await api.post(`/api/store/products/import/${user.store_id}`, formData);
      setShowImportModal(false);
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/api/store/products/export/${user.store_id}`);
      window.open(response.url, '_blank');
    } catch (e: any) { alert(e.message); }
  };

  const navItems = [
    { id: "inventory", label: t.products, icon: Package },
    { id: "settings", label: t.settings, icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" />
        )}
      </AnimatePresence>

      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-gray-100 z-50 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8">
            <div className="flex items-center space-x-3 mb-10">
              <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200"><Package className="text-white h-6 w-6" /></div>
              <span className="text-2xl font-black tracking-tighter text-gray-900">{branding.store_name}</span>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${activeTab === item.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-bold" : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"}`}
                >
                  <item.icon className={`h-5 w-5 ${activeTab === item.id ? "text-white" : "group-hover:text-indigo-600"}`} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-8 border-t border-gray-50">
            <div className="flex items-center space-x-4 mb-6 p-3 bg-gray-50 rounded-2xl">
              <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-bold border border-gray-100">{user.username ? user.username[0].toUpperCase() : '?'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user.username}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
            <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold">
              <LogOut className="h-5 w-5" /><span>{t.logout}</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 mr-4 text-gray-400 hover:text-gray-900 transition-colors"><Menu className="h-6 w-6" /></button>
            <h2 className="text-xl font-black text-gray-900">{navItems.find(i => i.id === activeTab)?.label}</h2>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-[1600px] mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {errorMsg && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center font-bold font-sans"><AlertTriangle className="mr-2 h-5 w-5" />{errorMsg}</div>}
            
            {activeTab === "inventory" && (
              <InventoryTab 
                products={products}
                loading={loading}
                isViewer={isViewer}
                onAddProduct={() => { setEditingProduct(null); setShowProductModal(true); }}
                onEdit={(p) => { setEditingProduct(p); setShowProductModal(true); }}
                onDelete={handleDeleteProduct}
                onImportExcel={() => setShowImportModal(true)}
                onExportExcel={handleExport}
              />
            )}
            {activeTab === "settings" && (
              <SettingsTab 
                branding={branding}
                onBrandingChange={(field: string, value: any) => setBranding({ ...branding, [field]: value })}
                onSaveBranding={handleSaveBranding}
                onLogoUpload={(e) => handleFileUpload(e, 'logo')}
                onFaviconUpload={(e) => handleFileUpload(e, 'favicon')}
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

      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-2xl font-black text-gray-900 font-sans">{editingProduct ? t.editProduct : t.addManual}</h3>
                <button onClick={() => setShowProductModal(false)} className="p-3 bg-white hover:bg-gray-100 rounded-2xl transition-all shadow-sm border border-gray-100"><X className="h-6 w-6 text-gray-400" /></button>
              </div>
              <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="p-8 space-y-4 font-sans">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.barcode}</label>
                    <input name="barcode" defaultValue={editingProduct?.barcode} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.productName}</label>
                    <input name="name" defaultValue={editingProduct?.name} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.price}</label>
                    <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Para Birimi' : 'Currency'}</label>
                    <select name="currency" defaultValue={editingProduct?.currency || branding?.default_currency || 'TRY'} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium">
                      <option value="TRY">TRY (₺)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.stock}</label>
                    <input name="stock_quantity" type="number" defaultValue={editingProduct?.stock_quantity || 0} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Kritik Stok' : 'Min Stock'}</label>
                    <input name="min_stock_level" type="number" defaultValue={editingProduct?.min_stock_level || 5} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center">
                  <Save className="h-5 w-5 mr-2" /> {editingProduct ? t.update : t.saveChanges}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showImportModal && (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 font-sans">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900">{t.importExcel}</h3>
                <button onClick={() => setShowImportModal(false)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all"><X className="h-6 w-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleImport} className="space-y-6">
                <input type="file" name="file" accept=".xlsx, .xls" required className="w-full" />
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all font-sans">{t.importExcel}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
