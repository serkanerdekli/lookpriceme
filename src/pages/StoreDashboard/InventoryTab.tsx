import React, { useState } from "react";
import { 
  Search, 
  Plus, 
  Download, 
  Upload, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Package, 
  Filter,
  ArrowUpDown,
  Barcode,
  ShoppingBag
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";
import { Product } from "../../types";

interface InventoryTabProps {
  products: Product[];
  loading: boolean;
  isViewer: boolean;
  onAddProduct: () => void;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
  onImportExcel: () => void;
  onExportExcel: () => void;
}

const InventoryTab = ({ 
  products, 
  loading, 
  isViewer, 
  onAddProduct, 
  onEdit, 
  onDelete, 
  onImportExcel, 
  onExportExcel 
}: InventoryTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="h-12 w-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold animate-pulse text-sm">Ürünler Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input 
            type="text" 
            placeholder={t.searchProduct}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Action buttons removed for clean slate */}
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Toplam Ürün</p>
            <p className="text-2xl font-black text-slate-900">{products.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Düşük Stok</p>
            <p className="text-2xl font-black text-rose-600">{products.filter(p => (p.stock_quantity ?? 0) < (p.min_stock_level ?? 5)).length}</p>
        </div>
      </div>

      {/* Product List/Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {filteredProducts.map((p) => (
            <motion.div 
              layout
              key={p.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white group rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-indigo-200/50 transition-all overflow-hidden flex flex-col"
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  {!isViewer && (
                    <div className="flex space-x-1">
                      <button onClick={() => onEdit(p)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => onDelete(p.id!)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  )}
                </div>
                
                <h4 className="text-base font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{p.name}</h4>
                <div className="flex items-center space-x-2 text-slate-400 mb-4">
                  <Barcode className="h-3.5 w-3.5" />
                  <span className="text-xs font-mono font-medium">{p.barcode}</span>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                   <div className="text-lg font-black text-indigo-600">
                    {new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: p.currency || 'TRY' }).format(p.price)}
                   </div>
                   <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                     (p.stock_quantity ?? 0) <= (p.min_stock_level ?? 5) ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                   }`}>
                     Stok: {p.stock_quantity ?? 0}
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-[2rem] border border-slate-200/60 p-16 flex flex-col items-center text-center shadow-sm">
          <div className="h-24 w-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6">
            <Package className="h-12 w-12" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">{t.noProducts}</h3>
          <p className="text-slate-500 font-medium max-w-sm mb-8">Henüz ürün eklememişsiniz. Manuel ekleyebilir veya Excel ile toplu yükleme yapabilirsiniz.</p>
          {!isViewer && (
            <button 
              onClick={onAddProduct}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>İlk Ürünü Ekle</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryTab;
