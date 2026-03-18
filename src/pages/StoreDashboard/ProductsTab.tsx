import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  Upload, 
  Edit2, 
  ChevronRight, 
  AlertTriangle 
} from "lucide-react";
import { motion } from "motion/react";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";

interface ProductsTabProps {
  products: any[];
  loading: boolean;
  isViewer: boolean;
  onAddManual: () => void;
  onImport: () => void;
  onDeleteAll: () => void;
  onEdit: (product: any) => void;
  onDelete: (id: number) => void;
}

const ProductsTab = ({ 
  products, 
  loading, 
  isViewer, 
  onAddManual, 
  onImport, 
  onDeleteAll, 
  onEdit, 
  onDelete 
}: ProductsTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const filteredProducts = products.filter(p => 
    p.name.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')) || 
    p.barcode.includes(search)
  );
  
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder={t.searchProduct}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        {!isViewer && (
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={onAddManual}
              className="flex-1 md:flex-none flex items-center justify-center bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Plus className="h-5 w-5 mr-2" /> {t.addManual}
            </button>
            <button 
              onClick={onImport}
              className="flex-1 md:flex-none flex items-center justify-center bg-white text-gray-700 border border-gray-200 px-4 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all"
            >
              <Upload className="h-5 w-5 mr-2" /> {t.importExcel}
            </button>
            <button 
              onClick={onDeleteAll}
              className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
              title={t.deleteAll}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.barcode}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.productName}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.price}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.stock}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">{t.loading}</p>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {t.noProducts}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{p.barcode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{p.name}</div>
                      {p.description && <div className="text-xs text-gray-400 truncate max-w-[200px]">{p.description}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-indigo-600">
                        {Number(p.price).toLocaleString('tr-TR')} {p.currency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`font-bold ${Number(p.stock_quantity) <= Number(p.min_stock_level) ? 'text-red-500' : 'text-gray-700'}`}>
                          {p.stock_quantity}
                        </span>
                        {Number(p.stock_quantity) <= Number(p.min_stock_level) && (
                          <AlertTriangle className="h-3 w-3 ml-1 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isViewer && (
                        <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => onEdit(p)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => onDelete(p.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
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
              {filteredProducts.length} {t.products}
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

export default ProductsTab;
