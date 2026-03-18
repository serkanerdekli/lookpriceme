import React from "react";
import { 
  Save, 
  Upload, 
  Globe, 
  Palette, 
  Settings, 
  User, 
  Lock,
  Mail,
  Smartphone,
  MapPin,
  CreditCard,
  Languages
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
  currentUser
}: SettingsTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <Palette className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t.branding}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.storeName}</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  value={branding.store_name}
                  onChange={(e) => onBrandingChange('store_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.primaryColor}</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    className="h-12 w-12 p-1 bg-gray-50 border-none rounded-xl cursor-pointer"
                    value={branding.primary_color}
                    onChange={(e) => onBrandingChange('primary_color', e.target.value)}
                  />
                  <input 
                    type="text" 
                    className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"
                    value={branding.primary_color}
                    onChange={(e) => onBrandingChange('primary_color', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Varsayılan Para Birimi' : 'Default Currency'}</label>
                <select 
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none"
                  value={branding.default_currency}
                  onChange={(e) => onBrandingChange('default_currency', e.target.value)}
                >
                  <option value="TRY">TRY (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Varsayılan Dil' : 'Default Language'}</label>
                <select 
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none"
                  value={branding.default_language}
                  onChange={(e) => onBrandingChange('default_language', e.target.value)}
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-50 flex justify-end">
              <button 
                onClick={onSaveBranding}
                className="flex items-center bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <Save className="h-5 w-5 mr-2" /> {t.saveChanges}
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <User className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{t.users}</h3>
              </div>
              {currentUser.role === 'admin' && (
                <button 
                  onClick={onAddUser}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                >
                  + {t.addUser}
                </button>
              )}
            </div>

            <div className="space-y-4">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-indigo-600 font-bold border border-gray-100">
                      {u.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{u.username}</div>
                      <div className="text-xs text-gray-400 uppercase font-black tracking-widest">{u.role}</div>
                    </div>
                  </div>
                  {currentUser.role === 'admin' && u.id !== currentUser.id && (
                    <button 
                      onClick={() => onDeleteUser(u.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Lock className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">{t.logo}</h3>
            <div className="aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-center group relative overflow-hidden">
              {branding.logo_url ? (
                <img src={branding.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-300 mb-2 group-hover:text-indigo-500 transition-colors" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.uploadLogo}</p>
                </>
              )}
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                accept="image/*"
                onChange={onLogoUpload}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-4 text-center leading-relaxed">
              {lang === 'tr' ? 'Önerilen boyut: 512x512px. PNG veya SVG formatı tercih edilir.' : 'Recommended size: 512x512px. PNG or SVG format preferred.'}
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Favicon</h3>
            <div className="aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-center group relative overflow-hidden">
              {branding.favicon_url ? (
                <img src={branding.favicon_url} alt="Favicon" className="h-12 w-12 object-contain" />
              ) : (
                <>
                  <Globe className="h-8 w-8 text-gray-300 mb-2 group-hover:text-indigo-500 transition-colors" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.uploadFavicon}</p>
                </>
              )}
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                accept="image/*"
                onChange={onFaviconUpload}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
