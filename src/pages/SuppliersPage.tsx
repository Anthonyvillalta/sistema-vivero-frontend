import React, { useState, useEffect } from 'react';
import { Supplier, Purchase, Product } from '../types';
import { supplierApi, purchaseApi, productApi } from '../services/api';
import { useCompanySettings } from '../context/CompanyContext';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Plus,
  Receipt,
  Search,
  Edit2,
  X,
  AlertCircle,
  CheckCircle2,
  Package,
  CalendarDays,
  Loader2
} from 'lucide-react';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const formatDate = (d?: string) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusStyles: Record<string, string> = {
  RECIBIDA: 'bg-emerald-100 text-emerald-800',
  COMPLETADA: 'bg-emerald-100 text-emerald-800',
  PENDIENTE: 'bg-amber-100 text-amber-800',
  CANCELADA: 'bg-rose-100 text-rose-800'
};

export const SuppliersPage: React.FC = () => {
  const { companyName } = useCompanySettings();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [supplierError, setSupplierError] = useState<string | null>(null);

  useEffect(() => {
    if (!supplierError) return;
    const timer = setTimeout(() => setSupplierError(null), 4000);
    return () => clearTimeout(timer);
  }, [supplierError]);

  const fetchSuppliersAndPurchases = async () => {
    setLoading(true);
    try {
      const [supRes, purRes, prodRes] = await Promise.all([
        supplierApi.getAllSuppliers().catch(() => null),
        purchaseApi.getRecentPurchases().catch(() => null),
        productApi.getAllProducts().catch(() => null)
      ]);

      if (supRes?.data && supRes.data.length > 0) {
        setSuppliers(supRes.data);
      } else {
        setSuppliers([]);
      }

      if (purRes?.data) {
        setPurchases(purRes.data);
      }

      if (prodRes?.data && prodRes.data.length > 0) {
        setProductsList(prodRes.data);
      } else {
        setProductsList([]);
      }
    } catch (err) {
      console.error('Error al cargar proveedores y compras desde MySQL:', err);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliersAndPurchases();
    const handleBackendOnline = () => fetchSuppliersAndPurchases();
    window.addEventListener('vivero_backend_online', handleBackendOnline);
    return () => window.removeEventListener('vivero_backend_online', handleBackendOnline);
  }, []);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'proveedores' | 'compras'>('proveedores');
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Supplier Form State
  const [compName, setCompName] = useState('');
  const [contName, setContName] = useState('');
  const [docNum, setDocNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // Purchase Form State
  const [purSupplierId, setPurSupplierId] = useState<number>(1);
  const [purProductId, setPurProductId] = useState<number>(1);
  const [purQuantity, setPurQuantity] = useState<string>('100');
  const [purUnitCost, setPurUnitCost] = useState<string>('6.50');
  const [purNotes, setPurNotes] = useState<string>('Ingreso de abasto a vivero');

  // Metrics
  const totalSuppliersCount = suppliers.length;
  const totalPurchasesVolume = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

  const filteredSuppliers = suppliers.filter(s => {
    const query = search.toLowerCase();
    return (
      s.companyName.toLowerCase().includes(query) ||
      (s.contactName && s.contactName.toLowerCase().includes(query)) ||
      (s.documentNumber && s.documentNumber.includes(query)) ||
      (s.address && s.address.toLowerCase().includes(query))
    );
  });

  const openWhatsApp = (phoneNum: string, name: string) => {
    const clean = phoneNum.replace(/[^0-9]/g, '');
    const formatted = clean.startsWith('51') ? clean : '51' + clean;
    const msg = `Hola ${name} 👋\nTe saludamos del departamento de compras de ${companyName.toUpperCase()} 🌱. Requerimos cotización de insumos / plantas.`;
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Save Supplier (Create/Edit)
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName || !phone) return;

    setSavingSupplier(true);
    setSupplierError(null);
    try {
      if (editingSupplier) {
        await supplierApi.updateSupplier(editingSupplier.id, {
          companyName: compName.trim(),
          contactName: contName.trim(),
          documentNumber: docNum.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim()
        });
      } else {
        await supplierApi.createSupplier({
          companyName: compName.trim(),
          contactName: contName.trim(),
          documentNumber: docNum.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim()
        });
      }

      await fetchSuppliersAndPurchases();
      setIsAddSupplierOpen(false);
      setEditingSupplier(null);
      setCompName('');
      setContName('');
      setDocNumber('');
      setPhone('');
      setEmail('');
      setAddress('');
    } catch (err: any) {
      console.error('Error al guardar proveedor:', err);
      const msg = err.response?.data?.message || err.message || 'No se pudo guardar el proveedor en la base de datos MySQL.';
      setSupplierError(msg);
    } finally {
      setSavingSupplier(false);
    }
  };

  // Save New Purchase Order & Auto-increment Stock
  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedSup = suppliers.find(s => s.id === purSupplierId) || suppliers[0];
    const selectedProd = productsList.find(p => p.id === purProductId) || productsList[0];
    const qty = parseFloat(purQuantity) || 0;
    const cost = parseFloat(purUnitCost) || 0;

    if (!selectedSup || !selectedProd || qty <= 0) return;

    setSavingPurchase(true);
    try {
      await purchaseApi.createPurchase({
        supplierId: selectedSup.id,
        supplierName: selectedSup.companyName,
        items: [
          {
            productId: selectedProd.id,
            quantity: qty,
            unitCost: cost
          }
        ],
        notes: purNotes
      });

      window.dispatchEvent(new CustomEvent('vivero_products_updated'));
      await fetchSuppliersAndPurchases();
      setIsAddPurchaseOpen(false);
      setPurNotes('');
    } catch (err) {
      console.error('Error al registrar compra:', err);
      alert('No se pudo registrar la compra en la base de datos MySQL.');
    } finally {
      setSavingPurchase(false);
    }
  };

  const openEditSupplierModal = (s: Supplier) => {
    setEditingSupplier(s);
    setCompName(s.companyName);
    setContName(s.contactName || '');
    setDocNumber(s.documentNumber || '');
    setPhone(s.phone || '');
    setEmail(s.email || '');
    setAddress(s.address || '');
  };

  return (
    <div className="space-y-3 pb-24 lg:pb-8">
      {/* Compact Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] rounded-2xl p-2.5 text-white shadow-lg">
          <Building2 className="w-4 h-4 text-vivero-mint mb-1.5" />
          <span className="block text-lg font-black leading-none">{totalSuppliersCount}</span>
          <span className="text-[9px] font-bold text-emerald-200 mt-1 block">Proveedores</span>
        </div>

        <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-card">
          <Receipt className="w-4 h-4 text-vivero-primary mb-1.5" />
          <span className="block text-lg font-black text-[#1b4332] leading-none">
            {totalPurchasesVolume >= 1000
              ? `S/ ${(totalPurchasesVolume / 1000).toFixed(1)}k`
              : `S/ ${Math.round(totalPurchasesVolume)}`}
          </span>
          <span className="text-[9px] font-bold text-slate-400 mt-1 block">Compras</span>
        </div>

        <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-card">
          <Package className="w-4 h-4 text-amber-500 mb-1.5" />
          <span className="block text-lg font-black text-slate-800 leading-none">{purchases.length}</span>
          <span className="text-[9px] font-bold text-slate-400 mt-1 block">Órdenes</span>
        </div>
      </div>

      {supplierError && (
        <div className="p-3 bg-rose-50 border-2 border-rose-200 rounded-2xl text-rose-900 text-xs font-bold flex items-start gap-2 animate-in fade-in zoom-in-95 duration-150 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="block font-black text-rose-900 text-[11px] uppercase tracking-wider">
              Alerta de Proveedor
            </span>
            <span className="block font-bold text-rose-800 text-[11px] leading-relaxed mt-0.5">
              {supplierError}
            </span>
          </div>
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
            placeholder="Buscar por empresa, RUC, contacto o dirección..."
            className="w-full pl-8 pr-12 py-2 bg-slate-100 focus:bg-white text-xs font-semibold text-slate-800 rounded-xl border border-transparent focus:border-vivero-mint/60 focus:outline-none transition-all"
          />
          <button
            onClick={() => {
              if (activeTab === 'compras') {
                setIsAddPurchaseOpen(true);
                return;
              }
              setEditingSupplier(null);
              setCompName('');
              setContName('');
              setDocNumber('');
              setPhone('');
              setEmail('');
              setAddress('');
              setIsAddSupplierOpen(true);
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-all"
            title={activeTab === 'compras' ? 'Nueva Compra' : 'Nuevo Proveedor'}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Segmentation Tabs */}
        <div className="flex items-center gap-1.5">
          {[
            { id: 'proveedores', label: 'Proveedores', icon: Building2 },
            { id: 'compras', label: 'Compras Recientes', icon: Package },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'proveedores' | 'compras')}
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

      {activeTab === 'proveedores' ? (
        /* Suppliers List */
        <div className="space-y-2.5">
          {filteredSuppliers.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-1.5">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-extrabold text-slate-500">Sin proveedores que coincidan</p>
              <p className="text-[10px] text-slate-400 font-semibold">Ajusta la búsqueda o agrega uno nuevo</p>
            </div>
          )}

          {filteredSuppliers.map(sup => (
            <div
              key={sup.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden"
            >
              {/* Header */}
              <div className="px-3.5 pt-3 pb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                    {sup.companyName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-slate-800 text-xs leading-tight truncate">
                      {sup.companyName}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
                      RUC: {sup.documentNumber || '—'} • Contacto: {sup.contactName || 'N/A'}
                    </p>
                  </div>
                </div>

                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-lg flex items-center gap-1 flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Activo
                </span>
              </div>

              {/* Info */}
              <div className="px-3.5 pb-2 space-y-1.5">
                <p className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold min-w-0">
                  <Phone className="w-3 h-3 text-vivero-primary flex-shrink-0" />
                  <span className="truncate">{sup.phone}</span>
                </p>
                <p className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold min-w-0">
                  <Mail className="w-3 h-3 text-vivero-primary flex-shrink-0" />
                  <span className="truncate">{sup.email || 'Sin correo'}</span>
                </p>
                <p className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold min-w-0">
                  <MapPin className="w-3 h-3 text-vivero-primary flex-shrink-0" />
                  <span className="truncate">{sup.address}</span>
                </p>
              </div>

              {/* Actions */}
              <div className="px-3.5 pb-3 pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => openWhatsApp(sup.phone || '', sup.companyName)}
                  className="py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-xs active:scale-95 transition-all"
                  title="Enviar WhatsApp"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                </button>

                <a
                  href={`tel:${sup.phone}`}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                  title="Llamar"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => openEditSupplierModal(sup)}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                  title="Editar Proveedor"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Purchases List */
        <div className="space-y-2.5">
          {purchases.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-1.5">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-extrabold text-slate-500">Sin compras registradas</p>
              <p className="text-[10px] text-slate-400 font-semibold">Toca + para registrar una orden de compra</p>
            </div>
          )}

          {purchases.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden"
            >
              <div className="px-3.5 pt-3 pb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-vivero-mint font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                    {p.supplierName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-slate-800 text-xs leading-tight truncate">
                      {p.supplierName}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      <span className="truncate">{p.purchaseNumber} • {formatDate(p.purchaseDate)}</span>
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase flex-shrink-0 ${
                    statusStyles[p.status] || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {p.status}
                </span>
              </div>

              <div className="px-3.5 pb-2 space-y-1">
                {p.items.map(item => (
                  <p
                    key={item.id}
                    className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-600"
                  >
                    <span className="truncate">{item.quantity} × {item.productName}</span>
                    <span className="text-slate-500 whitespace-nowrap">S/ {(item.totalCost || 0).toFixed(2)}</span>
                  </p>
                ))}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total orden</span>
                  <strong className="text-sm font-black text-[#1b4332]">S/ {(p.totalAmount || 0).toFixed(2)}</strong>
                </div>
                {p.notes && (
                  <p className="text-[10px] text-slate-400 italic truncate">"{p.notes}"</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add / Edit Supplier */}
      {(isAddSupplierOpen || editingSupplier) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">
                {editingSupplier ? 'Editar Datos del Proveedor' : 'Registrar Nuevo Proveedor'}
              </h3>
              <button
                onClick={() => {
                  setIsAddSupplierOpen(false);
                  setEditingSupplier(null);
                }}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-2.5">
              {supplierError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{supplierError}</span>
                </div>
              )}
              <div>
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">Razón Social / Nombre Empresa</label>
                <input
                  type="text"
                  value={compName}
                  onChange={e => setCompName(e.target.value)}
                  placeholder="Ej. Agro Grass del Perú S.A.C."
                  required
                  className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">Nombre Contacto</label>
                  <input
                    type="text"
                    value={contName}
                    onChange={e => setContName(e.target.value)}
                    placeholder="Ing. Roberto Gómez"
                    className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">N° RUC</label>
                  <input
                    type="text"
                    value={docNum}
                    onChange={e => setDocNumber(e.target.value)}
                    placeholder="20512345678"
                    className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">Teléfono / Celular</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+51 955112233"
                    required
                    className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ventas@empresa.com"
                    className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">Dirección / Vivero Origen</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Panamericana Sur Km 35, Lurín"
                  className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingSupplier}
                className="w-full py-2.5 bg-[#1b4332] text-vivero-mint font-extrabold text-xs rounded-xl shadow-lg active:scale-95 transition-all mt-1 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingSupplier ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando en MySQL...</span>
                  </>
                ) : (
                  <span>{editingSupplier ? 'Guardar Cambios de Proveedor' : 'Registrar Proveedor'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Purchase */}
      {isAddPurchaseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">Registrar Orden de Compra</h3>
              <button
                onClick={() => setIsAddPurchaseOpen(false)}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-2.5">
              <div>
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">Proveedor</label>
                <select
                  value={purSupplierId}
                  onChange={e => setPurSupplierId(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.companyName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">Producto / Insumo</label>
                <select
                  value={purProductId}
                  onChange={e => setPurProductId(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  {productsList.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={purQuantity}
                    onChange={e => setPurQuantity(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">Costo Unitario (S/)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={purUnitCost}
                    onChange={e => setPurUnitCost(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">Notas</label>
                <textarea
                  value={purNotes}
                  onChange={e => setPurNotes(e.target.value)}
                  placeholder="Ej. Ingreso de abasto a vivero"
                  rows={2}
                  className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingPurchase}
                className="w-full py-2.5 bg-[#1b4332] text-vivero-mint font-extrabold text-xs rounded-xl shadow-lg active:scale-95 transition-all mt-1 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingPurchase ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registrando en MySQL...</span>
                  </>
                ) : (
                  <span>Registrar Compra y Sumar Stock</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
