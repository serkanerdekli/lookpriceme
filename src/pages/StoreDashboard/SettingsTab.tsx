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
  Languages,
  AlertTriangle
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
  onUpgradePlan: (plan: string) => void;
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
}: SettingsTabProps & { onUpgradePlan: (plan: string) => void }) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;

  const plans = [
    { 
      id: 'basic', 
      name: lang === 'tr' ? 'Temel Paket' : 'Basic Plan', 
      price: '0', 
      features: lang === 'tr' ? ['50 Ürün Limiti', 'Temel Analizler'] : ['50 Product Limit', 'Basic Analytics'],
      color: 'bg-gray-50 text-gray-600'
    },
    { 
      id: 'pro', 
      name: lang === 'tr' ? 'Pro Paket' : 'Pro Plan', 
      price: '199', 
      features: lang === 'tr' ? ['500 Ürün Limiti', 'Gelişmiş Analizler', 'Öncelikli Destek'] : ['500 Product Limit', 'Advanced Analytics', 'Priority Support'],
      color: 'bg-indigo-50 text-indigo-600'
    },
    { 
      id: 'enterprise', 
      name: lang === 'tr' ? 'Kurumsal' : 'Enterprise', 
      price: '499', 
      features: lang === 'tr' ? ['Sınırsız Ürün', 'Tüm Özellikler', '7/24 Destek'] : ['Unlimited Products', 'All Features', '24/7 Support'],
      color: 'bg-purple-50 text-purple-600'
    }
  ];

  const isExpired = branding.plan !== 'free' && branding.plan !== 'basic' && branding.subscription_end && new Date(branding.subscription_end) < new Date();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Subscription Section */}
      <div className={`bg-white p-8 rounded-3xl border shadow-sm overflow-hidden relative ${isExpired ? 'border-red-200 bg-red-50/10' : 'border-gray-100'}`}>
        <div className="absolute top-0 right-0 p-6">
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
            isExpired ? 'bg-red-100 text-red-600' :
            branding.plan === 'pro' ? 'bg-indigo-100 text-indigo-600' : 
            branding.plan === 'enterprise' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
          }`}>
            {lang === 'tr' ? 'Mevcut Plan:' : 'Current Plan:'} {branding.plan?.toUpperCase() || 'FREE'}
            {isExpired && ` (${lang === 'tr' ? 'SÜRESİ DOLDU' : 'EXPIRED'})`}
          </div>
        </div>

        <div className="flex items-center space-x-3 mb-8">
          <div className={`p-2 rounded-xl ${isExpired ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{lang === 'tr' ? 'Abonelik ve Paketler' : 'Subscription & Plans'}</h3>
            {branding.subscription_end && (
              <p className={`text-xs font-medium mt-1 ${isExpired ? 'text-red-500' : 'text-gray-400'}`}>
                {isExpired ? (lang === 'tr' ? 'Aboneliğiniz sona erdi' : 'Your subscription has expired') : (lang === 'tr' ? 'Yenileme Tarihi:' : 'Renewal Date:')} {new Date(branding.subscription_end).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
              </p>
            )}
          </div>
        </div>

        {isExpired && (
          <div className="mb-8 p-4 bg-red-100 border border-red-200 rounded-2xl text-red-700 text-sm font-bold flex items-center">
            <AlertTriangle className="h-5 w-5 mr-3 shrink-0" />
            {lang === 'tr' 
              ? 'Aboneliğinizin süresi dolduğu için ürün limitiniz 50\'ye düşürülmüştür. Lütfen hizmete devam etmek için paketlerden birini seçiniz.' 
              : 'Your subscription has expired, and your product limit has been reduced to 50. Please select a plan to continue service.'}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`p-6 rounded-2xl border ${branding.plan === plan.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-100'} flex flex-col`}>
              <div className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase mb-4 ${plan.color}`}>
                {plan.name}
              </div>
              <div className="flex items-baseline mb-6">
                <span className="text-3xl font-black text-gray-900">{plan.price}</span>
                <span className="text-sm text-gray-400 ml-1 font-bold">₺/yıl</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-500">
                    <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full mr-2 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              {((branding.plan !== plan.id && plan.id !== 'basic') || (branding.plan === plan.id && isExpired)) && (
                <button 
                  onClick={() => onUpgradePlan(plan.id)}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all shadow-lg shadow-gray-100"
                >
                  {isExpired && branding.plan === plan.id ? (lang === 'tr' ? 'Yenile' : 'Renew') : (lang === 'tr' ? 'Yükselt' : 'Upgrade')}
                </button>
              )}
              {branding.plan === plan.id && (
                <div className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm text-center">
                  {lang === 'tr' ? 'Aktif Paket' : 'Active Plan'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

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
