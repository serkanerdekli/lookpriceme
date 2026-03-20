import React, { useState, useEffect, useCallback } from "react";
import { 
  LayoutDashboard, 
  Package, 
  Settings as SettingsIcon, 
  LogOut, 
  Plus, 
  Search, 
  Trash2, 
  Upload, 
  Edit2, 
  ChevronRight, 
  AlertTriangle,
  TrendingUp,
  Scan,
  FileText,
  Download,
  CheckCircle2,
  Filter,
  Store,
  Clock,
  XCircle,
  CreditCard,
  Save,
  Globe,
  Palette,
  User as UserIcon,
  Lock,
  Smartphone,
  MapPin,
  Mail,
  Languages,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";
import { api } from "../../services/api";
import { User, Product, Store as StoreType } from "../../types";

// Import Tabs
import ProductsTab from "./ProductsTab";
import AnalyticsTab from "./AnalyticsTab";
import QuotationsTab from "./QuotationsTab";
import CompaniesTab from "./CompaniesTab";
import PosTab from "./PosTab";
import SettingsTab from "./SettingsTab";

interface StoreDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function StoreDashboard({ user, onLogout }: StoreDashboardProps) {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [branding, setBranding] = useState<any>({
    store_name: "LookPrice",
    primary_color: "#4f46e5",
    logo_url: "",
    favicon_url: "",
    default_currency: "TRY",
    default_language: "tr"
  });
  const [quotations, setQuotations] = useState<any[]>([]);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<any>(null);
  const [quotationSearch, setQuotationSearch] = useState("");
  const [quotationStatusFilter, setQuotationStatusFilter] = useState("all");
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [includeZeroBalance, setIncludeZeroBalance] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesStatusFilter, setSalesStatusFilter] = useState("all");
  const [salesStartDate, setSalesStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [salesEndDate, setSalesEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isViewer = user.role === 'viewer';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsRes, analyticsRes, brandingRes, quotationsRes, companiesRes, usersRes] = await Promise.all([
        api.getProducts(),
        api.getAnalytics(),
        api.getBranding(),
        api.getQuotations(quotationSearch, quotationStatusFilter),
        api.getCompanies(includeZeroBalance),
        api.getUsers()
      ]);
      setProducts(productsRes);
      setAnalytics(analyticsRes);
      if (brandingRes) setBranding(brandingRes);
      setQuotations(quotationsRes);
      setCompanies(companiesRes);
      setUsers(usersRes);
      setErrorMsg(null);
    } catch (error: any) {
      console.error("Fetch error:", error);
      setErrorMsg(error.message || "Veriler yüklenirken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  }, [quotationSearch, quotationStatusFilter, includeZeroBalance]);

  const fetchSales = useCallback(async () => {
    try {
      setSalesLoading(true);
      const res = await api.getSales(salesStatusFilter, salesStartDate, salesEndDate);
      setSales(res);
    } catch (error) {
      console.error("Fetch sales error:", error);
    } finally {
      setSalesLoading(false);
    }
  }, [salesStatusFilter, salesStartDate, salesEndDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'pos') {
      fetchSales();
    }
  }, [activeTab, fetchSales]);

  // Handlers for Products
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, data);
      } else {
        await api.addProduct(data);
      }
      setShowProductModal(false);
      setEditingProduct(null);
      fetchData();
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm(t.confirmDelete)) {
      try {
        await api.deleteProduct(id);
        fetchData();
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  const handleDeleteAllProducts = async () => {
    if (window.confirm(lang === 'tr' ? "Tüm ürünleri silmek istediğinize emin misiniz?" : "Are you sure you want to delete all products?")) {
      try {
        await api.deleteAllProducts();
        fetchData();
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  // Handlers for Import
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    try {
      await api.importProducts(formData);
      setShowImportModal(false);
      fetchData();
      alert(lang === 'tr' ? "İçe aktarma başarılı" : "Import successful");
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  // Handlers for Branding
  const handleSaveBranding = async () => {
    try {
      await api.updateBranding(branding);
      alert(t.saveSuccess);
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.uploadFile(formData);
      setBranding({ ...branding, [type === 'logo' ? 'logo_url' : 'favicon_url']: res.url });
    } catch (error) {
      alert("Yükleme hatası");
    }
  };

  // Handlers for Quotations
  const handleAddQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    try {
      setShowQuotationModal(false);
      setEditingQuotation(null);
      fetchData();
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleApproveQuotation = async (id: number) => {
    try {
      await api.approveQuotation(id);
      fetchData();
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleDeleteQuotation = async (id: number) => {
    if (window.confirm(t.confirmDelete)) {
      try {
        await api.deleteQuotation(id);
        fetchData();
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  // Handlers for Companies
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    try {
      if (editingCompany) {
        await api.updateCompany(editingCompany.id, data);
      } else {
        await api.addCompany(data);
      }
      setShowCompanyModal(false);
      setEditingCompany(null);
      fetchData();
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  // Handlers for Users
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    try {
      await api.addUser(data);
      setShowUserModal(false);
      fetchData();
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm(t.confirmDelete)) {
      try {
        await api.deleteUser(id);
        fetchData();
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  const handleUpgradePlan = async (planName: string) => {
    try {
      const res = await api.initializePayment(planName);
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      }
    } catch (error: any) {
      alert(error.message || "Ödeme başlatılamadı");
    }
  };

  const handleCompleteSale = async (saleId: number, paymentMethod: string, companyId?: number) => {
    try {
      setLoading(true);
      await api.completeSale(saleId, { paymentMethod, companyId });
      setSelectedSale(null);
      fetchSales();
      fetchData(); // Refresh companies balance
      alert(lang === 'tr' ? "Satış başarıyla tamamlandı." : "Sale completed successfully.");
    } catch (error: any) {
      alert(error.message || "Satış tamamlanırken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSale = async (saleId: number) => {
    if (window.confirm(lang === 'tr' ? "Bu satışı iptal etmek istediğinize emin misiniz?" : "Are you sure you want to cancel this sale?")) {
      try {
        setLoading(true);
        await api.cancelSale(saleId);
        setSelectedSale(null);
        fetchSales();
      } catch (error: any) {
        alert(error.message || "Satış iptal edilirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    }
  };

  const navItems = [
    { id: "products", label: t.products, icon: Package },
    { id: "analytics", label: t.analytics, icon: LayoutDashboard },
    { id: "quotations", label: t.quotations, icon: FileText },
    { id: "companies", label: lang === 'tr' ? 'Şirketler' : 'Companies', icon: Store },
    { id: "pos", label: lang === 'tr' ? 'Satışlar' : 'Sales', icon: CreditCard },
    { id: "settings", label: t.settings, icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-gray-100 z-50 transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-8">
            <div className="flex items-center space-x-3 mb-10">
              <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Package className="text-white h-6 w-6" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-gray-900">{branding.store_name}</span>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                    activeTab === item.id 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-bold" 
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${activeTab === item.id ? "text-white" : "group-hover:text-indigo-600"}`} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-8 border-t border-gray-50">
            <div className="flex items-center space-x-4 mb-6 p-3 bg-gray-50 rounded-2xl">
              <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-bold border border-gray-100">
                {user.username ? user.username[0].toUpperCase() : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user.username}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold"
            >
              <LogOut className="h-5 w-5" />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 mr-4 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-black text-gray-900">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">
              <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span>Sistem Aktif</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {errorMsg && (
              <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center font-bold">
                <AlertTriangle className="mr-2 h-5 w-5" />
                {errorMsg}
              </div>
            )}

            {branding.plan !== 'free' && branding.plan !== 'basic' && branding.subscription_end && (
              (() => {
                const daysLeft = Math.ceil((new Date(branding.subscription_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 7) {
                  return (
                    <div className={`mb-6 p-4 rounded-2xl border flex items-center shadow-sm ${daysLeft < 0 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                      <div className={`p-2 rounded-xl mr-4 ${daysLeft < 0 ? 'bg-red-100' : 'bg-amber-100'}`}>
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black">
                          {daysLeft < 0 
                            ? (lang === 'tr' ? 'ABONELİK SÜRESİ DOLDU' : 'SUBSCRIPTION EXPIRED')
                            : (lang === 'tr' ? `ABONELİK YENİLEME YAKLAŞIYOR (${daysLeft} GÜN KALDI)` : `SUBSCRIPTION RENEWAL SOON (${daysLeft} DAYS LEFT)`)
                          }
                        </p>
                        <p className="text-xs font-bold opacity-80">
                          {daysLeft < 0 
                            ? (lang === 'tr' ? 'Hizmete kesintisiz devam etmek için lütfen paketinizi yenileyin.' : 'Please renew your plan to continue service without interruption.')
                            : (lang === 'tr' ? 'Paketinizi ayarlardan yenileyebilirsiniz.' : 'You can renew your plan from settings.')
                          }
                        </p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${daysLeft < 0 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-amber-600 text-white hover:bg-amber-700'}`}
                      >
                        {lang === 'tr' ? 'YENİLE' : 'RENEW'}
                      </button>
                    </div>
                  );
                }
                return null;
              })()
            )}
            
            {activeTab === "products" && (
              <ProductsTab 
                products={products}
                loading={loading}
                isViewer={isViewer}
                onAddManual={() => { setEditingProduct(null); setShowProductModal(true); }}
                onImport={() => setShowImportModal(true)}
                onDeleteAll={handleDeleteAllProducts}
                onEdit={(p) => { setEditingProduct(p); setShowProductModal(true); }}
                onDelete={handleDeleteProduct}
              />
            )}
            {activeTab === "analytics" && (
              <AnalyticsTab analytics={analytics} branding={branding} />
            )}
            {activeTab === "quotations" && (
              <QuotationsTab 
                quotations={quotations}
                isViewer={isViewer}
                onAddQuotation={() => { setEditingQuotation(null); setShowQuotationModal(true); }}
                onViewDetails={(id) => { /* Details logic */ }}
                onGeneratePDF={(q) => { /* PDF logic */ }}
                onApprove={handleApproveQuotation}
                onEdit={(q) => { setEditingQuotation(q); setShowQuotationModal(true); }}
                onDelete={handleDeleteQuotation}
                onSearchChange={setQuotationSearch}
                onStatusFilterChange={setQuotationStatusFilter}
                statusFilter={quotationStatusFilter}
              />
            )}
            {activeTab === "companies" && (
              <CompaniesTab 
                companies={companies}
                isViewer={isViewer}
                onAddCompany={() => { setEditingCompany(null); setShowCompanyModal(true); }}
                onViewTransactions={(c) => { setSelectedCompany(c); setShowTransactionModal(true); }}
                onEdit={(c) => { setEditingCompany(c); setShowCompanyModal(true); }}
                onExportReport={() => { /* Export logic */ }}
                includeZero={includeZeroBalance}
                onIncludeZeroChange={setIncludeZeroBalance}
              />
            )}
            {activeTab === "pos" && (
              <PosTab 
                sales={sales}
                loading={salesLoading}
                statusFilter={salesStatusFilter}
                onStatusFilterChange={setSalesStatusFilter}
                startDate={salesStartDate}
                onStartDateChange={setSalesStartDate}
                endDate={salesEndDate}
                onEndDateChange={setSalesEndDate}
                onViewDetails={(s) => setSelectedSale(s)}
                onExportReport={() => { /* Export logic */ }}
              />
            )}
            {activeTab === "settings" && (
              <SettingsTab 
                branding={branding}
                onBrandingChange={(field, value) => setBranding({ ...branding, [field]: value })}
                onSaveBranding={handleSaveBranding}
                onLogoUpload={(e) => handleFileUpload(e, 'logo')}
                onFaviconUpload={(e) => handleFileUpload(e, 'favicon')}
                onAddUser={() => setShowUserModal(true)}
                onDeleteUser={handleDeleteUser}
                users={users}
                currentUser={user}
                onUpgradePlan={handleUpgradePlan}
              />
            )}
          </div>
        </div>
      </main>

      {/* Sale Details Modal */}
      <AnimatePresence>
        {selectedSale && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 flex items-center">
                    <span className="text-indigo-600 mr-2">#</span>{selectedSale.id} {lang === 'tr' ? 'Satış Detayı' : 'Sale Details'}
                  </h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {new Date(selectedSale.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedSale(null)}
                  className="p-3 bg-white hover:bg-gray-100 rounded-2xl transition-all shadow-sm border border-gray-100"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Items */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center">
                    <Package className="h-4 w-4 mr-2" /> {lang === 'tr' ? 'Ürünler' : 'Products'}
                  </h4>
                  <div className="space-y-3">
                    {selectedSale.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-bold shadow-sm border border-gray-100">
                            {item.quantity}x
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{item.product_name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{item.barcode}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-gray-900">
                            {Number(item.total_price).toLocaleString('tr-TR')} {selectedSale.currency}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400">
                            Birim: {Number(item.unit_price).toLocaleString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{t.total}</p>
                    <p className="text-4xl font-black mt-1">
                      {Number(selectedSale.total_amount).toLocaleString('tr-TR')} <span className="text-xl opacity-80">{selectedSale.currency}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{t.status}</p>
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider mt-2 shadow-lg ${
                      selectedSale.status === 'completed' ? 'bg-green-400 text-white' : 
                      selectedSale.status === 'cancelled' ? 'bg-red-400 text-white' : 'bg-white text-indigo-600'
                    }`}>
                      {selectedSale.status === 'completed' ? t.completed : selectedSale.status === 'cancelled' ? t.cancelled : t.pending}
                    </span>
                  </div>
                </div>

                {/* Completion Actions (Only if pending) */}
                {selectedSale.status === 'pending' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" /> {lang === 'tr' ? 'Ödeme Yöntemi' : 'Payment Method'}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-900">
                      <button 
                        onClick={() => handleCompleteSale(selectedSale.id, 'cash')}
                        className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl hover:bg-emerald-100 hover:scale-[1.02] active:scale-95 transition-all text-center group"
                      >
                        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:shadow-md transition-all text-emerald-600">
                          <Smartphone className="h-6 w-6" />
                        </div>
                        <span className="font-black uppercase tracking-wider text-xs">{lang === 'tr' ? 'Nakit' : 'Cash'}</span>
                      </button>

                      <button 
                        onClick={() => handleCompleteSale(selectedSale.id, 'card')}
                        className="p-6 bg-blue-50 border border-blue-100 rounded-3xl hover:bg-blue-100 hover:scale-[1.02] active:scale-95 transition-all text-center group"
                      >
                        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:shadow-md transition-all text-blue-600">
                          <CreditCard className="h-6 w-6" />
                        </div>
                        <span className="font-black uppercase tracking-wider text-xs">{lang === 'tr' ? 'Kredi Kartı' : 'Credit Card'}</span>
                      </button>

                      <button 
                        onClick={() => {
                          const list = companies.map(c => `${c.id}: ${c.title}`).join('\n');
                          const companyId = prompt((lang === 'tr' ? 'Lütfen Cari Seçiniz:\n' : 'Please Select Company:\n') + list);
                          if (companyId) handleCompleteSale(selectedSale.id, 'cari', parseInt(companyId));
                        }}
                        className="p-6 bg-amber-50 border border-amber-100 rounded-3xl hover:bg-amber-100 hover:scale-[1.02] active:scale-95 transition-all text-center group"
                      >
                        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:shadow-md transition-all text-amber-600">
                          <UserIcon className="h-6 w-6" />
                        </div>
                        <span className="font-black uppercase tracking-wider text-xs">{lang === 'tr' ? 'Cari Hesap' : 'Current Account'}</span>
                      </button>
                    </div>

                    <button 
                      onClick={() => handleCancelSale(selectedSale.id)}
                      className="w-full py-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all flex items-center justify-center"
                    >
                      <XCircle className="h-5 w-5 mr-2" /> {lang === 'tr' ? 'Satışı İptal Et' : 'Cancel Sale'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Modal (Cari Hareket) */}
      <AnimatePresence>
        {showTransactionModal && selectedCompany && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-2xl font-black text-gray-900">{selectedCompany.title}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Cari Hareket Kaydı</p>
                </div>
                <button onClick={() => setShowTransactionModal(false)} className="p-3 bg-white hover:bg-gray-100 rounded-2xl transition-all shadow-sm border border-gray-100">
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const data = Object.fromEntries(formData.entries());
                try {
                  await api.post(`/api/store/companies/${selectedCompany.id}/transactions`, data);
                  setShowTransactionModal(false);
                  fetchData();
                  alert(lang === 'tr' ? "İşlem kaydedildi." : "Transaction saved.");
                } catch (error: any) {
                  alert(error.message);
                }
              }} className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{lang === 'tr' ? 'İşlem Tipi' : 'Transaction Type'}</label>
                  <select name="type" className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-bold" required>
                    <option value="debt">{lang === 'tr' ? 'Borçlandır (Mal Alımı / Satış)' : 'Debt (Charge)'}</option>
                    <option value="credit">{lang === 'tr' ? 'Alacaklandır (Tahsilat / Ödeme)' : 'Credit (Payment)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{lang === 'tr' ? 'Tutar' : 'Amount'}</label>
                  <div className="relative">
                    <input name="amount" type="number" step="0.01" className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-black text-xl" required />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">{selectedCompany.currency || 'TRY'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{lang === 'tr' ? 'Açıklama' : 'Description'}</label>
                  <textarea name="description" className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 font-medium h-24" placeholder="..." required />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center"
                >
                  <Save className="h-5 w-5 mr-2" /> {lang === 'tr' ? 'İşlemi Kaydet' : 'Save Transaction'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-2xl font-black text-gray-900">{editingProduct ? t.editProduct : t.addManual}</h3>
                <button onClick={() => setShowProductModal(false)} className="p-3 bg-white hover:bg-gray-100 rounded-2xl transition-all shadow-sm border border-gray-100"><X className="h-6 w-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleAddProduct} className="p-8 space-y-4">
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
                    <select name="currency" defaultValue={editingProduct?.currency || branding.default_currency} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium">
                      <option value="TRY">TRY (₺)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
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
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.description}</label>
                  <textarea name="description" defaultValue={editingProduct?.description} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium h-24" />
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center">
                  <Save className="h-5 w-5 mr-2" /> {editingProduct ? t.update : t.saveChanges}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900">{t.importExcel}</h3>
                <button onClick={() => setShowImportModal(false)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all"><X className="h-6 w-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleImport} className="space-y-6">
                <div className="border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center group hover:border-indigo-500 transition-colors relative">
                  <Upload className="h-12 w-12 text-gray-300 mx-auto mb-4 group-hover:text-indigo-500 transition-colors" />
                  <p className="text-sm font-bold text-gray-500">{lang === 'tr' ? 'Excel dosyasını buraya sürükleyin veya seçin' : 'Drag and drop Excel file here or browse'}</p>
                  <input type="file" name="file" accept=".xlsx, .xls" className="absolute inset-0 opacity-0 cursor-pointer" required />
                </div>
                <div className="bg-amber-50 rounded-2xl p-4 flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-amber-700 leading-relaxed">
                    {lang === 'tr' ? 'Dosyanızda şu sütunlar olmalıdır: Barkod, Ürün Adı, Fiyat, Stok Adedi, Açıklama' : 'Your file must have these columns: Barcode, Product Name, Price, Stock, Description'}
                  </p>
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all">
                  {t.importExcel}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Company Modal */}
      <AnimatePresence>
        {showCompanyModal && (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-2xl font-black text-gray-900">{editingCompany ? (lang === 'tr' ? 'Şirketi Düzenle' : 'Edit Company') : (lang === 'tr' ? 'Yeni Şirket Ekle' : 'Add New Company')}</h3>
                <button onClick={() => setShowCompanyModal(false)} className="p-3 bg-white hover:bg-gray-100 rounded-2xl transition-all shadow-sm border border-gray-100"><X className="h-6 w-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleAddCompany} className="p-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Şirket Ünvanı' : 'Company Title'}</label>
                  <input name="title" defaultValue={editingCompany?.title} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Vergi No' : 'Tax ID'}</label>
                    <input name="tax_id" defaultValue={editingCompany?.tax_id} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Telefon' : 'Phone'}</label>
                    <input name="phone" defaultValue={editingCompany?.phone} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
                  <input name="email" type="email" defaultValue={editingCompany?.email} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Adres' : 'Address'}</label>
                  <textarea name="address" defaultValue={editingCompany?.address} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium h-24" />
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center">
                  <Save className="h-5 w-5 mr-2" /> {editingCompany ? t.update : t.saveChanges}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Modal */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900">{t.addUser}</h3>
                <button onClick={() => setShowUserModal(false)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all"><X className="h-6 w-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Kullanıcı Adı' : 'Username'}</label>
                  <input name="username" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Şifre' : 'Password'}</label>
                  <input name="password" type="password" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Rol' : 'Role'}</label>
                  <select name="role" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium">
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all mt-4">
                  {lang === 'tr' ? 'Kullanıcıyı Kaydet' : 'Save User'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Quotation Modal */}
      <AnimatePresence>
        {showQuotationModal && (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900">{editingQuotation ? (lang === 'tr' ? 'Teklifi Düzenle' : 'Edit Quotation') : (lang === 'tr' ? 'Yeni Teklif' : 'New Quotation')}</h3>
                <button onClick={() => setShowQuotationModal(false)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all"><X className="h-6 w-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleAddQuotation} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Şirket Seçin' : 'Select Company'}</label>
                  <select name="company_id" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" required>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Notlar' : 'Notes'}</label>
                  <textarea name="notes" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium h-32" placeholder="..." />
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all mt-4">
                  {lang === 'tr' ? 'Teklifi Kaydet' : 'Save Quotation'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
