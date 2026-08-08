import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Flower2,
  Trees,
  Package,
  FolderTree,
  Plus,
  Search,
  ChevronRight,
  X,
  CheckCircle2,
  XCircle,
  Edit2,
  Loader2
} from 'lucide-react';
import { categoryApi, productApi } from '../services/api';
import { Category, Product } from '../types';
import { useCompanySettings } from '../context/CompanyContext';

interface CategoriesPageProps {
  onSelectCategoryProducts?: (categoryName: string) => void;
}

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 1,
    name: 'Grass Natural',
    description: 'Variedades de grass en rollo por metro cuadrado (m²) para jardines y canchas.',
    iconName: 'Sprout',
    active: true
  },
  {
    id: 2,
    name: 'Plantas Ornamentales',
    description: 'Plantas de interior y exterior por unidades para purificar y decorar espacios.',
    iconName: 'Flower2',
    active: true
  },
  {
    id: 3,
    name: 'Árboles y Palmeras',
    description: 'Palmeras decorativas, ficus y árboles para diseño de áreas verdes.',
    iconName: 'Trees',
    active: true
  },
  {
    id: 4,
    name: 'Accesorios e Insumos',
    description: 'Tierra preparada, abonos, sustratos y herramientas de jardinería.',
    iconName: 'Package',
    active: true
  }
];

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ onSelectCategoryProducts }) => {
  const { companyName } = useCompanySettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [selectedPreviewCategory, setSelectedPreviewCategory] = useState<string | null>(null);

  // Edit Category State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const fetchCategoryData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        categoryApi.getAllCategories().catch(() => null),
        productApi.getAllProducts().catch(() => null)
      ]);

      if (catRes?.data && catRes.data.length > 0) {
        const mappedCats: Category[] = catRes.data.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description || 'Categoría de productos del vivero',
          iconName: c.iconName || 'FolderTree',
          active: c.active ?? true
        }));
        setCategories(mappedCats);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }

      if (prodRes?.data) {
        setDbProducts(prodRes.data);
      }
    } catch (err) {
      console.error('Error al cargar datos de categorías desde MySQL:', err);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryData();
    const handleBackendOnline = () => fetchCategoryData();
    window.addEventListener('vivero_backend_online', handleBackendOnline);
    return () => window.removeEventListener('vivero_backend_online', handleBackendOnline);
  }, []);

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Sprout': return Sprout;
      case 'Flower2': return Flower2;
      case 'Trees': return Trees;
      case 'Package': return Package;
      default: return FolderTree;
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await categoryApi.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim() || 'Categoría de productos del vivero',
        iconName: 'FolderTree'
      });
      await fetchCategoryData();
      setIsAddModalOpen(false);
      setNewCatName('');
      setNewCatDesc('');
    } catch (err) {
      console.error('Error al guardar categoría en MySQL:', err);
      const newCat: Category = {
        id: Date.now(),
        name: newCatName.trim(),
        description: newCatDesc.trim() || 'Categoría de productos del vivero',
        iconName: 'FolderTree',
        active: true
      };
      setCategories(prev => [...prev, newCat]);
      setIsAddModalOpen(false);
      setNewCatName('');
      setNewCatDesc('');
    }
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || '');
  };

  const handleSaveCategoryEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCatName.trim()) return;

    setSavingCategory(true);
    try {
      await categoryApi.updateCategory(editingCategory.id, {
        name: editCatName.trim(),
        description: editCatDesc.trim()
      });
      await fetchCategoryData();
      setEditingCategory(null);
    } catch (err) {
      console.error('Error al actualizar categoría en MySQL:', err);
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: editCatName.trim(), description: editCatDesc.trim() } : c));
      setEditingCategory(null);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleToggleCategoryStatus = async (categoryId: number) => {
    try {
      await categoryApi.toggleCategoryStatus(categoryId);
      await fetchCategoryData();
    } catch (err) {
      console.error('Error al cambiar estado de categoría en MySQL:', err);
      setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, active: !c.active } : c));
    }
  };

  const getProductsForCategory = (cat: Category): Product[] => {
    return dbProducts.filter(p =>
      p.categoryId === cat.id ||
      (p.categoryName && p.categoryName.toLowerCase().trim() === cat.name.toLowerCase().trim()) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(cat.name.toLowerCase()))
    );
  };

  return (
    <div className="space-y-3.5 pb-24 lg:pb-8">
      {/* Category Header & Metrics Bar */}
      <div className="bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-vivero-soft text-vivero-dark">
              <FolderTree className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-black">Categorías de Productos</h2>
          </div>
          <p className="text-[11px] text-vivero-mint font-medium">
            Clasificación oficial del catálogo de {companyName}.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="py-2.5 px-4 bg-vivero-mint text-vivero-dark font-extrabold text-xs rounded-xl shadow-md hover:bg-vivero-soft active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-2.5 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar categoría..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 focus:bg-white text-xs font-semibold text-slate-800 rounded-xl border border-transparent focus:border-vivero-mint/60 focus:outline-none transition-all"
          />
        </div>

        <span className="text-xs font-bold text-slate-500 whitespace-nowrap hidden sm:inline">
          Total: <strong className="text-[#1b4332] font-black">{filteredCategories.length}</strong> categorías
        </span>
      </div>

      {/* Grid of Compact Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredCategories.map(cat => {
          const Icon = getCategoryIcon(cat.iconName);
          const categoryProducts = getProductsForCategory(cat);
          const isSelected = selectedPreviewCategory === cat.name;

          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card hover:shadow-soft transition-all space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-vivero-soft text-vivero-dark flex items-center justify-center font-bold shadow-sm">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-vivero-primary" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">
                        {cat.name}
                      </h3>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-full uppercase">
                        {categoryProducts.length} Productos
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase flex items-center gap-0.5 ${
                    cat.active ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {cat.active ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                    <span>{cat.active ? 'Activa' : 'Inactiva'}</span>
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {cat.description}
                </p>
              </div>

              {/* Action Buttons Row */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">

                <div className="flex items-center gap-1.5 justify-end">
                  <button
                    type="button"
                    onClick={() => openEditModal(cat)}
                    className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] rounded-xl transition-all flex items-center gap-1"
                    title="Editar datos de categoría"
                  >
                    <Edit2 className="w-3 h-3 text-slate-600" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleCategoryStatus(cat.id)}
                    className={`py-1 px-2.5 rounded-xl font-extrabold text-[11px] transition-all flex items-center gap-1 border ${
                      cat.active
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                    }`}
                    title={cat.active ? 'Inactivar categoría' : 'Activar categoría'}
                  >
                    {cat.active ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    <span>{cat.active ? 'Inactivar' : 'Activar'}</span>
                  </button>
                </div>
                <button
                  onClick={() => setSelectedPreviewCategory(isSelected ? null : cat.name)}
                  className="text-[11px] font-extrabold text-vivero-primary hover:underline flex items-center gap-1"
                >
                  <span>{isSelected ? 'Ocultar productos' : 'Ver productos en esta categoría'}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                </button>
              </div>

              {/* Expanded Category Products Preview */}
              {isSelected && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5 animate-in fade-in duration-200">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block">
                    Productos Registrados en Base de Datos ({categoryProducts.length}):
                  </span>
                  {categoryProducts.length === 0 ? (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <p className="text-[10px] text-slate-500 font-semibold italic">
                        No hay productos registrados en MySQL para esta categoría.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {categoryProducts.map(p => (
                        <div key={p.id} className="p-1.5 bg-slate-50 rounded-lg flex items-center justify-between text-[11px] font-semibold">
                          <div className="flex items-center gap-2 min-w-0">
                            <img src={p.imageUrl} alt={p.name} className="w-6 h-6 rounded-md object-cover flex-shrink-0" />
                            <span className="text-slate-800 font-bold truncate">{p.name}</span>
                          </div>
                          <span className="font-black text-[#1b4332] whitespace-nowrap pl-2">
                            S/ {p.price.toFixed(2)} /{p.unitType === 'M2' ? 'm²' : 'und'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Admin Add Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">Crear Nueva Categoría</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="text-[10px] font-extrabold text-slate-600 uppercase block mb-1">Nombre de la Categoría</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Ej. Macetas y Sustratos"
                  required
                  className="w-full px-3 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-600 uppercase block mb-1">Descripción</label>
                <textarea
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  placeholder="Descripción de los productos pertenecientes a esta categoría..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#1b4332] text-vivero-mint font-extrabold text-xs rounded-xl shadow-lg active:scale-95 transition-all mt-1"
              >
                Guardar Categoría
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-vivero-soft text-vivero-dark flex items-center justify-center font-bold">
                  <FolderTree className="w-4 h-4 text-vivero-primary" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">Editar Categoría</h3>
              </div>
              <button onClick={() => setEditingCategory(null)} className="p-1.5 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryEdit} className="space-y-3">
              <div>
                <label className="text-[10px] font-extrabold text-slate-600 uppercase block mb-1">Nombre de la Categoría</label>
                <input
                  type="text"
                  value={editCatName}
                  onChange={e => setEditCatName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-vivero-mint/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-600 uppercase block mb-1">Descripción</label>
                <textarea
                  value={editCatDesc}
                  onChange={e => setEditCatDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-vivero-mint/50"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="px-5 py-2 bg-[#1b4332] text-vivero-mint hover:bg-vivero-primary font-extrabold rounded-xl shadow-md text-xs disabled:opacity-50 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  {savingCategory ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
