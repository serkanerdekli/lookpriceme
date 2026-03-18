import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Store, 
  ChevronRight, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Download
} from "lucide-react";
import { motion } from "motion/react";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";

interface CompaniesTabProps {
  companies: any[];
  isViewer: boolean;
  onAddCompany: () => void;
  onViewTransactions: (company: any) => void;
  onEdit: (company: any) => void;
  onExportReport: () => void;
  includeZero: boolean;
  onIncludeZeroChange: (val: boolean) => void;
}

const CompaniesTab = ({ 
  companies, 
  isViewer, 
  onAddCompany, 
  onViewTransactions, 
  onEdit,
  onExportReport,
  includeZero,
  onIncludeZeroChange
}: CompaniesTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [search, setSearch] = useState("");

  const filteredCompanies = companies.filter(c => 
    c.title.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')) || 
    c.tax_number?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder={lang === 'tr' ? 'Şirket ara...' : 'Search company...'}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <label className="flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
              checked={includeZero}
              onChange={(e) => onIncludeZeroChange(e.target.checked)}
            />
            <span className="text-sm text-gray-600">{lang === 'tr' ? 'Bakiyesi 0 olanları göster' : 'Show zero balance'}</span>
          </label>
          <button 
            onClick={onExportReport}
            className="flex items-center justify-center bg-white text-gray-700 border border-gray-200 px-4 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all"
          >
            <Download className="h-5 w-5 mr-2" /> {lang === 'tr' ? 'Rapor Al' : 'Get Report'}
          </button>
          {!isViewer && (
            <button 
              onClick={onAddCompany}
              className="flex items-center justify-center bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Plus className="h-5 w-5 mr-2" /> {lang === 'tr' ? 'Yeni Şirket' : 'New Company'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
            <Store size={48} className="mx-auto mb-4 opacity-20" />
            <p>{lang === 'tr' ? 'Henüz bir şirket kaydı bulunmuyor.' : 'No company records found yet.'}</p>
          </div>
        ) : (
          filteredCompanies.map((c) => (
            <motion.div 
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                  <Store className="h-6 w-6" />
                </div>
                {!isViewer && (
                  <button 
                    onClick={() => onEdit(c)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{c.title}</h3>
              <p className="text-sm text-gray-500 mb-6">{c.contact_person || (lang === 'tr' ? 'Yetkili Belirtilmemiş' : 'No contact person')}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">{lang === 'tr' ? 'Bakiye' : 'Balance'}</span>
                  <span className={`font-black ${Number(c.balance) > 0 ? 'text-red-500' : Number(c.balance) < 0 ? 'text-green-500' : 'text-gray-900'}`}>
                    {Math.abs(Number(c.balance)).toLocaleString('tr-TR')} {c.currency || 'TRY'}
                    <span className="text-[10px] ml-1 uppercase opacity-60">
                      {Number(c.balance) > 0 ? (lang === 'tr' ? 'Borç' : 'Debit') : Number(c.balance) < 0 ? (lang === 'tr' ? 'Alacak' : 'Credit') : ''}
                    </span>
                  </span>
                </div>
              </div>

              <button 
                onClick={() => onViewTransactions(c)}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-xl text-sm font-bold transition-all"
              >
                <FileText size={16} />
                <span>{lang === 'tr' ? 'Hareketleri Gör' : 'View Transactions'}</span>
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default CompaniesTab;
