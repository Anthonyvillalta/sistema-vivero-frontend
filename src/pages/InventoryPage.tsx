import React, { useState, useEffect } from 'react';
import { productApi, inventoryApi } from '../services/api';
import { Product, UnitType } from '../types';
import { processProductImage, processProductImageUrl } from '../utils/imageUtils';
import { LeavesLoader } from '../components/LeavesLoader';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  History,
  Sprout,
  Flower2,
  X,
  CheckCircle2,
  Upload,
  Link as LinkIcon,
  ClipboardPaste,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface MovementRecord {
  id: number;
  productName: string;
  unitType: 'M2' | 'UNIDAD';
  type: 'ENTRADA' | 'SALIDA' | 'MERMA' | 'RESERVA' | 'LIBERAR_RESERVA' | 'AJUSTE';
  quantity: number;
  prevStock: number;
  newStock: number;
  reason: string;
  timestamp: string;
  user: string;
}

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'grass' | 'plantas'>('todos');

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await productApi.getAllProducts();
      if (res.data) setProducts(res.data);
    } catch (err) {
      console.error('Error al cargar inventario desde MySQL:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchMovements = async () => {
    try {
      const res = await inventoryApi.getRecentMovements();
      if (res.data && res.data.length > 0) {
        const mapped: MovementRecord[] = res.data.map((m: any) => ({
          id: m.id,
          productName: m.productName,
          unitType: m.unitType === 'M2' ? 'M2' : 'UNIDAD',
          type: m.movementType,
          quantity: m.quantity,
          prevStock: m.previousStock,
          newStock: m.newStock,
          reason: m.reason || 'Ajuste de inventario',
          timestamp: m.createdAt ? new Date(m.createdAt).toLocaleString('es-PE') : 'Reciente',
          user: m.createdBy || 'Admin'
        }));
        setMovements(mapped);
      }
    } catch (err) {
      console.error('Error al cargar movimientos kardex desde MySQL:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchMovements();

    const handleUpdate = () => {
      fetchProducts();
      fetchMovements();
    };

    window.addEventListener('vivero_products_updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    window.addEventListener('vivero_backend_online', handleUpdate);

    return () => {
      window.removeEventListener('vivero_products_updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      window.removeEventListener('vivero_backend_online', handleUpdate);
    };
  }, []);

  // Audit Kardex Movement Log State
  const [movements, setMovements] = useState<MovementRecord[]>([]);

  // Modal States
  const [selectedProductForAdjustment, setSelectedProductForAdjustment] = useState<Product | null>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);

  // Product History Modal State
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);
  const [productHistoryMovements, setProductHistoryMovements] = useState<MovementRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyFilterTab, setHistoryFilterTab] = useState<'TODOS' | 'ENTRADA' | 'SALIDA' | 'RESERVA' | 'LIBERAR_RESERVA' | 'MERMA' | 'AJUSTE'>('TODOS');

  // Stock Adjustment Form State
  const [adjustType, setAdjustType] = useState<'ENTRADA' | 'SALIDA' | 'MERMA' | 'RESERVA' | 'LIBERAR_RESERVA' | 'AJUSTE'>('ENTRADA');
  const [adjustQuantity, setAdjustQuantity] = useState<string>('50');
  const [adjustReason, setAdjustReason] = useState<string>('Abastecimiento de cosecha de vivero');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState<boolean>(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Edit Product Form State
  const [editName, setEditName] = useState<string>('');
  const [editUnitType, setEditUnitType] = useState<UnitType>('UNIDAD');
  const [editPrice, setEditPrice] = useState<string>('');
  const [editMinStock, setEditMinStock] = useState<string>('');
  const [editVariety, setEditVariety] = useState<string>('');
  const [editBrand, setEditBrand] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editImage, setEditImage] = useState<string>('');
  const [editImageInputMode, setEditImageInputMode] = useState<'file' | 'url'>('file');

  const handleEditImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const processed = await processProductImage(file);
      setEditImage(processed);
    }
  };

  const handleEditPasteUrlFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setEditImage(await processProductImageUrl(text.trim()));
        setEditImageInputMode('url');
      } else {
        const fallback = prompt('Pega aquí el enlace (URL) de la imagen:');
        if (fallback) {
          setEditImage(await processProductImageUrl(fallback.trim()));
          setEditImageInputMode('url');
        }
      }
    } catch (err) {
      const fallback = prompt('Pega aquí el enlace (URL) de la imagen:');
      if (fallback) {
        setEditImage(await processProductImageUrl(fallback.trim()));
        setEditImageInputMode('url');
      }
    }
  };

  // Calculations for Metrics
  const totalGrassM2 = products
    .filter(p => p.unitType === 'M2')
    .reduce((sum, p) => sum + p.stock, 0);

  const totalPlantUnits = products
    .filter(p => p.unitType === 'UNIDAD')
    .reduce((sum, p) => sum + p.stock, 0);

  const criticalStockCount = products.filter(p => p.availableStock <= p.minStock).length;

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const query = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(query) || p.categoryName.toLowerCase().includes(query) || p.code.toLowerCase().includes(query);
    if (activeTab === 'todos') return matchesSearch;
    if (activeTab === 'grass') return matchesSearch && p.unitType === 'M2';
    if (activeTab === 'plantas') return matchesSearch && p.unitType === 'UNIDAD';
    return matchesSearch;
  });

  // Handle Manual Stock Adjustment
  const handleApplyStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjustment) return;

    const qty = parseInt(adjustQuantity, 10) || 0;
    if (qty <= 0) {
      setAdjustError('Ingresa una cantidad entera válida mayor a 0 (ej. 1, 2, 3, 5, 10).');
      return;
    }

    setIsSubmittingAdjust(true);
    setAdjustError(null);

    const prod = selectedProductForAdjustment;

    try {
      // Send adjustment request to MySQL Inventory Endpoint
      await inventoryApi.adjustStock({
        productId: prod.id,
        movementType: adjustType,
        quantity: qty,
        reason: adjustReason.trim() || 'Ajuste manual de inventario'
      });

      // Reload products & kardex movements from MySQL
      await Promise.all([fetchProducts(), fetchMovements()]);

      window.dispatchEvent(new CustomEvent('vivero_products_updated'));

      setSelectedProductForAdjustment(null);
      setAdjustReason('');
      setAdjustQuantity('50');
    } catch (err: any) {
      console.error('Error al actualizar inventario en MySQL:', err);

      let msg = 'No se pudo guardar el ajuste de stock en la base de datos MySQL.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = err.message;
      }
      setAdjustError(msg);

      // Fallback local update if offline
      let newStock = prod.stock;
      let newReserved = prod.reservedStock || 0;

      if (adjustType === 'ENTRADA') {
        newStock += qty;
      } else if (adjustType === 'SALIDA' || adjustType === 'MERMA') {
        newStock = Math.max(0, newStock - qty);
      } else if (adjustType === 'RESERVA') {
        newReserved += qty;
      } else if (adjustType === 'LIBERAR_RESERVA') {
        newReserved = Math.max(0, newReserved - qty);
      } else if (adjustType === 'AJUSTE') {
        newStock = qty;
      }

      const updatedProduct: Product = {
        ...prod,
        stock: newStock,
        reservedStock: newReserved,
        availableStock: Math.max(0, newStock - newReserved)
      };

      setProducts(prev => prev.map(p => p.id === prod.id ? updatedProduct : p));

      window.dispatchEvent(new CustomEvent('vivero_products_updated'));

      const newRecord: MovementRecord = {
        id: Date.now(),
        productName: prod.name,
        unitType: prod.unitType,
        type: adjustType,
        quantity: qty,
        prevStock: prod.availableStock,
        newStock: updatedProduct.availableStock,
        reason: adjustReason || 'Ajuste manual de inventario',
        timestamp: new Date().toLocaleString('es-PE'),
        user: 'Admin'
      };

      setMovements(prev => [newRecord, ...prev]);
      setSelectedProductForAdjustment(null);
      setAdjustReason('');
      setAdjustQuantity('50');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Handle Product Info Edit
  const handleApplyProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForEdit) return;

    const prod = selectedProductForEdit;
    const priceNum = parseFloat(editPrice) || prod.price;
    const minStockNum = parseFloat(editMinStock) || prod.minStock;

    try {
      await productApi.updateProduct(prod.id, {
        code: prod.code,
        name: editName.trim() || prod.name,
        variety: editVariety || prod.variety,
        brand: editBrand || prod.brand,
        description: editDescription || prod.description,
        categoryId: prod.categoryId,
        unitType: editUnitType,
        price: priceNum,
        originalPrice: prod.originalPrice,
        discountPercentage: prod.discountPercentage,
        costPrice: prod.costPrice,
        stock: prod.stock,
        minStock: minStockNum,
        imageUrl: editImage.trim() || prod.imageUrl
      });
      await fetchProducts();
      setSelectedProductForEdit(null);
    } catch (err) {
      console.error('Error al actualizar producto en MySQL:', err);
      alert('No se pudo guardar la edición del producto en la base de datos.');
    }
  };

  const openEditModal = (p: Product) => {
    setSelectedProductForEdit(p);
    setEditName(p.name);
    setEditUnitType(p.unitType || 'UNIDAD');
    setEditPrice(p.price.toString());
    setEditMinStock(p.minStock.toString());
    setEditVariety(p.variety || '');
    setEditBrand(p.brand || '');
    setEditDescription(p.description || '');
    setEditImage(p.imageUrl || '');
    setEditImageInputMode('file');
  };

  const openProductHistoryModal = async (prod: Product) => {
    setSelectedProductForHistory(prod);
    setLoadingHistory(true);
    setHistorySearch('');
    setHistoryFilterTab('TODOS');

    try {
      const res = await inventoryApi.getMovementsByProduct(prod.id);
      if (res.data && res.data.length > 0) {
        const mapped: MovementRecord[] = res.data.map((m: any) => ({
          id: m.id,
          productName: m.productName || prod.name,
          unitType: m.unitType === 'M2' ? 'M2' : 'UNIDAD',
          type: m.movementType,
          quantity: m.quantity,
          prevStock: m.previousStock,
          newStock: m.newStock,
          reason: m.reason || 'Movimiento de inventario',
          timestamp: m.createdAt ? new Date(m.createdAt).toLocaleString('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'Reciente',
          user: m.createdBy || 'Admin'
        }));
        setProductHistoryMovements(mapped);
      } else {
        const filtered = movements.filter(m =>
          m.productName.toLowerCase().includes(prod.name.toLowerCase())
        );
        setProductHistoryMovements(filtered);
      }
    } catch (err) {
      console.error('Error al cargar historial del producto:', err);
      const filtered = movements.filter(m =>
        m.productName.toLowerCase().includes(prod.name.toLowerCase())
      );
      setProductHistoryMovements(filtered);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredHistoryMovements = productHistoryMovements.filter(m => {
    const query = historySearch.toLowerCase().trim();
    const matchesSearch =
      !query ||
      m.reason.toLowerCase().includes(query) ||
      m.user.toLowerCase().includes(query) ||
      m.type.toLowerCase().includes(query) ||
      m.timestamp.toLowerCase().includes(query);

    if (historyFilterTab === 'TODOS') return matchesSearch;
    return matchesSearch && m.type === historyFilterTab;
  });

  return (
    <div className="space-y-3.5 pb-24 lg:pb-8">
      {/* Mobile Stats Banner */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
        <div className="bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] rounded-2xl p-2.5 sm:p-3.5 text-white shadow-xl flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <p className="text-sm sm:text-xl font-black text-white leading-none truncate">
              {totalGrassM2.toLocaleString('es-PE')} m²
            </p>
            <p className="text-[8px] sm:text-[10px] font-extrabold text-vivero-mint uppercase tracking-wide truncate">
              Grass en stock
            </p>
            <p className="hidden sm:block text-[10px] text-emerald-200">En vivero listos para despacho</p>
          </div>
          <div className="hidden sm:flex w-8 h-8 rounded-xl bg-vivero-soft text-vivero-dark items-center justify-center font-bold">
            <Sprout className="w-4 h-4 text-vivero-primary" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-2.5 sm:p-3.5 border border-slate-200/80 shadow-card flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <p className="text-sm sm:text-xl font-black text-slate-800 leading-none truncate">
              {totalPlantUnits.toLocaleString('es-PE')} und
            </p>
            <p className="text-[8px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wide truncate">
              Plantas
            </p>
            <p className="hidden sm:block text-[10px] text-slate-400">Unidades en maceta y bolsas</p>
          </div>
          <div className="hidden sm:flex w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 items-center justify-center font-bold">
            <Flower2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-2.5 sm:p-3.5 border border-slate-200/80 shadow-card flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <p className="text-sm sm:text-xl font-black text-amber-600 leading-none truncate">
              {criticalStockCount} prod.
            </p>
            <p className="text-[8px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wide truncate">
              Crítico
            </p>
            <p className="hidden sm:block text-[10px] text-slate-400">Requieren cosecha o reabastecimiento</p>
          </div>
          <div className="hidden sm:flex w-8 h-8 rounded-xl bg-amber-50 text-amber-600 items-center justify-center font-bold">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Tabs & Search Navigation Bar */}
      <div className="bg-white p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-card space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por producto o código..."
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

        {/* Category Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-100 pt-2.5">
          {[
            { id: 'todos', label: 'Todos', icon: Boxes },
            { id: 'grass', label: 'Grass (m²)', icon: Sprout },
            { id: 'plantas', label: 'Plantas (und)', icon: Flower2 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap flex items-center gap-1 transition-all ${
                  isActive
                    ? 'bg-[#1b4332] text-vivero-mint shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main View: Products Inventory List */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-lg bg-vivero-soft text-vivero-primary flex items-center justify-center">
              <Boxes className="w-3.5 h-3.5" />
            </span>
            Stock Inteligente
          </h3>
          <span className="px-2 py-0.5 bg-white border border-slate-200/80 rounded-full text-[10px] font-extrabold text-slate-500">
            {filteredProducts.length} ítems
          </span>
        </div>

        {loadingProducts ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3.5 flex items-center gap-3 animate-pulse">
                <div className="w-11 h-11 rounded-xl bg-slate-200 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-2.5 bg-slate-200 rounded w-2/3" />
                  <div className="h-2 bg-slate-200 rounded w-1/2" />
                  <div className="h-2 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center space-y-2 p-6">
            <div className="w-14 h-14 rounded-2xl bg-vivero-soft text-vivero-primary flex items-center justify-center mx-auto">
              <Boxes className="w-7 h-7" />
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-slate-800">No hay productos que coincidan</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto font-medium">
              {search
                ? 'Ningún producto coincide con tu búsqueda. Prueba con otro nombre o código.'
                : 'Aún no hay productos registrados en el inventario.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-1 px-4 py-2 bg-[#1b4332] text-vivero-mint font-extrabold text-xs rounded-xl shadow-md active:scale-95 transition-all"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProducts.map(p => {
              const isLow = p.availableStock <= p.minStock;
              const isM2 = p.unitType === 'M2';

              return (
                <div key={p.id} className="p-3 sm:p-3.5">
                  {/* Top Row: Image + Info + Disponible Chip (mobile) */}
                  <div className="flex items-center gap-2.5">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl object-contain p-0.5 bg-slate-100 flex-shrink-0 border border-slate-200/60"
                    />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm break-words leading-snug">
                          {p.name}
                        </h4>
                        <span className="px-1.5 py-0.5 bg-vivero-soft text-[#1b4332] text-[9px] font-black uppercase rounded-md flex-shrink-0">
                          {isM2 ? 'm²' : 'und'}
                        </span>
                        {p.brand && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[9px] font-extrabold uppercase rounded-md border border-amber-200 flex-shrink-0">
                            Marca: {p.brand}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold truncate">
                        {p.categoryName} • S/ {p.price.toFixed(2)} /{isM2 ? 'm²' : 'und'}
                      </p>
                      {isLow ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                          <AlertTriangle className="w-3 h-3" />
                          Stock bajo (mín. {p.minStock} {isM2 ? 'm²' : 'und'})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          Disponible para la venta
                        </span>
                      )}
                    </div>

                    {/* Mobile: Disponible Big Number */}
                    <div className="sm:hidden flex flex-col items-end gap-0.5 flex-shrink-0">
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wide">Disp.</span>
                      <span className={`text-base font-black leading-none ${isLow ? 'text-rose-600' : 'text-[#1b4332]'}`}>
                        {p.availableStock}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400">{isM2 ? 'm²' : 'und'}</span>
                    </div>
                  </div>

                  {/* Mobile: Stock Breakdown + Action Buttons */}
                  <div className="sm:hidden mt-2.5 space-y-2">
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="bg-slate-50 rounded-lg py-1 px-1 border border-slate-100/80">
                        <span className="block text-[8px] font-extrabold text-slate-400 uppercase">Total</span>
                        <span className="text-[10px] font-black text-slate-700">{p.stock} {isM2 ? 'm²' : 'und'}</span>
                      </div>
                      <div className="bg-purple-50/70 rounded-lg py-1 px-1 border border-purple-100/80">
                        <span className="block text-[8px] font-extrabold text-purple-600 uppercase">Reservado</span>
                        <span className="text-[10px] font-black text-purple-800">{p.reservedStock} {isM2 ? 'm²' : 'und'}</span>
                      </div>
                      <div className="bg-emerald-50/70 rounded-lg py-1 px-1 border border-emerald-100/80">
                        <span className="block text-[8px] font-extrabold text-emerald-700 uppercase">Disp.</span>
                        <span className={`text-[10px] font-black ${isLow ? 'text-rose-600' : 'text-[#1b4332]'}`}>
                          {p.availableStock} {isM2 ? 'm²' : 'und'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => openProductHistoryModal(p)}
                        className="py-1.5 rounded-lg bg-slate-100 hover:bg-vivero-soft text-slate-700 hover:text-vivero-primary font-extrabold text-[10px] transition-all active:scale-95 flex items-center justify-center gap-1 border border-slate-200/60"
                        title="Ver Kardex de Movimientos de este Producto"
                      >
                        <History className="w-3 h-3 text-vivero-primary" />
                        <span>Kardex</span>
                      </button>

                      <button
                        onClick={() => setSelectedProductForAdjustment(p)}
                        className="py-1.5 rounded-lg bg-vivero-soft hover:bg-vivero-mint text-vivero-dark font-extrabold text-[10px] transition-all active:scale-95 flex items-center justify-center gap-0.5"
                        title="Ajustar Stock"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Ajustar</span>
                      </button>

                      <button
                        onClick={() => openEditModal(p)}
                        className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all active:scale-95 flex items-center justify-center gap-1"
                        title="Editar Producto"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span className="text-[10px] font-extrabold">Editar</span>
                      </button>
                    </div>
                  </div>

                  {/* Desktop: Stock Indicators + Actions */}
                  <div className="hidden sm:flex items-center justify-between gap-3 mt-2.5 sm:mt-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100">
                    <div className="grid grid-cols-3 gap-2.5 text-center sm:text-right">
                      <div>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Total</span>
                        <span className="text-xs font-black text-slate-800">{p.stock} {isM2 ? 'm²' : 'und'}</span>
                      </div>

                      <div>
                        <span className="text-[9px] font-extrabold text-amber-600 uppercase block">Res.</span>
                        <span className="text-xs font-bold text-amber-700">{p.reservedStock} {isM2 ? 'm²' : 'und'}</span>
                      </div>

                      <div>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Disp.</span>
                        <span className={`text-xs font-black ${isLow ? 'text-red-500' : 'text-vivero-primary'}`}>
                          {p.availableStock} {isM2 ? 'm²' : 'und'}
                        </span>
                      </div>
                    </div>

                    {/* Actions: Adjust Stock, History & Edit Info */}
                    <div className="flex items-center gap-1 pl-1">
                      <button
                        onClick={() => openProductHistoryModal(p)}
                        className="py-1 px-2 bg-slate-100 hover:bg-vivero-soft text-slate-700 hover:text-vivero-primary font-extrabold text-[10px] rounded-lg transition-all active:scale-95 flex items-center gap-1 border border-slate-200/60"
                        title="Ver Kardex de Movimientos de este Producto"
                      >
                        <History className="w-3 h-3 text-vivero-primary" />
                        <span>Kardex</span>
                      </button>

                      <button
                        onClick={() => setSelectedProductForAdjustment(p)}
                        className="py-1 px-2 bg-vivero-soft hover:bg-vivero-mint text-vivero-dark font-extrabold text-[10px] rounded-lg transition-all active:scale-95 flex items-center gap-0.5"
                        title="Ajustar Stock"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Ajustar</span>
                      </button>

                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                        title="Editar Producto"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal 1: Stock Adjustment / Harvest / Discharge / Reservation */}
      {selectedProductForAdjustment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">
                  Movimiento / Ajuste de Inventario
                </h3>
                <p className="text-[11px] text-vivero-primary font-extrabold">
                  {selectedProductForAdjustment.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedProductForAdjustment(null);
                  setAdjustError(null);
                }}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyStockAdjustment} className="space-y-3">
              {/* Product Stock Breakdown Banner */}
              <div className="bg-slate-50/90 p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2.5">
                  {selectedProductForAdjustment.imageUrl ? (
                    <img src={selectedProductForAdjustment.imageUrl} alt="" className="w-9 h-9 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-vivero-soft text-vivero-dark flex items-center justify-center font-bold">
                      <Sprout className="w-4 h-4 text-vivero-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-xs text-slate-800 truncate">{selectedProductForAdjustment.name}</h4>
                    <p className="text-[10px] font-semibold text-slate-400 truncate">
                      Cat: {selectedProductForAdjustment.categoryName} • Tipo: {selectedProductForAdjustment.unitType === 'M2' ? 'Metro cuadrado (m²)' : 'Unidad (und)'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-200/60 text-center">
                  <div className="bg-white p-1.5 rounded-xl border border-slate-100 shadow-2xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Físico</span>
                    <strong className="text-xs font-black text-slate-800">
                      {selectedProductForAdjustment.stock} {selectedProductForAdjustment.unitType === 'M2' ? 'm²' : 'und'}
                    </strong>
                  </div>
                  <div className="bg-purple-50/80 p-1.5 rounded-xl border border-purple-100 shadow-2xs">
                    <span className="text-[9px] font-bold text-purple-600 uppercase block">Reservado 🔒</span>
                    <strong className="text-xs font-black text-purple-800">
                      {selectedProductForAdjustment.reservedStock || 0} {selectedProductForAdjustment.unitType === 'M2' ? 'm²' : 'und'}
                    </strong>
                  </div>
                  <div className="bg-emerald-50/80 p-1.5 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="text-[9px] font-bold text-emerald-700 uppercase block">Disponible ✨</span>
                    <strong className="text-xs font-black text-[#1b4332]">
                      {selectedProductForAdjustment.availableStock} {selectedProductForAdjustment.unitType === 'M2' ? 'm²' : 'und'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Movement Type Tabs */}
              <div>
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Tipo de Movimiento
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-center">
                  {[
                    { id: 'ENTRADA', label: '📦 Entrada' },
                    { id: 'SALIDA', label: '📤 Salida' },
                    { id: 'MERMA', label: '✂️ Merma' },
                    { id: 'RESERVA', label: '🔒 Reserva' },
                    { id: 'LIBERAR_RESERVA', label: '🔓 Liberar' },
                    { id: 'AJUSTE', label: '⚖️ Ajuste' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setAdjustType(t.id as any);
                        setAdjustError(null);
                      }}
                      className={`p-1.5 rounded-xl text-[10px] font-extrabold border transition-all ${
                        adjustType === t.id
                          ? 'bg-[#1b4332] text-vivero-mint border-vivero-mint/50 shadow-md'
                          : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Action Explanation Banner */}
              <div className="p-2.5 rounded-xl text-[11px] font-semibold bg-slate-100/90 text-slate-700 border border-slate-200/70 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-vivero-primary flex-shrink-0" />
                <span className="leading-tight">
                  {adjustType === 'RESERVA' && 'Incrementa el stock reservado para un pedido/proyecto y descuenta del disponible.'}
                  {adjustType === 'LIBERAR_RESERVA' && 'Libera stock previamente reservado. Descuenta del stock reservado y vuelve a habilitarlo para la venta inmediata.'}
                  {adjustType === 'ENTRADA' && 'Suma unidades al inventario físico por cosecha de vivero o compra.'}
                  {adjustType === 'SALIDA' && 'Resta unidades del inventario físico por venta directa o despacho.'}
                  {adjustType === 'MERMA' && 'Resta unidades por pérdidas, plantas secas o descarte de corte.'}
                  {adjustType === 'AJUSTE' && 'Establece el stock físico exacto según el conteo real en vivero.'}
                </span>
              </div>

              {/* Error Banner */}
              {adjustError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{adjustError}</span>
                </div>
              )}

              {/* Quantity Input */}
              <div>
                <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">
                  Cantidad Entera ({selectedProductForAdjustment.unitType === 'M2' ? 'm²' : 'unidades'})
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={adjustQuantity}
                  onChange={e => setAdjustQuantity(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Ej. 10"
                  required
                  className="w-full px-3 py-2 bg-slate-100 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-vivero-mint/50"
                />
              </div>

              {/* Reason Input */}
              <div>
                <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">
                  Motivo / Observación
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="Ej. Reserva Proyecto Paisajismo San Isidro"
                  required
                  className="w-full px-3 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-vivero-mint/50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingAdjust}
                className="w-full py-2.5 bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint font-extrabold text-xs rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {isSubmittingAdjust ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando movimiento...</span>
                  </>
                ) : (
                  <span>Confirmar Movimiento de Inventario</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Product Data */}
      {selectedProductForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">
                  Editar Datos de Producto
                </h3>
                <p className="text-[11px] text-vivero-primary font-extrabold">
                  {selectedProductForEdit.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedProductForEdit(null)}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyProductEdit} className="space-y-2.5">
              <div>
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Nombre del producto"
                  required
                  className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-800 focus:outline-none border border-slate-200 focus:border-vivero-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">
                    Precio Venta (S/)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    value={editMinStock}
                    onChange={e => setEditMinStock(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">
                  Unidad de Medida
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setEditUnitType('M2')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      editUnitType === 'M2'
                        ? 'bg-[#1b4332] text-vivero-mint shadow-xs font-black'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    <span>Metros (m²)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditUnitType('UNIDAD')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      editUnitType === 'UNIDAD'
                        ? 'bg-emerald-800 text-white shadow-xs font-black'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    <span>Unidades (und)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">
                  Variedad / Especificación
                </label>
                <input
                  type="text"
                  value={editVariety}
                  onChange={e => setEditVariety(e.target.value)}
                  placeholder="Ej. Hoja fina / Areca Lutescens"
                  className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              {(selectedProductForEdit?.categoryName?.toLowerCase().includes('accesorio') || selectedProductForEdit?.categoryName?.toLowerCase().includes('insumo')) && (
                <div className="animate-in fade-in duration-150">
                  <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5 flex items-center justify-between">
                    <span>Marca del Producto</span>
                    <span className="text-[8px] text-amber-700 font-extrabold bg-amber-50 px-1 py-0.2 rounded border border-amber-200">Accesorios / Insumos</span>
                  </label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={e => setEditBrand(e.target.value)}
                    placeholder="Ej. Tramontina, Fertiplant, Yara, etc."
                    className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none border border-slate-200 focus:border-vivero-primary"
                  />
                </div>
              )}

              <div>
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">
                  Descripción Corta
                </label>
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              {/* Image Update Field: File Upload or Paste URL */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-extrabold text-slate-600 uppercase block">
                    Actualizar Imagen del Producto
                  </label>
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditImageInputMode('file')}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold flex items-center gap-1 transition-all ${
                        editImageInputMode === 'file' ? 'bg-white text-vivero-dark shadow-xs' : 'text-slate-400'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>Adjuntar Archivo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditImageInputMode('url')}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold flex items-center gap-1 transition-all ${
                        editImageInputMode === 'url' ? 'bg-white text-vivero-dark shadow-xs' : 'text-slate-400'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>Pegar URL</span>
                    </button>
                  </div>
                </div>

                {editImageInputMode === 'file' ? (
                  <div className="border border-dashed border-slate-300 hover:border-vivero-mint rounded-xl p-2 bg-slate-50 text-center transition-colors">
                    <input
                      type="file"
                      id="edit-product-image-upload"
                      accept="image/*"
                      onChange={handleEditImageFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="edit-product-image-upload"
                      className="cursor-pointer flex items-center justify-center gap-1.5 text-slate-600 hover:text-vivero-primary"
                    >
                      <Upload className="w-4 h-4 text-vivero-primary" />
                      <span className="text-[11px] font-extrabold">Seleccionar nueva foto desde dispositivo</span>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editImage}
                      onChange={e => setEditImage(e.target.value)}
                      placeholder="https://ejemplo.com/planta.jpg"
                      className="flex-1 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleEditPasteUrlFromClipboard}
                      className="px-2.5 py-1.5 bg-vivero-soft text-vivero-dark font-extrabold text-[10px] rounded-xl flex items-center gap-1 transition-all shadow-xs"
                      title="Pegar enlace del portapapeles"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5 text-vivero-primary" />
                      <span>Pegar</span>
                    </button>
                  </div>
                )}

                {/* Preview Thumbnail */}
                {editImage && (
                  <div className="flex items-center gap-2.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <img
                      src={editImage}
                      alt="Vista previa de producto"
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-lg object-cover bg-slate-200 flex-shrink-0"
                    />
                    <span className="text-[10px] font-bold text-emerald-700 truncate flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Imagen asignada correctamente
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#1b4332] text-vivero-mint font-extrabold text-xs rounded-xl shadow-lg active:scale-95 transition-all mt-1"
              >
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Product Action & Movement History (Kardex) Modal */}
      {selectedProductForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#1b4332] text-white flex items-center justify-between flex-shrink-0 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                {selectedProductForHistory.imageUrl ? (
                  <img
                    src={selectedProductForHistory.imageUrl}
                    alt=""
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-vivero-mint/50 bg-white shadow-md flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-vivero-soft text-vivero-dark flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                    <Sprout className="w-7 h-7 text-vivero-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-sm sm:text-lg text-white leading-tight">
                      Kardex de Inventario
                    </h3>
                    <span className="px-2.5 py-0.5 bg-vivero-mint text-vivero-dark text-[10px] font-black uppercase rounded-full shadow-2xs">
                      {selectedProductForHistory.unitType === 'M2' ? 'Grass (m²)' : 'Planta (und)'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-100 font-extrabold truncate mt-0.5">
                    {selectedProductForHistory.name}
                  </p>
                  <p className="text-[10px] text-emerald-200/90 font-medium">
                    Código: <strong className="text-white font-extrabold">{selectedProductForHistory.code}</strong> • Categoría: <strong className="text-white font-extrabold">{selectedProductForHistory.categoryName}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedProductForHistory(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 flex-shrink-0 ml-2"
                title="Cerrar Kardex"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Status Metrics Banner */}
            <div className="bg-slate-50 border-b border-slate-200/80 p-2.5 sm:p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center flex-shrink-0">
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200/70 shadow-2xs">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Precio Venta</span>
                <strong className="text-xs sm:text-sm font-black text-slate-800">S/ {selectedProductForHistory.price.toFixed(2)}</strong>
              </div>
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200/70 shadow-2xs">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Stock Total Físico</span>
                <strong className="text-xs sm:text-sm font-black text-slate-800">
                  {selectedProductForHistory.stock} {selectedProductForHistory.unitType === 'M2' ? 'm²' : 'und'}
                </strong>
              </div>
              <div className="bg-purple-50/90 p-2.5 rounded-2xl border border-purple-100 shadow-2xs">
                <span className="text-[9px] font-extrabold text-purple-700 uppercase tracking-wider block">Reservado 🔒</span>
                <strong className="text-xs sm:text-sm font-black text-purple-900">
                  {selectedProductForHistory.reservedStock || 0} {selectedProductForHistory.unitType === 'M2' ? 'm²' : 'und'}
                </strong>
              </div>
              <div className="bg-emerald-50/90 p-2.5 rounded-2xl border border-emerald-100 shadow-2xs">
                <span className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-wider block">Disponible ✨</span>
                <strong className="text-xs sm:text-sm font-black text-[#1b4332]">
                  {selectedProductForHistory.availableStock} {selectedProductForHistory.unitType === 'M2' ? 'm²' : 'und'}
                </strong>
              </div>
            </div>

            {/* Search & Filter Controls Bar */}
            <div className="p-3 border-b border-slate-100 space-y-2 bg-white flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    placeholder="Buscar por motivo, usuario, n° de boleta o fecha..."
                    className="w-full pl-8 pr-8 py-1.5 bg-slate-100 focus:bg-white text-xs font-semibold text-slate-800 rounded-xl border border-transparent focus:border-vivero-mint/60 focus:outline-none transition-all"
                  />
                  {historySearch && (
                    <button
                      onClick={() => setHistorySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="text-[11px] font-extrabold text-slate-500 whitespace-nowrap text-right">
                  Mostrando <strong className="text-[#1b4332] font-black">{filteredHistoryMovements.length}</strong> movimientos Kardex
                </div>
              </div>

              {/* Movement Type Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                {[
                  { id: 'TODOS', label: 'Todos los estados' },
                  { id: 'ENTRADA', label: '📦 Entradas / Cosecha' },
                  { id: 'SALIDA', label: '📤 Salidas / Ventas' },
                  { id: 'RESERVA', label: '🔒 Reservas' },
                  { id: 'MERMA', label: '✂️ Mermas' },
                  { id: 'AJUSTE', label: '⚖️ Ajustes Físicos' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setHistoryFilterTab(tab.id as any)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-extrabold whitespace-nowrap transition-all ${
                      historyFilterTab === tab.id
                        ? 'bg-[#1b4332] text-vivero-mint shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kardex Movements Timeline List */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-2.5 bg-slate-50/60">
              {loadingHistory ? (
                <LeavesLoader compact message="Cargando trazabilidad Kardex desde MySQL..." />
              ) : filteredHistoryMovements.length === 0 ? (
                <div className="py-12 text-center space-y-2 bg-white rounded-2xl border border-slate-200/80 p-6">
                  <History className="w-9 h-9 text-slate-300 mx-auto" />
                  <p className="text-xs sm:text-sm font-extrabold text-slate-800">No hay movimientos registrados en este filtro</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto font-medium">
                    {historySearch || historyFilterTab !== 'TODOS'
                      ? 'No existen registros Kardex que coincidan con los términos o filtros aplicados.'
                      : 'Aún no se han realizado movimientos de entrada, salida o reserva para este producto.'}
                  </p>
                </div>
              ) : (
                filteredHistoryMovements.map(m => {
                  const isEntrada = m.type === 'ENTRADA';
                  const isSalida = m.type === 'SALIDA';
                  const isReserva = m.type === 'RESERVA';
                  const isMerma = m.type === 'MERMA';
                  const isAjuste = m.type === 'AJUSTE';

                  const estimatedValue = m.quantity * (selectedProductForHistory?.price || 0);

                  return (
                    <div
                      key={m.id}
                      className="p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-card transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Left: Icon & Movement Main Details */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 shadow-2xs ${
                            isEntrada ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            isSalida ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                            isReserva ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            isMerma ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {isEntrada ? '📦' : isSalida ? '📤' : isReserva ? '🔒' : isMerma ? '✂️' : '⚖️'}
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 text-[9px] font-black rounded-md uppercase tracking-wider ${
                                isEntrada ? 'bg-emerald-100 text-emerald-800' :
                                isSalida ? 'bg-rose-100 text-rose-800' :
                                isReserva ? 'bg-purple-100 text-purple-800' :
                                isMerma ? 'bg-amber-100 text-amber-800' :
                                'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {m.type === 'ENTRADA' ? 'ENTRADA / COSECHA' :
                               m.type === 'SALIDA' ? 'SALIDA / VENTA' :
                               m.type === 'RESERVA' ? 'RESERVA' :
                               m.type === 'MERMA' ? 'MERMA' : 'AJUSTE MANUAL'}
                            </span>

                            <h5 className="text-xs sm:text-sm font-extrabold text-slate-800 leading-snug truncate">
                              {m.reason}
                            </h5>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 font-semibold pt-0.5">
                            <span className="flex items-center gap-1">
                              📅 {m.timestamp}
                            </span>
                            <span className="flex items-center gap-1">
                              👤 Realizado por: <strong className="text-slate-800 font-extrabold">{m.user}</strong>
                            </span>
                            {estimatedValue > 0 && (
                              <span className="flex items-center gap-1 text-emerald-800 font-extrabold">
                                💰 S/ {estimatedValue.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Quantity & Stock Progression */}
                      <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 flex sm:flex-col items-center sm:items-end justify-between gap-1 flex-shrink-0">
                        <span className={`text-xs sm:text-sm font-black ${
                          isEntrada ? 'text-emerald-700' :
                          isSalida ? 'text-rose-600' :
                          isReserva ? 'text-purple-700' :
                          isMerma ? 'text-amber-700' : 'text-blue-700'
                        }`}>
                          {isEntrada ? '+' : isSalida || isMerma ? '-' : ''}{m.quantity} {m.unitType === 'M2' ? 'm²' : 'und'}
                        </span>

                        <div className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200/60 shadow-2xs">
                          Stock Físico: {m.prevStock} ➔ <strong className="text-[#1b4332] font-black">{m.newStock}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between flex-shrink-0">
              <p className="text-[10px] font-extrabold text-slate-400">
                Auditoría Kardex en tiempo real de trazabilidad de inventario
              </p>
              <button
                onClick={() => setSelectedProductForHistory(null)}
                className="py-1.5 px-4 bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                Cerrar Kardex
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
