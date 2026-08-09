import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { customerApi } from '../services/api';
import { useCompanySettings } from '../context/CompanyContext';
import { CustomSelect } from '../components/CustomSelect';
import {
  Users,
  Phone,
  Star,
  Search,
  Plus,
  MapPin,
  ShoppingBag,
  Building2,
  X,
  Edit2,
  Loader2,
  AlertCircle,
  BadgeCheck
} from 'lucide-react';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const formatExactDate = (rawDate?: string | any): string | null => {
  if (!rawDate) return null;

  try {
    let d: Date | null = null;

    if (Array.isArray(rawDate) && rawDate.length >= 3) {
      d = new Date(rawDate[0], rawDate[1] - 1, rawDate[2], rawDate[3] || 0, rawDate[4] || 0);
    } else if (typeof rawDate === 'string' && rawDate.trim()) {
      const trimmed = rawDate.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [y, m, dayNum] = trimmed.split('-').map(Number);
        d = new Date(y, m - 1, dayNum);
      } else {
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
          d = parsed;
        } else {
          return trimmed;
        }
      }
    } else if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
      d = rawDate;
    }

    if (d && !isNaN(d.getTime())) {
      const day = d.getDate().toString().padStart(2, '0');
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    }
  } catch (e) {
    console.error('Error formatting date:', e);
  }

  return typeof rawDate === 'string' && rawDate.trim() ? rawDate : null;
};

const DOC_TYPE_OPTIONS = [
  { value: 'DNI', label: 'DNI (8 dígitos)', badge: 'Persona' },
  { value: 'RUC', label: 'RUC (11 dígitos)', badge: 'Empresa' },
  { value: 'CE', label: 'Carnet Extranjería', badge: 'Extranjero' }
];

export const CustomersPage: React.FC = () => {
  const { companyName } = useCompanySettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'frecuentes' | 'empresas'>('todos');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [docType, setDocType] = useState('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getAllCustomers();
      if (res.data) setCustomers(res.data);
    } catch (err) {
      console.error('Error al cargar clientes desde MySQL:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    const handleBackendOnline = () => fetchCustomers();
    window.addEventListener('vivero_backend_online', handleBackendOnline);
    return () => window.removeEventListener('vivero_backend_online', handleBackendOnline);
  }, []);

  // Metrics
  const totalCustomers = customers.length;
  const vipCustomersCount = customers.filter(c => c.isFrequent).length;
  const totalCRMVolume = customers.reduce((sum, c) => sum + c.totalPurchases, 0);

  const filteredCustomers = customers.filter(c => {
    const query = search.toLowerCase();
    const matchesSearch =
      c.fullName.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      (c.documentNumber && c.documentNumber.includes(query)) ||
      (c.address && c.address.toLowerCase().includes(query));

    if (activeTab === 'todos') return matchesSearch;
    if (activeTab === 'frecuentes') return matchesSearch && c.isFrequent;
    if (activeTab === 'empresas') return matchesSearch && c.documentType === 'RUC';
    return matchesSearch;
  });

  const openWhatsApp = (phoneNum: string, name: string) => {
    const clean = phoneNum.replace(/[^0-9]/g, '');
    const formatted = clean.startsWith('51') ? clean : '51' + clean;
    const msg = `Hola ${name} 👋\nTe saludamos de ${companyName.toUpperCase()} 🌱. ¿En qué podemos ayudarte con tus plantas o proyectos hoy?`;
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      setFormError('El nombre completo y el teléfono son obligatorios.');
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      fullName: fullName.trim(),
      documentType: docType,
      documentNumber: docNumber.trim(),
      phone: phone.trim(),
      whatsapp: phone.replace(/[^0-9]/g, ''),
      email: email.trim(),
      address: address.trim(),
      notes: notes.trim()
    };

    try {
      if (editingCustomer) {
        await customerApi.updateCustomer(editingCustomer.id, payload);
        setEditingCustomer(null);
      } else {
        await customerApi.createCustomer(payload);
        setIsAddModalOpen(false);
      }

      await fetchCustomers();

      // Reset Form
      setFullName('');
      setDocNumber('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
    } catch (err: any) {
      console.error('Error al guardar cliente en MySQL:', err);
      setFormError('No se pudo guardar el cliente en la base de datos MySQL.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFullName(c.fullName);
    setDocType(c.documentType || 'DNI');
    setDocNumber(c.documentNumber || '');
    setPhone(c.phone);
    setEmail(c.email || '');
    setAddress(c.address || '');
    setNotes(c.notes || '');
  };

  return (
    <div className="space-y-3 pb-24 lg:pb-8">
      {/* Compact Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] rounded-2xl p-2.5 text-white shadow-lg">
          <Users className="w-4 h-4 text-vivero-mint mb-1.5" />
          <span className="block text-lg font-black leading-none">{totalCustomers}</span>
          <span className="text-[9px] font-bold text-emerald-200 mt-1 block">Clientes</span>
        </div>

        <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-card">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500 mb-1.5" />
          <span className="block text-lg font-black text-slate-800 leading-none">{vipCustomersCount}</span>
          <span className="text-[9px] font-bold text-slate-400 mt-1 block">VIP Frecuentes</span>
        </div>

        <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-card">
          <ShoppingBag className="w-4 h-4 text-vivero-primary mb-1.5" />
          <span className="block text-lg font-black text-[#1b4332] leading-none">
            {totalCRMVolume >= 1000
              ? `S/ ${(totalCRMVolume / 1000).toFixed(1)}k`
              : `S/ ${Math.round(totalCRMVolume)}`}
          </span>
          <span className="text-[9px] font-bold text-slate-400 mt-1 block">Ventas CRM</span>
        </div>
      </div>

      {/* Search & New Customer */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-card space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, DNI, teléfono..."
            className="w-full pl-8 pr-12 py-2 bg-slate-100 focus:bg-white text-xs font-semibold text-slate-800 rounded-xl border border-transparent focus:border-vivero-mint/60 focus:outline-none transition-all"
          />
          <button
            onClick={() => {
              setEditingCustomer(null);
              setFullName('');
              setDocNumber('');
              setPhone('');
              setEmail('');
              setAddress('');
              setNotes('');
              setIsAddModalOpen(true);
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-all"
            title="Nuevo Cliente"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Segmentation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'todos', label: 'Todos', icon: Users },
            { id: 'frecuentes', label: 'Frecuentes', icon: Star },
            { id: 'empresas', label: 'Empresas', icon: Building2 },
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

      {/* Customer Cards */}
      <div className="space-y-2.5">
        {filteredCustomers.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-1.5">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-extrabold text-slate-500">Sin clientes que coincidan</p>
            <p className="text-[10px] text-slate-400 font-semibold">Ajusta la búsqueda o el filtro seleccionado</p>
          </div>
        )}

        {filteredCustomers.map(customer => {
          const isRuc = customer.documentType === 'RUC';
          const formattedLastPurchase = formatExactDate(customer.lastPurchaseDate);
          return (
            <div
              key={customer.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden"
            >
              {/* Header */}
              <div className="px-3.5 pt-3 pb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs ${
                      isRuc
                        ? 'bg-gradient-to-br from-slate-600 to-slate-800 text-white'
                        : 'bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-vivero-mint'
                    }`}
                  >
                    {customer.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-slate-800 text-xs leading-tight truncate flex items-center gap-1">
                      {customer.fullName}
                      {isRuc && <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
                      {customer.documentType}: {customer.documentNumber || 'N/A'} • {customer.email || 'Sin correo'}
                    </p>
                  </div>
                </div>

                {customer.isFrequent && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[9px] font-black rounded-lg flex items-center gap-1 flex-shrink-0">
                    <BadgeCheck className="w-3 h-3 fill-amber-500 text-white" />
                    VIP
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="px-3.5 pb-2 space-y-1.5">
                <p className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold min-w-0">
                  <MapPin className="w-3 h-3 text-vivero-primary flex-shrink-0" />
                  <span className="truncate">{customer.address || 'Sin dirección registrada'}</span>
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                    Total: <strong className="text-[#1b4332]">S/ {(Number(customer.totalPurchases) || 0).toFixed(2)}</strong>
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md truncate">
                    Última: {formattedLastPurchase || '—'}
                  </span>
                </div>
                {customer.notes && (
                  <p className="text-[10px] text-slate-500 italic truncate">"{customer.notes}"</p>
                )}
              </div>

              {/* Actions */}
              <div className="px-3.5 pb-3 pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => openWhatsApp(customer.phone, customer.fullName)}
                  className="py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-xs active:scale-95 transition-all"
                  title="Enviar WhatsApp"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                </button>

                <a
                  href={`tel:${customer.phone}`}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                  title="Llamar"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => openEditModal(customer)}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                  title="Editar Cliente"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Add / Edit Customer Modal */}
      {(isAddModalOpen || editingCustomer) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                {editingCustomer ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-2.5">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-extrabold text-slate-600 uppercase block mb-0.5">Nombre Completo / Razón Social</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Ej. Juan Pérez / Inmobiliaria S.A.C."
                  required
                  className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <CustomSelect
                    label="Tipo Doc."
                    value={docType}
                    onChange={val => setDocType(val)}
                    options={DOC_TYPE_OPTIONS}
                    size="sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-600 uppercase block mb-0.5">N° Documento</label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={e => setDocNumber(e.target.value)}
                    placeholder="12345678"
                    className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-600 uppercase block mb-0.5">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+51 987654321"
                    required
                    className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-600 uppercase block mb-0.5">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-600 uppercase block mb-0.5">Dirección de Entrega</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Av. Los Jardines 123, San Isidro"
                  className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-600 uppercase block mb-0.5">Notas / Preferencias de Compra</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ej. Prefiere despachos por las mañanas. Compra grass en rollos."
                  rows={2}
                  className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-[#1b4332] text-vivero-mint font-extrabold text-xs rounded-xl shadow-lg active:scale-95 transition-all mt-1 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando en MySQL...</span>
                  </>
                ) : (
                  <span>{editingCustomer ? 'Guardar Cambios del Cliente' : 'Registrar Cliente en MySQL'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
