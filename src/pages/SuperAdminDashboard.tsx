import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Store, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  X,
  LogOut,
  TrendingUp,
  Package,
  Scan,
  Users,
  LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { translations } from "../translations";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";

interface SuperAdminDashboardProps {
  token: string;
}

export default function SuperAdminDashboard({ token }: SuperAdminDashboardProps) {
  const { lang } = useLanguage();
  const st = translations[lang].superAdmin;
  
  const [leads, setLeads] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [editingStore, setEditingStore] = useState<any>(null);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<any>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [newStore, setNewStore] = useState({
    name: "",
    slug: "",
    address: "",
    contact_person: "",
    phone: "",
    email: "",
    admin_email: "",
    admin_password: "",
    subscription_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    default_currency: "TRY",
    language: "tr",
    plan: "free"
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leadsRes, storesRes] = await Promise.all([
        api.getLeads(),
        api.getStores()
      ]);
      setLeads(leadsRes || []);
      setStores(storesRes || []);
      setErrorMsg(null);
    } catch (error: any) {
      console.error("Fetch error:", error);
      setErrorMsg(error.message || "Ağ hatası: Veriler alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateLead(selectedLead.id, selectedLead);
      setSelectedLead(null);
      fetchData();
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addStore(newStore);
      setShowAdd(false);
      setNewStore({
        name: "", slug: "", address: "", contact_person: "", phone: "", email: "", admin_email: "", admin_password: "",
        subscription_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        default_currency: "TRY", language: "tr", plan: "free"
      });
      fetchData();
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
       await api.updateStore(editingStore.id, editingStore);
       setEditingStore(null);
       fetchData();
    } catch (error) { alert("Hata"); }
  };

  const handleDeleteStore = async (id: number) => {
    if (deletePassword !== "reset123") {
      alert("Hatalı doğrulama şifresi.");
      return;
    }
    try {
      await api.delete(`/api/admin/stores/${id}`);
      setStoreToDelete(null);
      setDeletePassword("");
      fetchData();
    } catch (error) {
      alert("Mağaza silinemedi.");
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar - GitHub Style (Admin) */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 bg-indigo-500 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="text-white h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-lg font-bold tracking-tight text-white block truncate">SuperAdmin</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Control Center</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg bg-slate-800 text-white shadow-sm font-semibold text-sm">
            <Store className="h-4.5 w-4.5 text-indigo-400" />
            <span>Mağaza Yönetimi</span>
          </button>
        </nav>
        <div className="p-4 mt-auto">
          <button onClick={() => window.location.href='/login'} className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm">
            <LogOut className="h-4 w-4" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200/60 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-xl font-black text-slate-900">Sistem Yönetimi</h2>
          <button 
            onClick={() => setShowAdd(true)}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm flex items-center space-x-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Mağaza Ekle</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[#FBFCFE]">
          {errorMsg && <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-center font-bold text-sm"><AlertTriangle className="mr-3 h-5 w-5" />{errorMsg}</div>}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Aktif Mağazalar', value: stores.length, icon: Store, color: 'indigo' },
              { label: 'Gelen Talepler', value: leads.length, icon: TrendingUp, color: 'emerald' },
              { label: 'Toplam Tarama', value: '12.450', icon: Scan, color: 'orange' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                <div className={`h-10 w-10 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl flex items-center justify-center mb-4`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h3>
              </div>
            ))}
          </div>

          <div className="space-y-12">
            {/* Leads Table */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" /> Son Talepler
              </h2>
              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mağaza / Firma</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">İletişim</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {leads.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{l.store_name}</div>
                            <div className="text-xs text-slate-400">{l.company_title}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold text-slate-600">{l.email}</div>
                            <div className="text-xs text-slate-400">{l.phone}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => setSelectedLead(l)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><ChevronRight className="h-5 w-5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Stores Grid */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Store className="h-5 w-5 text-indigo-600" /> Mağaza Listesi
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((s) => (
                  <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:border-indigo-100 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                        <Package className="h-6 w-6" />
                      </div>
                      <div className="flex space-x-1">
                        <button onClick={() => setEditingStore(s)} className="p-2 text-slate-300 hover:text-indigo-600 rounded-lg transition-all"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => setStoreToDelete(s)} className="p-2 text-slate-300 hover:text-rose-600 rounded-lg transition-all"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-0.5">{s.name}</h3>
                    <p className="text-xs text-slate-400 font-bold mb-6">/{s.slug}</p>
                    <button className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all uppercase tracking-widest">Ayarları Yönet</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Add/Edit Modals would go here, styled similarly to the StoreDashboard ones */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 bg-slate-900/60 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto p-8">
               <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900">Mağaza Kaydı</h2>
                  <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X /></button>
               </div>
               <form onSubmit={handleAddStore} className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mağaza Adı</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">URL Slug</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newStore.slug} onChange={e => setNewStore({...newStore, slug: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin E-posta</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newStore.admin_email} onChange={e => setNewStore({...newStore, admin_email: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Şifre</label>
                    <input type="password" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newStore.admin_password} onChange={e => setNewStore({...newStore, admin_password: e.target.value})} required />
                  </div>
                  <button type="submit" className="col-span-2 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all mt-4">Mağazayı Oluştur</button>
               </form>
            </motion.div>
          </div>
        )}

        {storeToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 z-[120] flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 border border-rose-100">
               <div className="flex items-center space-x-3 mb-6">
                 <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                   <AlertTriangle className="h-6 w-6" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900">Mağazayı Sil?</h3>
               </div>
               <p className="text-slate-500 font-medium mb-6">
                 <strong className="text-slate-900">{storeToDelete.name}</strong> mağazasını ve tüm verilerini silmek üzeresiniz. Bu işlem geri alınamaz. Devam etmek için <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600">reset123</code> yazın.
               </p>
               <div className="space-y-4">
                 <input 
                   type="text" 
                   value={deletePassword}
                   onChange={e => setDeletePassword(e.target.value)}
                   placeholder="Onay kodu"
                   className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-rose-500 transition-all"
                 />
                 <div className="flex gap-3 pt-2">
                   <button onClick={() => setStoreToDelete(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Vazgeç</button>
                   <button onClick={() => handleDeleteStore(storeToDelete.id)} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100">Sil</button>
                 </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
