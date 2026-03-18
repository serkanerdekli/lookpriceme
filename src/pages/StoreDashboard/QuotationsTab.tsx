import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  FileText, 
  Download, 
  CheckCircle2, 
  Trash2, 
  Edit2,
  ChevronRight,
  Filter
} from "lucide-react";
import { motion } from "motion/react";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";

interface QuotationsTabProps {
  quotations: any[];
  isViewer: boolean;
  onAddQuotation: () => void;
  onViewDetails: (id: number) => void;
  onGeneratePDF: (quotation: any) => void;
  onApprove: (id: number) => void;
  onEdit: (quotation: any) => void;
  onDelete: (id: number) => void;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  statusFilter: string;
}

const QuotationsTab = ({ 
  quotations, 
  isViewer, 
  onAddQuotation, 
  onViewDetails, 
  onGeneratePDF, 
  onApprove, 
  onEdit, 
  onDelete,
  onSearchChange,
  onStatusFilterChange,
  statusFilter
}: QuotationsTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const paginatedQuotations = (quotations || []).slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil((quotations || []).length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex-1 flex gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder={t.searchQuotation}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
              value={search}
              onChange={(e) => { setSearch(e.target.value); onSearchChange(e.target.value); setPage(1); }}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select 
              className="pl-9 pr-8 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all appearance-none text-sm font-medium text-gray-600"
              value={statusFilter}
              onChange={(e) => { onStatusFilterChange(e.target.value); setPage(1); }}
            >
              <option value="all">{lang === 'tr' ? 'Tüm Durumlar' : 'All Statuses'}</option>
              <option value="pending">{lang === 'tr' ? 'Bekleyenler' : 'Pending'}</option>
              <option value="approved">{lang === 'tr' ? 'Onaylananlar' : 'Approved'}</option>
            </select>
          </div>
        </div>
        {!isViewer && (
          <button 
            onClick={onAddQuotation}
            className="w-full md:w-auto flex items-center justify-center bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus className="h-5 w-5 mr-2" /> {t.newQuotation}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.customer}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.date}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.amount}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.status}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedQuotations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {t.noQuotations}
                  </td>
                </tr>
              ) : (
                paginatedQuotations.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{q.customer_name}</div>
                      {q.customer_title && <div className="text-xs text-gray-400">{q.customer_title}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(q.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900">
                        {Number(q.total_amount).toLocaleString('tr-TR')} {q.currency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        q.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {q.status === 'approved' ? (lang === 'tr' ? 'Onaylandı' : 'Approved') : (lang === 'tr' ? 'Beklemede' : 'Pending')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onViewDetails(q.id)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title={t.viewDetails}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => onGeneratePDF(q)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title={t.downloadPDF}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {!isViewer && q.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => onApprove(q.id)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title={t.approve}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => onEdit(q)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title={t.edit}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {!isViewer && (
                          <button 
                            onClick={() => onDelete(q.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title={t.delete}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {quotations.length} {t.quotations}
            </p>
            <div className="flex space-x-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold disabled:opacity-50"
              >
                {t.prev}
              </button>
              <div className="flex items-center px-4 text-sm font-bold text-gray-600">
                {page} / {totalPages}
              </div>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold disabled:opacity-50"
              >
                {t.next}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationsTab;
