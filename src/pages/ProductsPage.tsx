import React, { useState, useEffect } from 'react';
import { productApi, categoryApi } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { Product, UnitType, getProductPricing } from '../types';
import { processProductImage, processProductImageUrl } from '../utils/imageUtils';
import { useCompanySettings } from '../context/CompanyContext';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Plus,
  X,
  Sprout,
  Flower2,
  Trees,
  Package,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Link as LinkIcon,
  ClipboardPaste,
  Edit2,
  Loader2,
  AlertCircle,
  ChevronDown,
  Check,
  Layers,
  Boxes,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  PackageCheck,
  RotateCcw,
  ScanLine,
  Sparkles,
  Tag,
  PackageX,
  Pencil,
  Trash2,
  SearchX,
  WifiOff
} from 'lucide-react';
import { ProductScannerModal } from '../components/ProductScannerModal';
import { ProductAnalysis } from '../services/api';

interface ProductsPageProps {
  onSelectProduct: (product: Product) => void;
  searchTerm: string;
  onGoToInventory?: () => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ onSelectProduct, searchTerm: externalSearch, onGoToInventory }) => {
  const { companyName } = useCompanySettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [categoriesList, setCategoriesList] = useState<Array<{ id: number; name: string }>>([
    { id: 1, name: 'Grass Natural' },
    { id: 2, name: 'Plantas Ornamentales' },
    { id: 3, name: 'Árboles y Palmeras' },
    { id: 4, name: 'Accesorios e Insumos' }
  ]);

  const [search, setSearch] = useState<string>(externalSearch || '');

  // Keep the local search in sync with the Navbar global search
  useEffect(() => {
    setSearch(externalSearch || '');
  }, [externalSearch]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [unitTypeFilter, setUnitTypeFilter] = useState<string>('TODOS');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('TODOS');
  const [sortBy, setSortBy] = useState<string>('nombre');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Filter Combos Open States
  const [isUnitFilterComboOpen, setIsUnitFilterComboOpen] = useState(false);
  const [isStockFilterComboOpen, setIsStockFilterComboOpen] = useState(false);
  const [isSortFilterComboOpen, setIsSortFilterComboOpen] = useState(false);

  // Form State for Create Product
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Grass Natural');
  const [newProdUnitType, setNewProdUnitType] = useState<UnitType>('M2');
  const [newProdPrice, setNewProdPrice] = useState('12.00');
  const [newProdStock, setNewProdStock] = useState('100');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'file' | 'url'>('file');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCategoryComboOpen, setIsCategoryComboOpen] = useState(false);
  const [isUnitTypeComboOpen, setIsUnitTypeComboOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const DEFAULT_MOCKUP_IMAGE = 'https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=600&q=80';

  const fetchProducts = async () => {
    setLoadingProducts(true);
    setProductError(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        productApi.getAllProducts().catch(() => null),
        categoryApi.getAllCategories().catch(() => null)
      ]);
      if (prodRes?.data && prodRes.data.length > 0) {
        setProducts(prodRes.data);
      } else {
        setProducts([]);
      }
      if (catRes?.data && catRes.data.length > 0) setCategoriesList(catRes.data);
    } catch (err: any) {
      console.error('Error al cargar productos desde la base de datos:', err);
      setProducts([]);
      setProductError('No se pudo conectar con el backend. Los productos se cargarán automáticamente cuando el servidor esté disponible.');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const handleUpdate = () => {
      fetchProducts();
      // Double check after 500ms to ensure DB transaction finish
      setTimeout(() => fetchProducts(), 500);
    };

    window.addEventListener('vivero_products_updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    window.addEventListener('visibilitychange', handleUpdate);
    window.addEventListener('vivero_backend_online', handleUpdate);

    return () => {
      window.removeEventListener('vivero_products_updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      window.removeEventListener('visibilitychange', handleUpdate);
      window.removeEventListener('vivero_backend_online', handleUpdate);
    };
  }, []);

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const processed = await processProductImage(file);
      setNewProdImage(processed);
    }
  };

  const handlePasteUrlFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setNewProdImage(await processProductImageUrl(text.trim()));
        setImageInputMode('url');
      } else {
        const fallback = prompt('Pega aquí el enlace (URL) de la imagen:');
        if (fallback) {
          setNewProdImage(await processProductImageUrl(fallback.trim()));
          setImageInputMode('url');
        }
      }
    } catch (err) {
      const fallback = prompt('Pega aquí el enlace (URL) de la imagen:');
      if (fallback) {
        setNewProdImage(await processProductImageUrl(fallback.trim()));
        setImageInputMode('url');
      }
    }
  };

  const handleScannerResult = async (photoDataUrl: string | null, analysis: ProductAnalysis) => {
    if (analysis.name) setNewProdName(analysis.name);
    if (analysis.description) setNewProdDescription(analysis.description);

    if (analysis.categoryName) {
      const catExists = categoriesList.some(c =>
        c.name.toLowerCase().includes(analysis.categoryName.toLowerCase())
      );
      if (catExists) setNewProdCategory(analysis.categoryName);
    }

    if (analysis.categoryName?.toLowerCase().includes('grass')) {
      setNewProdUnitType('M2');
    } else {
      setNewProdUnitType('UNIDAD');
    }

    if (photoDataUrl) {
      try {
        const processed = await processProductImageUrl(photoDataUrl);
        setNewProdImage(processed);
      } catch {
        setNewProdImage(photoDataUrl);
      }
      setImageInputMode('file');
    } else if (analysis.imageUrl?.startsWith('http')) {
      setNewProdImage(analysis.imageUrl);
      setImageInputMode('url');
    }
  };

  const categories = [
    { name: 'Todos', icon: Sprout },
    { name: 'Grass', icon: Sprout },
    { name: 'Plantas', icon: Flower2 },
    { name: 'Árboles', icon: Trees },
    { name: 'Accesorios', icon: Package },
  ];

  const UNIT_FILTER_OPTIONS = [
    { id: 'TODOS', label: 'Todos (m² y Unidades)', subtitle: 'Ver catálogo completo', icon: Layers, badgeBg: 'bg-slate-100 text-slate-600' },
    { id: 'M2', label: 'Solo Grass (m²)', subtitle: 'Venta por metro cuadrado', icon: Sprout, badgeBg: 'bg-emerald-100 text-emerald-800' },
    { id: 'UNIDAD', label: 'Solo Plantas (Unidades)', subtitle: 'Venta por unidad individual', icon: Package, badgeBg: 'bg-blue-100 text-blue-800' }
  ];

  const STOCK_FILTER_OPTIONS = [
    { id: 'TODOS', label: 'Todos los Productos', subtitle: 'Stock normal y crítico', icon: Boxes, badgeBg: 'bg-slate-100 text-slate-600' },
    { id: 'DISPONIBLE', label: 'Normal / En Stock', subtitle: 'Stock suficiente disponible', icon: CheckCircle2, badgeBg: 'bg-emerald-100 text-emerald-800' },
    { id: 'CRITICO', label: 'Stock Crítico o Bajo', subtitle: 'Igual o menor al stock mínimo', icon: AlertTriangle, badgeBg: 'bg-amber-100 text-amber-800' }
  ];

  const SORT_FILTER_OPTIONS = [
    { id: 'nombre', label: 'Nombre (A - Z)', subtitle: 'Orden alfabético A-Z', icon: ArrowUpDown, badgeBg: 'bg-slate-100 text-slate-700' },
    { id: 'precio_asc', label: 'Precio: Menor a Mayor', subtitle: 'Económico a costoso', icon: TrendingUp, badgeBg: 'bg-emerald-100 text-emerald-800' },
    { id: 'precio_desc', label: 'Precio: Mayor a Menor', subtitle: 'Costoso a económico', icon: TrendingDown, badgeBg: 'bg-amber-100 text-amber-800' },
    { id: 'stock_desc', label: 'Mayor Stock Disponible', subtitle: 'Con más unidades disponibles', icon: PackageCheck, badgeBg: 'bg-vivero-soft text-vivero-dark font-extrabold' }
  ];

  const activeUnitOpt = UNIT_FILTER_OPTIONS.find(o => o.id === unitTypeFilter) || UNIT_FILTER_OPTIONS[0];
  const activeStockOpt = STOCK_FILTER_OPTIONS.find(o => o.id === stockStatusFilter) || STOCK_FILTER_OPTIONS[0];
  const activeSortOpt = SORT_FILTER_OPTIONS.find(o => o.id === sortBy) || SORT_FILTER_OPTIONS[0];
  const activeFiltersCount = (unitTypeFilter !== 'TODOS' ? 1 : 0) + (stockStatusFilter !== 'TODOS' ? 1 : 0) + (sortBy !== 'nombre' ? 1 : 0);

  // Filtering Logic
  const filteredProducts = products.filter(p => {
    const query = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(query) ||
                          p.categoryName.toLowerCase().includes(query) ||
                          p.code.toLowerCase().includes(query) ||
                          (p.variety && p.variety.toLowerCase().includes(query)) ||
                          (p.brand && p.brand.toLowerCase().includes(query));

    const matchesCategory = selectedCategory === 'Todos' || p.categoryName.toLowerCase().includes(selectedCategory.toLowerCase());

    const matchesUnitType = unitTypeFilter === 'TODOS' || p.unitType === unitTypeFilter;

    const matchesStockStatus =
      stockStatusFilter === 'TODOS' ? true :
      stockStatusFilter === 'CRITICO' ? p.availableStock <= p.minStock :
      p.availableStock > p.minStock;

    return matchesSearch && matchesCategory && matchesUnitType && matchesStockStatus;
  }).sort((a, b) => {
    if (sortBy === 'precio_asc') return a.price - b.price;
    if (sortBy === 'precio_desc') return b.price - a.price;
    if (sortBy === 'stock_desc') return b.availableStock - a.availableStock;
    return a.name.localeCompare(b.name);
  });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    setIsSaving(true);
    setFormError(null);

    const priceNum = parseFloat(newProdPrice) || 12.00;
    const stockNum = editingProduct
      ? Number(editingProduct.stock) || 0
      : parseFloat(newProdStock) || 100;
    const selectedCatObj = categoriesList.find(c => c.name.toLowerCase().includes(newProdCategory.toLowerCase())) || categoriesList[0];
    const catId = selectedCatObj ? selectedCatObj.id : 1;

    try {
      if (editingProduct) {
        await productApi.updateProduct(editingProduct.id, {
          code: editingProduct.code,
          name: newProdName.trim(),
          variety: editingProduct.variety,
          brand: newProdBrand.trim() || undefined,
          description: editingProduct.description || newProdDescription,
          categoryId: catId,
          unitType: newProdUnitType,
          price: priceNum,
          originalPrice: editingProduct.originalPrice,
          discountPercentage: editingProduct.discountPercentage,
          costPrice: editingProduct.costPrice,
          stock: stockNum,
          minStock: editingProduct.minStock,
          imageUrl: newProdImage.trim() || editingProduct.imageUrl
        });
      } else {
        await productApi.createProduct({
          name: newProdName.trim(),
          variety: newProdUnitType === 'M2' ? 'm²' : 'und',
          brand: newProdBrand.trim() || undefined,
          categoryId: catId,
          unitType: newProdUnitType,
          price: priceNum,
          costPrice: priceNum * 0.5,
          stock: stockNum,
          minStock: 10,
          description: newProdDescription || 'Producto registrado en vivero',
          imageUrl: newProdImage.trim() || DEFAULT_MOCKUP_IMAGE
        });
      }
      await fetchProducts();
      window.dispatchEvent(new CustomEvent('vivero_products_updated'));
      closeProductModal();
    } catch (err: any) {
      console.error('Error al guardar producto en MySQL:', err);
      let errorMsg = 'No se pudo guardar el producto en la base de datos MySQL.';
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setFormError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const closeProductModal = () => {
    setIsAddModalOpen(false);
    setEditingProduct(null);
    setNewProdName('');
    setNewProdBrand('');
    setNewProdImage('');
    setNewProdDescription('');
    setFormError(null);
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setNewProdName('');
    setNewProdBrand('');
    setNewProdCategory('Grass Natural');
    setNewProdUnitType('M2');
    setNewProdPrice('12.00');
    setNewProdStock('100');
    setNewProdImage('');
    setNewProdDescription('');
    setImageInputMode('file');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProdName(product.name);
    setNewProdBrand(product.brand || '');
    setNewProdCategory(product.categoryName || 'Grass Natural');
    setNewProdUnitType(product.unitType);
    setNewProdPrice(String(product.price));
    setNewProdStock(product.stock !== undefined && product.stock !== null ? String(product.stock) : '');
    setNewProdImage(product.imageUrl || '');
    setNewProdDescription(product.description || '');
    setImageInputMode(product.imageUrl?.startsWith('data:') ? 'file' : 'url');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!editingProduct) return;
    if (!window.confirm(`¿Seguro que deseas eliminar "${editingProduct.name}"? Esta acción no se puede deshacer.`)) return;
    setIsSaving(true);
    setFormError(null);
    try {
      await productApi.deleteProduct(editingProduct.id);
      await fetchProducts();
      window.dispatchEvent(new CustomEvent('vivero_products_updated'));
      closeProductModal();
    } catch (err: any) {
      console.error('Error al eliminar producto en MySQL:', err);
      let errorMsg = 'No se pudo eliminar el producto.';
      if (err.response?.data?.message) errorMsg = err.response.data.message;
      setFormError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('Todos');
    setUnitTypeFilter('TODOS');
    setStockStatusFilter('TODOS');
    setSortBy('nombre');
    setIsUnitFilterComboOpen(false);
    setIsStockFilterComboOpen(false);
    setIsSortFilterComboOpen(false);
  };

  return (
    <div className="space-y-3.5 pb-24 lg:pb-8">
      {/* Stats Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f2e1f] via-[#1b4332] to-[#2d6a4f] rounded-2xl sm:rounded-3xl p-3 sm:p-6 text-white shadow-xl">
        <div className="absolute -top-20 -right-16 w-40 sm:w-64 h-40 sm:h-64 rounded-full bg-vivero-mint/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-12 w-48 sm:w-72 h-48 sm:h-72 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/10 border border-vivero-mint/25 shadow-inner">
                <Sprout className="w-4 h-4 sm:w-6 sm:h-6 text-vivero-mint" />
              </div>
              <div>
                <h2 className="text-sm sm:text-xl font-black leading-tight tracking-tight">Catálogo de Productos</h2>
                <p className="text-[10px] sm:text-xs text-emerald-200/90 font-medium">Administra precios, descuentos y stock de tu inventario</p>
              </div>
            </div>
            <button
              onClick={openNewProductModal}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-vivero-mint text-vivero-dark text-xs font-extrabold hover:bg-white active:scale-95 transition-all shadow-lg shadow-vivero-mint/20"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              Nuevo Producto
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2.5 mt-2.5 sm:mt-4">
            <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:p-3 border border-white/10 flex items-center gap-2 sm:gap-2.5 hover:bg-white/[0.12] transition-colors">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-vivero-mint/20 border border-vivero-mint/30 flex items-center justify-center flex-shrink-0">
                <Boxes className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-vivero-mint" />
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-2xl font-black leading-none">{products.length}</p>
                <p className="text-[8px] sm:text-[10px] font-bold text-emerald-200/80 uppercase tracking-wider truncate mt-0.5">Productos</p>
              </div>
            </div>
            <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:p-3 border border-white/10 flex items-center gap-2 sm:gap-2.5 hover:bg-white/[0.12] transition-colors">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-2xl font-black leading-none">{products.filter(p => (p.discountPercentage ?? 0) > 0).length}</p>
                <p className="text-[8px] sm:text-[10px] font-bold text-emerald-200/80 uppercase tracking-wider truncate mt-0.5">Descuentos</p>
              </div>
            </div>
            <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:p-3 border border-white/10 flex items-center gap-2 sm:gap-2.5 hover:bg-white/[0.12] transition-colors">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-orange-400/20 border border-orange-400/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-300" />
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-2xl font-black leading-none">
                  {products.filter(p => (p.availableStock ?? 0) > 0 && (p.availableStock ?? 0) <= (p.minStock ?? 10)).length}
                </p>
                <p className="text-[8px] sm:text-[10px] font-bold text-emerald-200/80 uppercase tracking-wider truncate mt-0.5">Stock crítico</p>
              </div>
            </div>
            <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:p-3 border border-white/10 flex items-center gap-2 sm:gap-2.5 hover:bg-white/[0.12] transition-colors">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center flex-shrink-0">
                <PackageX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-300" />
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-2xl font-black leading-none">
                  {products.filter(p => (p.availableStock ?? 0) <= 0).length}
                </p>
                <p className="text-[8px] sm:text-[10px] font-bold text-emerald-200/80 uppercase tracking-wider truncate mt-0.5">Agotados</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Header Actions */}
      <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-card space-y-3">
        <div className="flex items-center justify-between gap-2">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, marca o código..."
              className="w-full pl-8 pr-8 py-2 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 rounded-xl border border-slate-200/80 focus:border-vivero-mint/60 focus:ring-2 focus:ring-vivero-mint/20 focus:outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle Filters Panel */}
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all active:scale-95 ${
                showFilterPanel || activeFiltersCount > 0
                  ? 'bg-vivero-soft text-vivero-dark border-vivero-mint/60 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-vivero-primary" />
              <span className="text-xs">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-vivero-primary text-vivero-mint text-[9px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white text-vivero-dark shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Vista Cuadrícula"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-white text-vivero-dark shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Vista Lista Compacta"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Admin Add Product Button */}
            <button
              onClick={openNewProductModal}
              className="py-2 px-3 bg-gradient-to-r from-[#1b4332] to-vivero-primary hover:from-vivero-primary hover:to-[#1b4332] text-vivero-mint font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">Nuevo</span>
            </button>
          </div>
        </div>

        {/* Collapsible Filter Options Panel */}
        {showFilterPanel && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in slide-in-from-top-2 duration-200">
            {/* Custom Modern Combo 1: Unidad de Medida */}
            <div className="relative">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Unidad de Medida
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsUnitFilterComboOpen(!isUnitFilterComboOpen);
                  setIsStockFilterComboOpen(false);
                  setIsSortFilterComboOpen(false);
                }}
                className={`w-full px-3 py-2 bg-slate-50 hover:bg-white rounded-xl border transition-all text-xs font-bold text-slate-800 flex items-center justify-between shadow-2xs ${
                  isUnitFilterComboOpen
                    ? 'border-vivero-primary ring-2 ring-vivero-mint/40 bg-white shadow-sm'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${activeUnitOpt.badgeBg}`}>
                    <activeUnitOpt.icon className="w-3 h-3" />
                  </div>
                  <span className="truncate">{activeUnitOpt.label}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-1 ${isUnitFilterComboOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUnitFilterComboOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsUnitFilterComboOpen(false)} />
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-slate-200/90 shadow-xl z-40 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                    {UNIT_FILTER_OPTIONS.map(opt => {
                      const isSelected = unitTypeFilter === opt.id;
                      const IconComp = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setUnitTypeFilter(opt.id);
                            setIsUnitFilterComboOpen(false);
                          }}
                          className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-vivero-soft/80 border border-vivero-primary/40 text-vivero-dark font-extrabold shadow-2xs'
                              : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${opt.badgeBg}`}>
                              <IconComp className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold leading-tight truncate">{opt.label}</p>
                              <p className="text-[10px] text-slate-400 font-medium truncate">{opt.subtitle}</p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-vivero-primary stroke-[3] ml-1 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Custom Modern Combo 2: Estado de Stock */}
            <div className="relative">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Estado de Stock
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsStockFilterComboOpen(!isStockFilterComboOpen);
                  setIsUnitFilterComboOpen(false);
                  setIsSortFilterComboOpen(false);
                }}
                className={`w-full px-3 py-2 bg-slate-50 hover:bg-white rounded-xl border transition-all text-xs font-bold text-slate-800 flex items-center justify-between shadow-2xs ${
                  isStockFilterComboOpen
                    ? 'border-vivero-primary ring-2 ring-vivero-mint/40 bg-white shadow-sm'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${activeStockOpt.badgeBg}`}>
                    <activeStockOpt.icon className="w-3 h-3" />
                  </div>
                  <span className="truncate">{activeStockOpt.label}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-1 ${isStockFilterComboOpen ? 'rotate-180' : ''}`} />
              </button>

              {isStockFilterComboOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsStockFilterComboOpen(false)} />
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-slate-200/90 shadow-xl z-40 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                    {STOCK_FILTER_OPTIONS.map(opt => {
                      const isSelected = stockStatusFilter === opt.id;
                      const IconComp = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setStockStatusFilter(opt.id);
                            setIsStockFilterComboOpen(false);
                          }}
                          className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-vivero-soft/80 border border-vivero-primary/40 text-vivero-dark font-extrabold shadow-2xs'
                              : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${opt.badgeBg}`}>
                              <IconComp className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold leading-tight truncate">{opt.label}</p>
                              <p className="text-[10px] text-slate-400 font-medium truncate">{opt.subtitle}</p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-vivero-primary stroke-[3] ml-1 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Custom Modern Combo 3: Ordenar Por */}
            <div className="relative">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Ordenar Por
              </label>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSortFilterComboOpen(!isSortFilterComboOpen);
                      setIsUnitFilterComboOpen(false);
                      setIsStockFilterComboOpen(false);
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 hover:bg-white rounded-xl border transition-all text-xs font-bold text-slate-800 flex items-center justify-between shadow-2xs ${
                      isSortFilterComboOpen
                        ? 'border-vivero-primary ring-2 ring-vivero-mint/40 bg-white shadow-sm'
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${activeSortOpt.badgeBg}`}>
                        <activeSortOpt.icon className="w-3 h-3" />
                      </div>
                      <span className="truncate">{activeSortOpt.label}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-1 ${isSortFilterComboOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSortFilterComboOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsSortFilterComboOpen(false)} />
                      <div className="absolute right-0 sm:left-0 top-full mt-1 w-64 bg-white rounded-2xl border border-slate-200/90 shadow-xl z-40 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                        {SORT_FILTER_OPTIONS.map(opt => {
                          const isSelected = sortBy === opt.id;
                          const IconComp = opt.icon;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setSortBy(opt.id);
                                setIsSortFilterComboOpen(false);
                              }}
                              className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'bg-vivero-soft/80 border border-vivero-primary/40 text-vivero-dark font-extrabold shadow-2xs'
                                  : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${opt.badgeBg}`}>
                                  <IconComp className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold leading-tight truncate">{opt.label}</p>
                                  <p className="text-[10px] text-slate-400 font-medium truncate">{opt.subtitle}</p>
                                </div>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-vivero-primary stroke-[3] ml-1 flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Reset Filters Button */}
                {(activeFiltersCount > 0 || selectedCategory !== 'Todos' || search !== '') && (
                  <button
                    type="button"
                    onClick={() => {
                      setUnitTypeFilter('TODOS');
                      setStockStatusFilter('TODOS');
                      setSortBy('nombre');
                      setSelectedCategory('Todos');
                      setSearch('');
                      setIsUnitFilterComboOpen(false);
                      setIsStockFilterComboOpen(false);
                      setIsSortFilterComboOpen(false);
                    }}
                    className="py-2 px-2.5 text-xs text-rose-700 hover:text-rose-800 font-extrabold bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200/80 transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95 shadow-2xs"
                    title="Restablecer todos los filtros"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    <span className="hidden sm:inline text-[11px]">Limpiar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Category Pills (Horizontal Scrollable) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap flex items-center gap-1.5 transition-all border ${
                  isActive
                    ? 'bg-gradient-to-r from-[#1b4332] to-vivero-primary text-vivero-mint shadow-md border-transparent'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-vivero-mint/50 hover:text-vivero-primary hover:bg-vivero-soft/40'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{cat.name}</span>
                {isActive && <span className="w-1 h-1 rounded-full bg-vivero-mint" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card px-3.5 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-vivero-soft text-vivero-primary flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-800 leading-tight truncate">
              {loadingProducts ? 'Cargando...' : `${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''}`}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 truncate">
              {loadingProducts ? 'Consultando base de datos' : `de ${products.length} en el catálogo`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {unitTypeFilter !== 'TODOS' && (
            <button
              onClick={() => setUnitTypeFilter('TODOS')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold whitespace-nowrap hover:bg-emerald-100 transition-colors flex-shrink-0"
              title="Quitar filtro de unidad"
            >
              <Sprout className="w-3 h-3" />
              {activeUnitOpt.label}
              <X className="w-3 h-3" />
            </button>
          )}
          {stockStatusFilter !== 'TODOS' && (
            <button
              onClick={() => setStockStatusFilter('TODOS')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-extrabold whitespace-nowrap hover:bg-amber-100 transition-colors flex-shrink-0"
              title="Quitar filtro de stock"
            >
              <AlertTriangle className="w-3 h-3" />
              {activeStockOpt.label}
              <X className="w-3 h-3" />
            </button>
          )}
          {sortBy !== 'nombre' && (
            <button
              onClick={() => setSortBy('nombre')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-extrabold whitespace-nowrap hover:bg-slate-200 transition-colors flex-shrink-0"
              title="Quitar ordenamiento"
            >
              <ArrowUpDown className="w-3 h-3" />
              {activeSortOpt.label}
              <X className="w-3 h-3" />
            </button>
          )}
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold whitespace-nowrap hover:bg-rose-100 transition-colors flex-shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              Limpiar todo
            </button>
          )}
        </div>
      </div>

      {/* Grid View vs List View */}
      {loadingProducts ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden animate-pulse">
              <div className="h-36 sm:h-44 bg-slate-200" />
              <div className="p-3.5 space-y-2">
                <div className="h-2.5 bg-slate-200 rounded w-2/3" />
                <div className="h-2.5 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectProduct={onSelectProduct}
              onEditProduct={openEditProduct}
              showAddToCart={false}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map(product => {
            const isM2 = product.unitType === 'M2';
            const pricing = getProductPricing(product);

            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-card hover:shadow-soft transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-contain p-1 bg-slate-100 flex-shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 bg-slate-100 text-vivero-dark text-[10px] font-extrabold rounded-md uppercase">
                        {product.categoryName}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-vivero-soft text-[#1b4332] text-[9px] font-black uppercase">
                        {isM2 ? 'm²' : 'und'}
                      </span>
                    </div>
                    {product.brand && (
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        {product.brand}
                      </span>
                    )}
                    <h4 className="font-extrabold text-slate-800 text-sm break-words leading-snug">
                      {product.name}
                    </h4>
                    <p className="text-xs font-bold text-slate-500">
                      Stock: <strong className="text-slate-800">{product.availableStock} {isM2 ? 'm²' : 'und'}</strong>
                    </p>
                    <div className="flex items-center gap-1">
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase ${
                        (product.availableStock ?? 0) <= 0
                          ? 'bg-rose-100 text-rose-600'
                          : (product.availableStock ?? 0) <= (product.minStock ?? 10)
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {(product.availableStock ?? 0) <= 0
                          ? 'Agotado'
                          : (product.availableStock ?? 0) <= (product.minStock ?? 10)
                            ? 'Crítico'
                            : 'En stock'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right space-y-0.5">
                    {pricing.hasDiscount && (
                      <span className="bg-[#e11d48] text-white font-black text-[10px] px-2 py-0.5 rounded-lg inline-block shadow-2xs">
                        -{pricing.discountPercentage}%
                      </span>
                    )}
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-base sm:text-lg font-black text-slate-900">
                        S/ {pricing.sellingPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        /{isM2 ? 'm²' : 'und'}
                      </span>
                    </div>
                    {pricing.hasDiscount && (
                      <span className="text-xs font-bold text-slate-400 line-through block leading-none">
                        S/ {pricing.basePrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditProduct(product);
                    }}
                    className="p-3 rounded-xl bg-vivero-soft text-vivero-dark hover:bg-vivero-primary hover:text-white transition-all shadow-sm active:scale-95"
                    title="Editar producto"
                  >
                    <Pencil className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loadingProducts && filteredProducts.length === 0 && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-dashed border-slate-300 shadow-card p-8 sm:p-12 text-center">
          <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${productError ? 'bg-rose-50' : 'bg-vivero-soft'}`}>
            {productError ? (
              <WifiOff className="w-6 h-6 text-rose-500" />
            ) : (
              <SearchX className="w-6 h-6 text-vivero-primary" />
            )}
          </div>
          <h3 className="font-black text-slate-800 text-sm sm:text-base">
            {productError ? 'Sin conexión con el servidor' : 'No se encontraron productos'}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-1 max-w-sm mx-auto">
            {productError
              ? 'El catálogo se cargará automáticamente en cuanto el backend esté disponible. No se mostrarán datos de prueba.'
              : 'No hay productos que coincidan con tu búsqueda o los filtros aplicados.'}
          </p>
          {!productError && (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-[#1b4332] to-vivero-primary text-vivero-mint text-xs font-extrabold rounded-xl hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5 mx-auto shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpiar filtros y búsqueda
            </button>
          )}
        </div>
      )}

      {/* Admin Modal for Creating/Editing Product */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-4 sm:p-6 shadow-2xl space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl flex-shrink-0 ${editingProduct ? 'bg-vivero-soft text-vivero-primary' : 'bg-vivero-dark text-vivero-mint'}`}>
                  {editingProduct ? <Pencil className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">{editingProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">{editingProduct ? 'Modifica la información y presiona Guardar' : 'Completa los datos del nuevo producto'}</p>
                </div>
              </div>
              <button onClick={closeProductModal} className="p-1 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-2.5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="block font-black text-red-800">{editingProduct ? 'No se pudo actualizar:' : 'No se pudo guardar:'}</span>
                    <span className="block font-normal mt-0.5">{formError}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase block mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                  placeholder="Ej. Tierra Preparada / Maceta Plástica"
                  required
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-100 rounded-xl text-[11px] sm:text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              {(newProdCategory.toLowerCase().includes('accesorio') || newProdCategory.toLowerCase().includes('insumo')) && (
                <div className="animate-in fade-in duration-150">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase block mb-1 flex items-center justify-between">
                    <span>Marca del Producto</span>
                    <span className="text-[9px] sm:text-[10px] text-amber-700 font-extrabold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">Requerido en Accesorios/Insumos</span>
                  </label>
                  <input
                    type="text"
                    value={newProdBrand}
                    onChange={e => setNewProdBrand(e.target.value)}
                    placeholder={`Ej. Tramontina, Fertiplant, Yara, ${companyName}`}
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-100 rounded-xl text-[11px] sm:text-xs font-semibold text-slate-800 focus:outline-none border border-slate-200 focus:border-vivero-primary"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* Custom Modern Category Combo */}
                <div className="relative">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase block mb-1">
                    Categoría
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoryComboOpen(!isCategoryComboOpen);
                      setIsUnitTypeComboOpen(false);
                    }}
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 hover:border-vivero-primary text-[11px] sm:text-xs font-bold text-slate-800 flex items-center justify-between shadow-2xs transition-all focus:outline-none"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-vivero-soft text-vivero-dark flex items-center justify-center flex-shrink-0 font-bold">
                        {newProdCategory.includes('Grass') ? (
                          <Sprout className="w-3 h-3 text-vivero-primary" />
                        ) : newProdCategory.includes('Planta') ? (
                          <Flower2 className="w-3 h-3 text-emerald-600" />
                        ) : newProdCategory.includes('Árbol') || newProdCategory.includes('Palmer') ? (
                          <Trees className="w-3 h-3 text-emerald-700" />
                        ) : (
                          <Package className="w-3 h-3 text-amber-600" />
                        )}
                      </div>
                      <span className="truncate">{newProdCategory}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isCategoryComboOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCategoryComboOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsCategoryComboOpen(false)} />
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl z-40 p-1 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150 max-h-48 overflow-y-auto">
                        {categoriesList.filter(c => (c as any).active !== false).map(cat => {
                          const isSelected = newProdCategory === cat.name;
                          const IconComp = cat.name.includes('Grass') ? Sprout : cat.name.includes('Planta') ? Flower2 : cat.name.includes('Árbol') || cat.name.includes('Palmer') ? Trees : Package;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setNewProdCategory(cat.name);
                                setIsCategoryComboOpen(false);
                              }}
                              className={`w-full p-1.5 rounded-xl text-left flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'bg-vivero-soft/80 border border-vivero-primary/40 text-vivero-dark shadow-2xs font-extrabold'
                                  : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                                  isSelected ? 'bg-vivero-primary text-vivero-mint' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  <IconComp className="w-3 h-3" />
                                </div>
                                <span className="text-[11px] truncate">{cat.name}</span>
                              </div>
                              {isSelected && <Check className="w-3 h-3 text-vivero-primary stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Custom Modern Unit Type Combo */}
                <div className="relative">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase block mb-1">
                    Unidad de Medida
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUnitTypeComboOpen(!isUnitTypeComboOpen);
                      setIsCategoryComboOpen(false);
                    }}
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 hover:border-vivero-primary text-[11px] sm:text-xs font-bold text-slate-800 flex items-center justify-between shadow-2xs transition-all focus:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-vivero-soft text-vivero-dark text-[10px] font-black uppercase">
                        {newProdUnitType === 'M2' ? 'm²' : 'und'}
                      </span>
                      <span>{newProdUnitType === 'M2' ? 'Metros (m²)' : 'Unidades (und)'}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isUnitTypeComboOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isUnitTypeComboOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsUnitTypeComboOpen(false)} />
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl z-40 p-1 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            setNewProdUnitType('M2');
                            setIsUnitTypeComboOpen(false);
                          }}
                          className={`w-full p-1.5 rounded-xl text-left flex items-center justify-between transition-all ${
                            newProdUnitType === 'M2'
                              ? 'bg-vivero-soft/80 border border-vivero-primary/40 text-vivero-dark font-extrabold shadow-2xs'
                              : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-vivero-primary text-vivero-mint text-[9px] font-black flex items-center justify-center">
                              m²
                            </span>
                            <div>
                              <span className="text-[11px] font-extrabold block">Metros Cuadrados (m²)</span>
                              <span className="text-[9px] text-slate-400 block font-normal">Para grass natural en rollos</span>
                            </div>
                          </div>
                          {newProdUnitType === 'M2' && <Check className="w-3 h-3 text-vivero-primary stroke-[3]" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setNewProdUnitType('UNIDAD');
                            setIsUnitTypeComboOpen(false);
                          }}
                          className={`w-full p-1.5 rounded-xl text-left flex items-center justify-between transition-all ${
                            newProdUnitType === 'UNIDAD'
                              ? 'bg-vivero-soft/80 border border-vivero-primary/40 text-vivero-dark font-extrabold shadow-2xs'
                              : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-emerald-700 text-white text-[9px] font-black flex items-center justify-center">
                              und
                            </span>
                            <div>
                              <span className="text-[11px] font-extrabold block">Unidades (und)</span>
                              <span className="text-[9px] text-slate-400 block font-normal">Para plantas, macetas e insumos</span>
                            </div>
                          </div>
                          {newProdUnitType === 'UNIDAD' && <Check className="w-3 h-3 text-vivero-primary stroke-[3]" />}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase block mb-1">Precio Venta (S/)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newProdPrice}
                    onChange={e => setNewProdPrice(e.target.value)}
                    required
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-100 rounded-xl text-[11px] sm:text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase block mb-1">
                    <span className="flex items-center gap-1.5">
                      {editingProduct ? 'Stock Actual' : 'Stock Inicial'}
                      {editingProduct && (
                        <button
                          type="button"
                          onClick={() => onGoToInventory && onGoToInventory()}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-vivero-soft border border-vivero-mint/50 text-vivero-primary text-[9px] font-extrabold uppercase hover:bg-vivero-mint/40 hover:border-vivero-primary transition-all active:scale-95"
                          title="Ir al módulo de Inventarios para gestionar el stock"
                        >
                          <Boxes className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  </label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={e => setNewProdStock(e.target.value)}
                    required
                    disabled={!!editingProduct}
                    className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold text-slate-800 focus:outline-none ${
                      editingProduct ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-100'
                    }`}
                  />
                </div>
              </div>

              {/* Dual Image Selection: File Attachment or Paste URL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase block">Imagen del Producto</label>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      title="Escanear con cámara + IA (identifica el producto automáticamente)"
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-700 flex items-center justify-center transition-all active:scale-90 shadow-sm flex-shrink-0"
                    >
                      <ScanLine className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('file')}
                      className={`px-1.5 sm:px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                        imageInputMode === 'file' ? 'bg-white text-vivero-dark shadow-sm' : 'text-slate-400'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span className="hidden sm:inline">Adjuntar Archivo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-1.5 sm:px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                        imageInputMode === 'url' ? 'bg-white text-vivero-dark shadow-sm' : 'text-slate-400'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span className="hidden sm:inline">Pegar URL</span>
                    </button>
                  </div>
                  </div>
                </div>

                {imageInputMode === 'file' ? (
                  <div className="border-2 border-dashed border-slate-200 hover:border-vivero-mint rounded-xl p-3 bg-slate-50 text-center transition-colors">
                    <input
                      type="file"
                      id="product-image-upload"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="product-image-upload"
                      className="cursor-pointer flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-vivero-primary"
                    >
                      <Upload className="w-5 h-5 text-vivero-primary" />
                      <span className="text-xs font-bold">Haz clic para adjuntar imagen desde tu dispositivo</span>
                      <span className="text-[10px] text-slate-400">PNG, JPG, WEBP (Máx. 5MB)</span>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newProdImage}
                      onChange={e => setNewProdImage(e.target.value)}
                      placeholder="https://ejemplo.com/imagen-planta.png"
                      className="flex-1 px-3 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handlePasteUrlFromClipboard}
                      className="px-3 py-2 bg-vivero-soft text-vivero-dark hover:bg-vivero-mint hover:text-vivero-dark font-extrabold text-xs rounded-xl flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      title="Pegar enlace del portapapeles"
                    >
                      <ClipboardPaste className="w-4 h-4 text-vivero-primary" />
                      <span className="text-[11px]">Pegar</span>
                    </button>
                  </div>
                )}

                {/* Preview Thumbnail or Default Mockup Indicator */}
                {newProdImage ? (
                  <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                    <img
                      src={newProdImage}
                      alt="Vista previa de la imagen cargada"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_MOCKUP_IMAGE;
                      }}
                      className="w-12 h-12 rounded-xl object-cover bg-slate-200 border border-slate-200 flex-shrink-0 shadow-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-slate-800 block truncate">
                        {newProdImage}
                      </span>
                      <span className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Imagen enlazada correctamente
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-vivero-soft/50 p-2 rounded-xl border border-vivero-soft">
                    <img
                      src={DEFAULT_MOCKUP_IMAGE}
                      alt="Mockup por defecto"
                      className="w-10 h-10 rounded-lg object-cover bg-slate-200 flex-shrink-0"
                    />
                    <span className="text-[10px] font-bold text-vivero-dark">
                      Imagen por defecto asignada automáticamente
                    </span>
                  </div>
                )}
              </div>

              {editingProduct && (
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  disabled={isSaving}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs rounded-xl border border-rose-200 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar Producto
                </button>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className={`w-full py-3 font-extrabold text-xs rounded-xl shadow-lg active:scale-95 transition-all mt-2 disabled:opacity-50 flex items-center justify-center gap-2 ${
                  editingProduct ? 'bg-vivero-primary text-white' : 'bg-[#1b4332] text-vivero-mint'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{editingProduct ? 'Actualizando en MySQL...' : 'Guardando en MySQL...'}</span>
                  </>
                ) : (
                  <>
                    {editingProduct ? <Pencil className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                    <span>{editingProduct ? 'Actualizar Producto' : 'Guardar Producto en Base de Datos'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Scanner IA Modal */}
      <ProductScannerModal
        open={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onUseResult={handleScannerResult}
      />
    </div>
  );
};
