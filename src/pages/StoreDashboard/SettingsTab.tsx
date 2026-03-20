import React from "react";
import { 
  Save, 
  Upload, 
  Globe, 
  Palette, 
  User as UserIcon, 
  Lock,
  Image as ImageIcon,
  Smartphone,
  CheckCircle2,
  Trash2,
  Plus
} from "lucide-react";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";

interface SettingsTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  onSaveBranding: () => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFaviconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddUser: () => void;
  onDeleteUser: (id: number) => void;
  users: any[];
  currentUser: any;
  onUpgradePlan: () => void;
}

const SettingsTab = ({ 
  branding, 
  onBrandingChange, 
  onSaveBranding, 
  onLogoUpload, 
  onFaviconUpload,
  onAddUser,
  onDeleteUser,
  users,
  currentUser,
  onUpgradePlan
}: SettingsTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header Info */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
           <div className="h-20 w-20 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-center p-4">
              {branding.logo_url ? <img src={branding.logo_url} className="max-h-full max-w-full object-contain" alt="Store Logo" /> : <ImageIcon className="h-8 w-8 text-slate-300" />}
           </div>
           <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">{branding.name || 'LookPrice Store'}</h2>
              <p className="text-slate-500 font-medium">Mağaza ayarlarınızı ve marka kimliğinizi buradan yönetin.</p>
           </div>
        </div>
        <button 
          onClick={onSaveBranding}
          className="relative z-10 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>{t.saveChanges}</span>
        </button>
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Settings */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                <Palette className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{t.branding}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t.storeName}</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold outline-none"
                  value={branding.name}
                  onChange={(e) => onBrandingChange('name', e.target.value)}
                  placeholder="Mağaza Adı"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t.primaryColor}</label>
                <div className="flex gap-3">
                  <div className="relative h-12 w-16 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                    <input 
                      type="color" 
                      className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer border-none"
                      value={branding.primary_color}
                      onChange={(e) => onBrandingChange('primary_color', e.target.value)}
                    />
                  </div>
                  <input 
                    type="text" 
                    className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono text-sm font-bold uppercase outline-none"
                    value={branding.primary_color}
                    onChange={(e) => onBrandingChange('primary_color', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                  <UserIcon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{t.users}</h3>
              </div>
              {currentUser.role === 'admin' && (
                <button 
                  onClick={onAddUser}
                  className="h-9 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t.addUser}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {users.length === 0 ? (
                <div className="col-span-2 py-10 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-400">
                   <UserIcon className="h-8 w-8 mb-2 opacity-20" />
                   <p className="text-xs font-bold uppercase tracking-widest italic text-slate-300">Ek kullanıcı bulunamadı</p>
                </div>
              ) : users.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all group">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-black border border-slate-200 shadow-sm shrink-0">
                      {u.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">{u.email}</div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{u.role}</div>
                    </div>
                  </div>
                  {currentUser.role === 'admin' && u.id !== currentUser.id && (
                    <button 
                      onClick={() => onDeleteUser(u.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column - Media & Plan */}
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm relative overflow-hidden group">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-slate-400" />
              {t.logo}
            </h3>
            <div className="aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center group-hover:border-indigo-500/50 transition-all relative overflow-hidden">
              {branding.logo_url ? (
                <img src={branding.logo_url} alt="Logo" className="max-h-full max-w-full object-contain relative z-10" />
              ) : (
                <div className="relative z-10">
                  <Upload className="h-10 w-10 text-slate-300 mx-auto mb-3 transition-colors group-hover:text-indigo-500" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">{t.uploadLogo}</p>
                </div>
              )}
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                accept="image/*"
                onChange={onLogoUpload}
              />
              <div className="absolute inset-0 bg-indigo-50/0 group-hover:bg-indigo-50/50 transition-all" />
            </div>
          </section>

          <section className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-slate-400" />
                  Görünüm
                </h3>
                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/20" />
             </div>
             
             <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Dil Seçimi</label>
                    <div className="flex gap-2">
                        {['tr', 'en'].map(l => (
                          <button 
                            key={l}
                            onClick={() => onBrandingChange('language', l)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                              branding.language === l ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            {l.toUpperCase()}
                          </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Para Birimi</label>
                    <select 
                      className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
                      value={branding.default_currency || 'TRY'}
                      onChange={(e) => onBrandingChange('default_currency', e.target.value)}
                    >
                      <option value="TRY">TRY (₺)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                </div>
             </div>
          </section>

          <section className="bg-slate-900 p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="bg-indigo-500/20 w-fit p-3 rounded-2xl mb-4">
                <CheckCircle2 className="h-6 w-6 text-indigo-400" />
              </div>
              <h4 className="text-white font-black text-xl mb-2">Pro Plan</h4>
              <p className="text-slate-400 text-sm font-medium mb-8">Mağazanız için tüm premium özellikler sınırsız açık.</p>
              <button 
                onClick={onUpgradePlan}
                className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Destek Al
              </button>
            </div>
            {/* Design Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
