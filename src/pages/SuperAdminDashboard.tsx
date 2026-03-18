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
  Scan
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
  const t = translations[lang].dashboard;
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
      setLeads(leadsRes);
      setStores(storesRes);
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
      await api.updateLead(selectedLead.id, {
        status: selectedLead.status,
        probability: selectedLead.probability,
        notes: selectedLead.notes
      });
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
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleDeleteStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.deleteStore(storeToDelete.id, deletePassword);
      setStoreToDelete(null);
      setDeletePassword("");
      fetchData();
    } catch (error) {
      alert(lang === 'tr' ? "Şifre hatalı veya mağaza silinemedi" : "Incorrect password or store could not be deleted");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Süper Admin Paneli</h1>
          <p className="text-gray-500 font-medium mt-1">Sistemdeki tüm mağazaları ve talepleri yönetin</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center"
        >
          <Plus className="mr-2 h-5 w-5" /> {st.registerNewStore}
        </button>
      </div>

      {errorMsg && (
        <div className="mb-8 p-6 bg-red-50 text-red-600 rounded-3xl border border-red-100 flex items-center font-bold text-lg">
          <AlertTriangle className="mr-3 h-6 w-6" />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
              <Store className="h-6 w-6" />
            </div>
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Aktif Mağazalar</p>
          <h3 className="text-3xl font-black text-gray-900 mt-1">{stores.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Yeni Talepler</p>
          <h3 className="text-3xl font-black text-gray-900 mt-1">{leads.filter(l => l.status === 'new').length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
              <Scan className="h-6 w-6" />
            </div>
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Toplam Tarama</p>
          <h3 className="text-3xl font-black text-gray-900 mt-1">12.450</h3>
        </div>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="mr-3 text-indigo-600" /> Gelen Talepler
          </h2>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{st.customerStore}</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{st.contact}</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{st.status}</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{st.probability}</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{st.date}</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">{st.action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">{st.noLeads}</td>
                    </tr>
                  ) : (
                    leads.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{l.store_name}</div>
                          <div className="text-xs text-gray-400">{l.company_title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{l.email}</div>
                          <div className="text-xs text-gray-400">{l.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            l.status === 'new' ? 'bg-indigo-100 text-indigo-700' :
                            l.status === 'contacted' ? 'bg-orange-100 text-orange-700' :
                            l.status === 'demo' ? 'bg-blue-100 text-blue-700' :
                            l.status === 'sold' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                l.probability > 70 ? 'bg-green-500' :
                                l.probability > 30 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${l.probability}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 mt-1 block">%{l.probability}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(l.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setSelectedLead(l)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Store className="mr-3 text-indigo-600" /> Mağazalar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((s) => (
              <motion.div 
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Store className="h-6 w-6" />
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingStore(s)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setStoreToDelete(s)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-1">{s.name}</h3>
                <p className="text-sm text-gray-400 font-medium mb-6">/{s.slug}</p>
                
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Ürün Sayısı</span>
                    <span className="font-bold text-gray-900">{s.product_count || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Bitiş Tarihi</span>
                    <span className="font-bold text-gray-900">{new Date(s.subscription_end).toLocaleDateString()}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedStore(s)}
                  className="w-full bg-gray-50 text-gray-600 py-3 rounded-xl font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all text-sm"
                >
                  Detayları Gör
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-3xl max-w-lg w-full relative"
            >
              <button onClick={() => setSelectedLead(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
              <h2 className="text-2xl font-bold mb-6">{st.manageLead}</h2>
              <form onSubmit={handleUpdateLead} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{st.processStatus}</label>
                  <select 
                    className="w-full p-3 bg-gray-50 border rounded-xl" 
                    value={selectedLead.status} 
                    onChange={e => setSelectedLead({...selectedLead, status: e.target.value})}
                  >
                    <option value="new">Yeni</option>
                    <option value="contacted">İletişime Geçildi</option>
                    <option value="demo">Demo Yapıldı</option>
                    <option value="sold">Satış Tamamlandı</option>
                    <option value="lost">Kaybedildi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{st.salesProbability} (%{selectedLead.probability})</label>
                  <input 
                    type="range" 
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                    min="0" max="100" 
                    value={selectedLead.probability} 
                    onChange={e => setSelectedLead({...selectedLead, probability: parseInt(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{st.meetingNotes}</label>
                  <textarea 
                    className="w-full p-3 bg-gray-50 border rounded-xl" 
                    rows={4} 
                    value={selectedLead.notes || ""} 
                    onChange={e => setSelectedLead({...selectedLead, notes: e.target.value})}
                    placeholder={st.notesPlaceholder}
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">{st.update}</button>
                  <button type="button" onClick={() => setSelectedLead(null)} className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-xl font-bold">{st.close}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingStore && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-3xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setEditingStore(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
              <h2 className="text-2xl font-bold mb-6">{st.editStore}</h2>
              <form onSubmit={handleUpdateStore} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{st.storeName}</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-gray-50 border rounded-xl" 
                      value={editingStore.name} 
                      onChange={e => setEditingStore({...editingStore, name: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{st.slug}</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-gray-50 border rounded-xl" 
                      value={editingStore.slug} 
                      onChange={e => setEditingStore({...editingStore, slug: e.target.value})} 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{st.address}</label>
                    <textarea 
                      className="w-full p-3 bg-gray-50 border rounded-xl" 
                      rows={2} 
                      value={editingStore.address || ""} 
                      onChange={e => setEditingStore({...editingStore, address: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{st.authorizedPerson}</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-gray-50 border rounded-xl" 
                      value={editingStore.contact_person} 
                      onChange={e => setEditingStore({...editingStore, contact_person: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{st.phone}</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-gray-50 border rounded-xl" 
                      value={editingStore.phone} 
                      onChange={e => setEditingStore({...editingStore, phone: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{st.email}</label>
                    <input 
                      type="email" 
                      className="w-full p-3 bg-gray-50 border rounded-xl" 
                      value={editingStore.email} 
                      onChange={e => setEditingStore({...editingStore, email: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{st.currency}</label>
                    <select 
                      className="w-full p-3 bg-gray-50 border rounded-xl" 
                      value={editingStore.default_currency || "TRY"} 
                      onChange={e => setEditingStore({...editingStore, default_currency: e.target.value})}
                    >
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{st.language}</label>
                    <select 
                      className="w-full p-3 bg-gray-50 border rounded-xl" 
                      value={editingStore.language || "tr"} 
                      onChange={e => setEditingStore({...editingStore, language: e.target.value})}
                    >
                      <option value="tr">Turkish</option>
                      <option value="en">English</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Plan</label>
                    <select 
                      className="w-full p-3 bg-gray-50 border rounded-xl" 
                      value={editingStore.plan || "free"} 
                      onChange={e => setEditingStore({...editingStore, plan: e.target.value})}
                    >
                      <option value="free">Free</option>
                      <option value="basic">Basic</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{st.newAdminPassword}</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-gray-50 border rounded-xl" 
                      value={editingStore.admin_password || ""} 
                      onChange={e => setEditingStore({...editingStore, admin_password: e.target.value})} 
                      placeholder={st.passwordNote}
                    />
                  </div>
                </div>
                <div className="md:col-span-2 flex space-x-3 mt-4">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">{st.update}</button>
                  <button type="button" onClick={() => setEditingStore(null)} className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-xl font-bold">{st.close}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {selectedStore && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-3xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setSelectedStore(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
              <h2 className="text-2xl font-bold mb-6">{selectedStore.name} {st.storeDetails}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">{st.companyInformation}</h3>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase font-bold">{st.address}</p>
                    <p className="text-gray-900">{selectedStore.address || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase font-bold">{st.authorizedPerson}</p>
                    <p className="text-gray-900">{selectedStore.contact_person || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase font-bold">{st.phone}</p>
                    <p className="text-gray-900">{selectedStore.phone || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase font-bold">{st.email}</p>
                    <p className="text-gray-900">{selectedStore.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">{st.systemAccess}</h3>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase font-bold">{st.adminLoginEmail}</p>
                    <p className="text-gray-900 font-mono">{selectedStore.admin_email || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase font-bold">{st.subscriptionEndDate}</p>
                    <p className="text-gray-900">{new Date(selectedStore.subscription_end).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="pt-4 flex flex-col space-y-2">
                    <button 
                      onClick={() => {
                        window.open(`${window.location.origin}/dashboard/${selectedStore.slug}`, '_blank');
                      }}
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center"
                    >
                      <LogOut className="h-4 w-4 mr-2 rotate-180" /> {st.goToStorePanel}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedStore(null)}
                className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-bold mt-8"
              >
                {st.close}
              </button>
            </motion.div>
          </div>
        )}

        {storeToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-3xl max-w-md w-full relative shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-4 text-red-600 flex items-center">
                <AlertTriangle className="mr-2 h-6 w-6" /> Mağazayı Sil
              </h2>
              <p className="text-gray-600 mb-6 font-medium">
                <span className="font-bold text-gray-900">{storeToDelete.name}</span> mağazasını ve tüm verilerini (ürünler, kullanıcılar, loglar) kalıcı olarak silmek istediğinize emin misiniz?
              </p>
              
              <form onSubmit={handleDeleteStore} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Admin Şifrenizi Girin</label>
                  <input 
                    type="password" 
                    required
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:ring-0 transition-all"
                    placeholder="Onaylamak için şifreniz"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    autoFocus
                  />
                </div>
                
                <div className="flex space-x-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setStoreToDelete(null);
                      setDeletePassword("");
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Vazgeç
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                  >
                    Kalıcı Olarak Sil
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-3xl max-w-4xl w-full relative my-8"
          >
            <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
            <h2 className="text-2xl font-bold mb-6">{st.registerNewStore}</h2>
            <form onSubmit={handleAddStore} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase">{st.storeInformation}</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{st.storeName}</label>
                  <input required className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} placeholder="e.g. Migros" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{st.slugIdentifier}</label>
                  <input required className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newStore.slug} onChange={e => setNewStore({...newStore, slug: e.target.value})} placeholder="e.g. migros" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{st.address}</label>
                  <textarea className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" rows={2} value={newStore.address} onChange={e => setNewStore({...newStore, address: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{st.authorizedPerson}</label>
                    <input className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newStore.contact_person} onChange={e => setNewStore({...newStore, contact_person: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{st.phone}</label>
                    <input className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newStore.phone} onChange={e => setNewStore({...newStore, phone: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{st.email}</label>
                  <input type="email" className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newStore.email} onChange={e => setNewStore({...newStore, email: e.target.value})} />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase">{st.adminAccount}</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{st.adminLoginEmail}</label>
                  <input type="email" required className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newStore.admin_email} onChange={e => setNewStore({...newStore, admin_email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{st.adminPassword}</label>
                  <input type="password" required className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newStore.admin_password} onChange={e => setNewStore({...newStore, admin_password: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{st.subscriptionEndDate}</label>
                  <input type="date" required className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" value={newStore.subscription_end} onChange={e => setNewStore({...newStore, subscription_end: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{st.currency}</label>
                  <select 
                    className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" 
                    value={newStore.default_currency} 
                    onChange={e => setNewStore({...newStore, default_currency: e.target.value})}
                  >
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{st.language}</label>
                  <select 
                    className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" 
                    value={newStore.language} 
                    onChange={e => setNewStore({...newStore, language: e.target.value})}
                  >
                    <option value="tr">Turkish</option>
                    <option value="en">English</option>
                    <option value="de">German</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan</label>
                  <select 
                    className="mt-1 block w-full p-3 bg-gray-50 border rounded-xl" 
                    value={newStore.plan} 
                    onChange={e => setNewStore({...newStore, plan: e.target.value})}
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-10">
                  <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 text-gray-500 font-medium">{st.cancel}</button>
                  <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200">{st.register}</button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
