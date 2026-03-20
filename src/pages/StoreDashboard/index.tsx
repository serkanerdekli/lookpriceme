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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  const [quotationItems, setQuotationItems] = useState<any[]>([]);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [conversionQuotation, setConversionQuotation] = useState<any>(null);
  const [isNewCompany, setIsNewCompany] = useState(false);

  const isViewer = user.role === 'viewer';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsRes, analyticsRes, brandingRes, quotationsRes, companiesRes, usersRes] = await Promise.all([
        api.getProducts(user.store_id),
        api.getAnalytics(user.store_id),
        api.getBranding(user.store_slug),
        api.getQuotations(quotationSearch, quotationStatusFilter, user.store_id),
        api.getCompanies(includeZeroBalance, user.store_id),
        api.getUsers(user.store_id)
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
      const res = await api.getSales(salesStatusFilter, salesStartDate, salesEndDate, user.store_id);
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
  const handleQuotationItemChange = (index: number, field: string, value: any) => {
    const newItems = [...quotationItems];
    newItems[index][field] = value;
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = (Number(newItems[index].quantity) || 0) * (Number(newItems[index].unit_price) || 0);
    }
    setQuotationItems(newItems);
  };

  const addQuotationItem = () => {
    setQuotationItems([...quotationItems, { product_name: '', barcode: '', quantity: 1, unit: 'Adet', unit_price: 0, total_price: 0 }]);
  };

  const removeQuotationItem = (index: number) => {
    setQuotationItems(quotationItems.filter((_, i) => i !== index));
  };

  const generateQuotationBarcode = (index: number) => {
    const barcode = "LP" + Math.random().toString().substring(2, 10);
    handleQuotationItemChange(index, 'barcode', barcode);
  };

  const handleAddQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    const quotationData = {
      ...data,
      total_amount: quotationItems.reduce((sum, item) => sum + item.total_price, 0),
      items: quotationItems,
      company_id: isNewCompany ? null : data.company_id
    };

    try {
      if (editingQuotation) {
        await api.updateQuotation(editingQuotation.id, quotationData);
      } else {
        await api.addQuotation(quotationData);
      }
      setShowQuotationModal(false);
      setEditingQuotation(null);
      setQuotationItems([]);
      fetchData();
    } catch (error: any) {
      alert(error.message || "Hata oluştu");
    }
  };

  const handleConvertToSale = async (quotationId: number, paymentMethod: string, dueDate?: string) => {
    try {
      setLoading(true);
      await api.convertToSale(quotationId, { paymentMethod, dueDate });
      setShowConvertModal(false);
      setConversionQuotation(null);
      fetchSales();
      fetchData();
      alert(lang === 'tr' ? "Teklif başarıyla satışa dönüştürüldü." : "Quotation successfully converted to sale.");
    } catch (error: any) {
      alert(error.message || "Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = (q: any) => {
    const doc = new jsPDF();
    const isTr = lang === 'tr';
    
    // Header
    doc.setFontSize(20);
    doc.text(branding.store_name, 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(branding.address || '', 105, 22, { align: 'center' });
    
    doc.setDrawColor(200, 200, 200);
    doc.line(10, 28, 200, 28);
    
    // Quotation Info
    doc.setFontSize(14);
    doc.text(isTr ? "TEKLİF FORMU" : "QUOTATION FORM", 10, 40);
    
    doc.setFontSize(10);
    doc.text(`${isTr ? "Teklif #" : "Quotation #"}: ${q.id}`, 10, 48);
    doc.text(`${isTr ? "Tarih" : "Date"}: ${new Date(q.created_at).toLocaleDateString(isTr ? 'tr-TR' : 'en-GB')}`, 10, 54);
    
    // Client Info
    doc.text(`${isTr ? "Müşteri" : "Client"}:`, 130, 40);
    doc.setFontSize(11);
    doc.text(q.customer_name || '', 130, 48);
    doc.setFontSize(10);
    doc.text(q.customer_title || '', 130, 54);
    
    // Items Table
    const tableData = (q.items || []).map((item: any) => [
      item.product_name,
      item.barcode || '-',
      `${item.quantity} ${item.unit || (isTr ? 'Adet' : 'Qty')}`,
      `${Number(item.unit_price).toLocaleString(isTr ? 'tr-TR' : 'en-GB')} ${q.currency}`,
      `${Number(item.total_price).toLocaleString(isTr ? 'tr-TR' : 'en-GB')} ${q.currency}`
    ]);
    
    autoTable(doc, {
      startY: 65,
      head: [[
        isTr ? 'Ürün' : 'Product', 
        isTr ? 'Barkod' : 'Barcode', 
        isTr ? 'Miktar' : 'Qty', 
        isTr ? 'B. Fiyat' : 'U. Price', 
        isTr ? 'Toplam' : 'Total'
      ]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Grand Total
    doc.setFontSize(12);
    doc.text(`${isTr ? "GENEL TOPLAM" : "GRAND TOTAL"}: ${Number(q.total_amount).toLocaleString(isTr ? 'tr-TR' : 'en-GB')} ${q.currency}`, 190, finalY, { align: 'right' });
    
    if (q.notes) {
      doc.setFontSize(9);
      doc.text(`${isTr ? "Notlar" : "Notes"}:`, 10, finalY + 10);
      doc.text(q.notes, 10, finalY + 16, { maxWidth: 180 });
    }
    
    doc.save(`Quotation_${q.id}.pdf`);
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
                onAddQuotation={() => { 
                  setEditingQuotation(null); 
                  setQuotationItems([{ product_name: '', barcode: '', quantity: 1, unit: 'Adet', unit_price: 0, total_price: 0 }]);
                  setIsNewCompany(false);
                  setShowQuotationModal(true); 
                }}
                onViewDetails={(id) => { setSelectedQuotation(quotations.find(q => q.id === id)); }}
                onGeneratePDF={handleGeneratePDF}
                onApprove={(id) => {
                  const q = quotations.find(qt => qt.id === id);
                  if (q) {
                    setConversionQuotation(q);
                    setShowConvertModal(true);
                  }
                }}
                onEdit={(q) => { 
                  setEditingQuotation(q); 
                  setQuotationItems(q.items || []);
                  setIsNewCompany(false);
                  setShowQuotationModal(true); 
                }}
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
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
                <h3 className="text-2xl font-black text-gray-900">{editingQuotation ? (lang === 'tr' ? 'Teklifi Düzenle' : 'Edit Quotation') : (lang === 'tr' ? 'Yeni Teklif' : 'New Quotation')}</h3>
                <button onClick={() => setShowQuotationModal(false)} className="p-3 bg-white hover:bg-gray-100 rounded-2xl transition-all shadow-sm border border-gray-100"><X className="h-6 w-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleAddQuotation} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Müşteri Tipi' : 'Customer Type'}</label>
                      <button type="button" onClick={() => setIsNewCompany(!isNewCompany)} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700">
                        {isNewCompany ? (lang === 'tr' ? 'Kayıtlı Cari Seç' : 'Select Existing') : (lang === 'tr' ? 'Yeni Cari Ekle' : 'Add New')}
                      </button>
                    </div>
                    {isNewCompany ? (
                      <div className="space-y-4">
                        <input name="customer_name" placeholder={lang === 'tr' ? 'Firma Ünvanı' : 'Company Name'} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" required />
                        <input name="customer_title" placeholder={lang === 'tr' ? 'Yetkili Kişi' : 'Contact Person'} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" />
                      </div>
                    ) : (
                      <select name="company_id" defaultValue={editingQuotation?.company_id} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" required>
                        <option value="">{lang === 'tr' ? 'Şirket Seçin...' : 'Select Company...'}</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Para Birimi' : 'Currency'}</label>
                    <select name="currency" defaultValue={editingQuotation?.currency || branding.default_currency} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium">
                      <option value="TRY">TRY (₺)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                    <textarea name="notes" defaultValue={editingQuotation?.notes} placeholder={lang === 'tr' ? 'Teklif Notları...' : 'Quotation Notes...'} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium h-24 mt-2" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">{lang === 'tr' ? 'Teklif Kalemleri' : 'Quotation Items'}</h4>
                    <button type="button" onClick={addQuotationItem} className="flex items-center text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all">
                      <Plus className="h-4 w-4 mr-2" /> {lang === 'tr' ? 'Satır Ekle' : 'Add Row'}
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {quotationItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                        <div className="col-span-4 md:col-span-3 space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase">{lang === 'tr' ? 'Ürün Adı' : 'Product Name'}</label>
                          <input value={item.product_name} onChange={e => handleQuotationItemChange(idx, 'product_name', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm font-medium" required />
                        </div>
                        <div className="col-span-4 md:col-span-3 space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase flex justify-between">
                            {lang === 'tr' ? 'Barkod' : 'Barcode'}
                            <button type="button" onClick={() => generateQuotationBarcode(idx)} className="text-indigo-600 hover:text-indigo-800">Gen</button>
                          </label>
                          <input value={item.barcode} onChange={e => handleQuotationItemChange(idx, 'barcode', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm font-medium font-mono" />
                        </div>
                        <div className="col-span-2 md:col-span-1 space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase">{lang === 'tr' ? 'Adet' : 'Qty'}</label>
                          <input type="number" step="any" value={item.quantity} onChange={e => handleQuotationItemChange(idx, 'quantity', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm font-medium" required />
                        </div>
                        <div className="col-span-2 md:col-span-1 space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase">{lang === 'tr' ? 'Birim' : 'Unit'}</label>
                          <input value={item.unit} onChange={e => handleQuotationItemChange(idx, 'unit', e.target.value)} list="units" className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm font-medium" />
                        </div>
                        <div className="col-span-5 md:col-span-2 space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase">{lang === 'tr' ? 'B. Fiyat' : 'U. Price'}</label>
                          <input type="number" step="0.01" value={item.unit_price} onChange={e => handleQuotationItemChange(idx, 'unit_price', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm font-medium" required />
                        </div>
                        <div className="col-span-5 md:col-span-2 space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase">{lang === 'tr' ? 'Toplam' : 'Total'}</label>
                          <div className="w-full px-3 py-2 bg-gray-100 border border-gray-100 rounded-lg text-sm font-black text-gray-600">
                            {Number(item.total_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <button type="button" onClick={() => removeQuotationItem(idx)} className="absolute -right-2 -top-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {quotationItems.length === 0 && (
                      <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-[2rem] text-gray-400 font-bold">
                        {lang === 'tr' ? 'Henüz kalem eklenmedi' : 'No items added yet'}
                      </div>
                    )}
                  </div>
                </div>
                
                <datalist id="units">
                  <option value="Adet" /><option value="Kg" /><option value="Metre" /><option value="Litre" /><option value="Paket" />
                </datalist>

                <div className="pt-6 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'GENEL TOPLAM' : 'GRAND TOTAL'}</p>
                    <p className="text-3xl font-black text-gray-900">
                      {quotationItems.reduce((sum, i) => sum + i.total_price, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <button type="submit" className="w-full md:w-auto px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center">
                    <Save className="h-5 w-5 mr-3" /> {editingQuotation ? t.update : t.saveQuotation}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Convert to Sale Modal */}
      <AnimatePresence>
        {showConvertModal && conversionQuotation && (
          <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900">{lang === 'tr' ? 'Satışa Dönüştür' : 'Convert to Sale'}</h3>
                <button onClick={() => setShowConvertModal(false)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all"><X className="h-6 w-6 text-gray-400" /></button>
              </div>
              
              <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 mb-8">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{lang === 'tr' ? 'TEKLİF TUTARI' : 'QUOTATION TOTAL'}</p>
                <p className="text-3xl font-black text-indigo-700">{Number(conversionQuotation.total_amount).toLocaleString('tr-TR')} {conversionQuotation.currency}</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                handleConvertToSale(conversionQuotation.id, String(formData.get('payment_method')), String(formData.get('due_date')));
              }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Ödeme Yöntemi' : 'Payment Method'}</label>
                  <select name="payment_method" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" defaultValue="cash">
                    <option value="cash">{lang === 'tr' ? 'Nakit Kasa' : 'Cash'}</option>
                    <option value="card">{lang === 'tr' ? 'Kredi Kartı' : 'Credit Card'}</option>
                    <option value="bank">{lang === 'tr' ? 'Banka/EFT' : 'Bank/EFT'}</option>
                    <option value="cari">{lang === 'tr' ? 'Vadeli (Cari Borç)' : 'Deferred (Cari Debt)'}</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Vade Tarihi (Opsiyonel)' : 'Due Date (Optional)'}</label>
                  <input type="date" name="due_date" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" />
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowConvertModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all">İptal</button>
                  <button type="submit" className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">{lang === 'tr' ? 'Satışı Onayla' : 'Confirm Sale'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
