import React from "react";
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Download,
  CreditCard,
  User as UserIcon,
  Landmark,
  Smartphone
} from "lucide-react";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";

interface PosTabProps {
  sales: any[];
  loading: boolean;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onViewDetails: (sale: any) => void;
  onExportReport: () => void;
}

const PosTab = ({ 
  sales, 
  loading, 
  statusFilter, 
  onStatusFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onViewDetails,
  onExportReport
}: PosTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-400 uppercase">{t.dateRange}</span>
              <input 
                type="date" 
                className="bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
              />
              <span className="text-gray-300">-</span>
              <input 
                type="date" 
                className="bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-400 uppercase">{t.status}</span>
              <select 
                className="bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 appearance-none pr-8"
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
              >
                <option value="all">{t.all}</option>
                <option value="pending">{t.pending}</option>
                <option value="completed">{t.completed}</option>
                <option value="cancelled">{t.cancelled}</option>
              </select>
            </div>
          </div>
          <button 
            onClick={onExportReport}
            className="flex items-center justify-center bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition-all text-sm"
          >
            <Download className="h-4 w-4 mr-2" /> {lang === 'tr' ? 'Kasa Raporu' : 'Cash Report'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.orderCode}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.date}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.customer}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.amount}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.status}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">{t.loading}</p>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {t.noSales}
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-bold text-indigo-600">#{s.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{new Date(s.created_at).toLocaleDateString('tr-TR')}</div>
                      <div className="text-[10px] text-gray-400">{new Date(s.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {s.customer_name || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-black text-gray-900">
                        {Number(s.total_amount).toLocaleString('tr-TR')} {s.currency}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1 mt-1">
                        {s.payment_method === 'cash' && <><Smartphone className="h-3 w-3" /> {lang === 'tr' ? 'Nakit' : 'Cash'}</>}
                        {s.payment_method === 'card' && <><CreditCard className="h-3 w-3" /> {lang === 'tr' ? 'Kredi Kartı' : 'Credit Card'}</>}
                        {s.payment_method === 'bank' && <><Landmark className="h-3 w-3" /> {lang === 'tr' ? 'Banka/EFT' : 'Bank/EFT'}</>}
                        {s.payment_method === 'cari' && <><UserIcon className="h-3 w-3" /> {lang === 'tr' ? 'Vadeli (Cari Borç)' : 'Deferred (Cari Debt)'}</>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        s.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        s.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {s.status === 'completed' ? t.completed : s.status === 'cancelled' ? t.cancelled : t.pending}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onViewDetails(s)}
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
    </div>
  );
};

export default PosTab;
