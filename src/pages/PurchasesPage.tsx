import React, { useState, useEffect, useRef } from 'react';
import { Purchase, Supplier, Product } from '../types';
import { purchaseApi, supplierApi, productApi } from '../services/api';
import { LeavesLoader } from '../components/LeavesLoader';
import { useCompanySettings } from '../context/CompanyContext';
import {
  Receipt,
  Sprout,
  Flower2,
  Plus,
  Search,
  X,
  Loader2,
  AlertCircle,
  Printer,
  Truck,
  MapPin,
  CheckCircle2,
  ChevronDown,
  Phone
} from 'lucide-react';

interface ComboOption {
  id: number;
  title: string;
  subtitle?: string;
  avatarClass?: string;
}

const ModernCombo = ({
  value,
  options,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...'
}: {
  value: number;
  options: ComboOption[];
  onChange: (id: number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o =>
    `${o.title} ${o.subtitle || ''}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen(prev => !prev);
          setQuery('');
        }}
        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${
          open
            ? 'bg-white border border-vivero-mint/60 shadow-xs'
            : 'bg-slate-100 border border-transparent'
        }`}
      >
        {selected ? (
          <>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-vivero-mint font-black text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
              {selected.title.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-extrabold text-slate-800 truncate">{selected.title}</span>
              {selected.subtitle && (
                <span className="block text-[9px] font-bold text-slate-400 truncate">{selected.subtitle}</span>
              )}
            </div>
          </>
        ) : (
          <span className="text-xs font-semibold text-slate-400 flex-1 py-1">{placeholder}</span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-7 pr-2 py-1.5 bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto p-1.5 space-y-0.5">
            {filtered.length === 0 && (
              <p className="text-[11px] font-bold text-slate-400 text-center py-3">Sin resultados</p>
            )}
            {filtered.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors ${
                  opt.id === value ? 'bg-vivero-soft/70' : 'hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg font-black text-[10px] flex items-center justify-center flex-shrink-0 ${
                    opt.avatarClass || 'bg-gradient-to-br from-slate-600 to-slate-800 text-white'
                  }`}
                >
                  {opt.title.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[11px] font-extrabold text-slate-800 truncate">{opt.title}</span>
                  {opt.subtitle && (
                    <span className="block text-[9px] font-bold text-slate-400 truncate">{opt.subtitle}</span>
                  )}
                </div>
                {opt.id === value && <CheckCircle2 className="w-3.5 h-3.5 text-vivero-primary flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const formatDate = (d?: string) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return (
    dt.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' • ' +
    dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  );
};

const statusStyles: Record<string, string> = {
  RECIBIDA: 'bg-emerald-100 text-emerald-800',
  COMPLETADA: 'bg-emerald-100 text-emerald-800',
  PENDIENTE: 'bg-amber-100 text-amber-800',
  CANCELADA: 'bg-rose-100 text-rose-800'
};

export const PurchasesPage: React.FC = () => {
  const { companyName } = useCompanySettings();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'todas' | 'grass' | 'plantas'>('todas');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Purchase Form State
  const [supplierId, setSupplierId] = useState<number>(1);
  const [productId, setProductId] = useState<number>(1);
  const [quantity, setQuantity] = useState<string>('200');
  const [unitCost, setUnitCost] = useState<string>('6.50');
  const [notes, setNotes] = useState<string>('Cosecha e ingreso directo a vivero');

  // Delivery options state
  const [isDelivery, setIsDelivery] = useState<boolean>(false);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState<string>('10:00 AM - 02:00 PM');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const fetchPurchasesData = async () => {
    setLoadingPurchases(true);
    try {
      const [purRes, supRes, prodRes] = await Promise.all([
        purchaseApi.getRecentPurchases().catch(() => null),
        supplierApi.getAllSuppliers().catch(() => null),
        productApi.getAllProducts().catch(() => null)
      ]);
      if (purRes?.data) setPurchases(purRes.data);

      if (supRes?.data && supRes.data.length > 0) {
        setSuppliers(supRes.data);
      } else {
        setSuppliers([]);
      }

      if (prodRes?.data && prodRes.data.length > 0) {
        setProductsList(prodRes.data);
      } else {
        setProductsList([]);
      }

      if (supRes?.data && supRes.data.length > 0) {
        setSupplierId(supRes.data[0].id);
      }

      if (prodRes?.data && prodRes.data.length > 0) {
        setProductId(prodRes.data[0].id);
      }
    } catch (err) {
      console.error('Error al cargar datos de compras desde MySQL:', err);
    } finally {
      setLoadingPurchases(false);
    }
  };

  useEffect(() => {
    fetchPurchasesData();
    const handleBackendOnline = () => fetchPurchasesData();
    window.addEventListener('vivero_backend_online', handleBackendOnline);
    return () => window.removeEventListener('vivero_backend_online', handleBackendOnline);
  }, []);

  // Logic: detect unit type from the catalog (M2) with fallback to product name
  const getUnitType = (pid: number, name: string): 'M2' | 'und' => {
    const p = productsList.find(x => x.id === pid);
    if (p) return p.unitType === 'M2' ? 'M2' : 'und';
    return name.toLowerCase().includes('grass') ? 'M2' : 'und';
  };

  const isM2Item = (pid: number, name: string) => getUnitType(pid, name) === 'M2';

  // Metrics
  const totalInvoiced = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalM2Acquired = purchases
    .flatMap(p => p.items)
    .filter(i => isM2Item(i.productId, i.productName))
    .reduce((sum, i) => sum + i.quantity, 0);

  const totalUnitsAcquired = purchases
    .flatMap(p => p.items)
    .filter(i => !isM2Item(i.productId, i.productName))
    .reduce((sum, i) => sum + i.quantity, 0);

  const filteredPurchases = purchases.filter(p => {
    const query = search.toLowerCase();
    const matchesSearch =
      p.purchaseNumber.toLowerCase().includes(query) ||
      p.supplierName.toLowerCase().includes(query) ||
      (p.notes && p.notes.toLowerCase().includes(query)) ||
      p.items.some(i => i.productName.toLowerCase().includes(query));

    if (!matchesSearch) return false;
    if (activeTab === 'todas') return true;
    const hasM2 = p.items.some(i => isM2Item(i.productId, i.productName));
    if (activeTab === 'grass') return hasM2;
    if (activeTab === 'plantas') return !hasM2;
    return true;
  });

  // Logic: newest purchases first
  const sortedPurchases = [...filteredPurchases].sort(
    (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
  );

  const formTotal = (parseFloat(quantity) || 0) * (parseFloat(unitCost) || 0);
  const selectedProduct = productsList.find(p => p.id === productId);
  const selectedSupplier = suppliers.find(s => s.id === supplierId);

  const openNewPurchase = () => {
    setQuantity('200');
    setUnitCost('6.50');
    setNotes('Cosecha e ingreso directo a vivero');
    setIsDelivery(false);
    setDeliveryAddress('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleToggleDelivery = (checked: boolean) => {
    setIsDelivery(checked);
    if (checked) {
      if (selectedSupplier?.address) setDeliveryAddress(selectedSupplier.address);
    } else {
      setDeliveryAddress('');
    }
  };

  const handleSupplierChange = (id: number) => {
    setSupplierId(id);
    if (isDelivery) {
      const sup = suppliers.find(s => s.id === id);
      if (sup?.address) setDeliveryAddress(sup.address);
    }
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity) || 0;
    const cost = parseFloat(unitCost) || 0;

    if (qty <= 0 || cost <= 0) {
      setFormError('La cantidad y el costo unitario deben ser mayores a cero.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const supName = selectedSupplier?.companyName;

    try {
      await purchaseApi.createPurchase({
        supplierId,
        supplierName: supName,
        items: [
          {
            productId,
            quantity: qty,
            unitCost: cost
          }
        ],
        notes,
        isDelivery,
        deliveryAddress: isDelivery ? (deliveryAddress.trim() || supName) : undefined,
        deliveryTimeSlot: isDelivery ? deliveryTimeSlot : undefined,
        deliveryNotes: isDelivery ? `Despacho de orden de compra (${qty} unidades/m²)` : undefined
      });

      window.dispatchEvent(new CustomEvent('vivero_products_updated'));
      await fetchPurchasesData();
      setIsAddModalOpen(false);
      setIsDelivery(false);
      setDeliveryAddress('');
      setSuccessMsg('Orden de compra registrada y stock actualizado en MySQL.');
    } catch (err: any) {
      console.error('Error al guardar compra en MySQL:', err);
      let msg = 'No se pudo guardar la orden de compra en la base de datos MySQL.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = err.message;
      }
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const openWhatsAppSupplier = (supplierName: string) => {
    const sup = suppliers.find(s => s.companyName === supplierName);
    const phone = (sup && sup.phone) ? sup.phone.replace(/[^0-9]/g, '') : '51955112233';
    const formatted = phone.startsWith('51') ? phone : '51' + phone;
    const msg = `Hola 👋 Te saludamos del área de compras de ${companyName.toUpperCase()} 🌱. Requerimos cotización de nuevos lotes de abastecimiento.`;
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-3 pb-24 lg:pb-8">
      {/* Compact Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] rounded-2xl p-2.5 text-white shadow-lg">
          <Receipt className="w-4 h-4 text-vivero-mint mb-1.5" />
          <span className="block text-lg font-black leading-none">
            {totalInvoiced >= 1000
              ? `S/ ${(totalInvoiced / 1000).toFixed(1)}k`
              : `S/ ${Math.round(totalInvoiced)}`}
          </span>
          <span className="text-[9px] font-bold text-emerald-200 mt-1 block">Inversión</span>
        </div>

        <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-card">
          <Sprout className="w-4 h-4 text-emerald-500 mb-1.5" />
          <span className="block text-lg font-black text-slate-800 leading-none">
            {totalM2Acquired >= 1000 ? `${(totalM2Acquired / 1000).toFixed(1)}k` : Math.round(totalM2Acquired)}
          </span>
          <span className="text-[9px] font-bold text-slate-400 mt-1 block">Grass (m²)</span>
        </div>

        <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-card">
          <Flower2 className="w-4 h-4 text-vivero-primary mb-1.5" />
          <span className="block text-lg font-black text-[#1b4332] leading-none">
            {totalUnitsAcquired >= 1000 ? `${(totalUnitsAcquired / 1000).toFixed(1)}k` : Math.round(totalUnitsAcquired)}
          </span>
          <span className="text-[9px] font-bold text-slate-400 mt-1 block">Plantas (und)</span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Segmented Tabs */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-card space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por N° Orden, proveedor o producto..."
            className="w-full pl-8 pr-12 py-2 bg-slate-100 focus:bg-white text-xs font-semibold text-slate-800 rounded-xl border border-transparent focus:border-vivero-mint/60 focus:outline-none transition-all"
          />
          <button
            onClick={openNewPurchase}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-all"
            title="Nueva Orden de Compra"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { id: 'todas', label: 'Todas', icon: Receipt },
            { id: 'grass', label: 'Grass', icon: Sprout },
            { id: 'plantas', label: 'Plantas', icon: Flower2 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap flex items-center gap-1 transition-all flex-1 justify-center ${
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

      {/* Purchase Orders List */}
      <div className="space-y-2.5">
        {loadingPurchases ? (
          <LeavesLoader message="Cargando órdenes de compra..." />
        ) : sortedPurchases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-1.5">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-extrabold text-slate-500">Sin órdenes de compra que coincidan</p>
            <p className="text-[10px] text-slate-400 font-semibold">Toca + para registrar una nueva orden</p>
          </div>
        ) : (
          sortedPurchases.map(purchase => (
            <div
              key={purchase.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden"
            >
              {/* Header */}
              <div className="px-3.5 pt-3 pb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                    {purchase.supplierName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-slate-800 text-xs leading-tight truncate">
                        {purchase.purchaseNumber}
                      </h4>
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase flex-shrink-0 ${
                          statusStyles[purchase.status] || 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {purchase.status || 'Ingresado'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
                      {formatDate(purchase.purchaseDate)}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-black text-[#1b4332] block">S/ {purchase.totalAmount.toFixed(2)}</span>
                  <span className="text-[9px] font-bold text-slate-400">Total orden</span>
                </div>
              </div>

              {/* Items */}
              <div className="px-3.5 pb-2 space-y-1">
                <p className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                  <Receipt className="w-3 h-3 text-vivero-primary flex-shrink-0" />
                  <span className="truncate">Proveedor: <strong className="text-slate-700">{purchase.supplierName}</strong></span>
                </p>
                {purchase.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 rounded-lg px-2 py-1.5 border border-slate-100"
                  >
                    <span className="truncate">
                      <strong className="text-slate-800">{item.quantity}</strong> × {item.productName}
                      <span className="text-slate-400 font-bold ml-1">
                        ({isM2Item(item.productId, item.productName) ? 'm²' : 'und'})
                      </span>
                    </span>
                    <span className="text-slate-500 whitespace-nowrap">
                      S/ {(item.totalCost || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
                {purchase.notes && (
                  <p className="text-[10px] text-slate-400 italic truncate">"{purchase.notes}"</p>
                )}
              </div>

              {/* Actions */}
              <div className="px-3.5 pb-3 pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => openWhatsAppSupplier(purchase.supplierName)}
                  className="py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all font-extrabold text-[10px]"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Proveedor</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-95 font-extrabold text-[10px]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Admin Modal: Create New Purchase Order */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-200 my-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">Nueva Orden de Compra / Cosecha</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-2.5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="block font-black text-red-800">Error al registrar compra:</span>
                    <span className="block font-normal mt-0.5">{formError}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-1">Proveedor</label>
                <ModernCombo
                  value={supplierId}
                  onChange={handleSupplierChange}
                  options={suppliers.map(s => ({
                    id: s.id,
                    title: s.companyName,
                    subtitle: `${s.phone || 'Sin teléfono'}${s.address ? ' • ' + s.address : ''}`,
                    avatarClass: 'bg-gradient-to-br from-slate-700 to-slate-900 text-white'
                  }))}
                  placeholder="Seleccionar proveedor..."
                  searchPlaceholder="Buscar proveedor..."
                />
              </div>

              <div>
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-1">Producto A Comprar</label>
                <ModernCombo
                  value={productId}
                  onChange={setProductId}
                  options={productsList.map(p => ({
                    id: p.id,
                    title: p.name,
                    subtitle: `${p.unitType === 'M2' ? 'm²' : 'und'} • Stock: ${p.availableStock ?? p.stock} • S/ ${p.costPrice?.toFixed(2) ?? '0.00'}`,
                    avatarClass: 'bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-vivero-mint'
                  }))}
                  placeholder="Seleccionar producto..."
                  searchPlaceholder="Buscar producto..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">
                    Cantidad ({selectedProduct?.unitType === 'M2' ? 'm²' : 'und'})
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none border border-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">Costo Unitario (S/)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={unitCost}
                    onChange={e => setUnitCost(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none border border-slate-200"
                  />
                </div>
              </div>

              {/* Live total */}
              <div className="flex items-center justify-between bg-vivero-soft/50 border border-vivero-mint/30 rounded-xl px-3 py-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-500">
                  Total Orden ({selectedProduct?.unitType === 'M2' ? 'm²' : 'und'})
                </span>
                <strong className="text-base font-black text-[#1b4332]">S/ {formTotal.toFixed(2)}</strong>
              </div>

              <div>
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">Notas / Lote de Cosecha</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ej. Cosecha Lote 4 Panamericana Lurín"
                  className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none border border-slate-200"
                />
              </div>

              {/* Delivery Section */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                  <input
                    type="checkbox"
                    checked={isDelivery}
                    onChange={e => handleToggleDelivery(e.target.checked)}
                    className="w-4 h-4 text-vivero-primary rounded focus:ring-vivero-primary border-slate-300"
                  />
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-vivero-primary" />
                    <span>¿Requiere Delivery / Registrar en Pedidos?</span>
                  </span>
                </label>

                {isDelivery && (
                  <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 animate-in fade-in duration-150">
                    <div>
                      <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">
                        Dirección de Entrega / Despacho
                      </label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={deliveryAddress}
                          onChange={e => setDeliveryAddress(e.target.value)}
                          placeholder="Ej: Panamericana Sur Km 35, Lurín"
                          required={isDelivery}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">
                        Horario Preferido
                      </label>
                      <input
                        type="text"
                        value={deliveryTimeSlot}
                        onChange={e => setDeliveryTimeSlot(e.target.value)}
                        placeholder="Ej: Mañana 10:00 AM - 02:00 PM"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-[#1b4332] text-vivero-mint font-extrabold text-xs rounded-xl shadow-lg active:scale-95 transition-all mt-1 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando en MySQL...</span>
                  </>
                ) : (
                  <span>Guardar Compra e Ingresar a Inventario</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
