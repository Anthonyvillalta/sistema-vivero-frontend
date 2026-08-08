import React, { useState, useEffect } from 'react';
import { Driver } from '../types';
import { driverApi } from '../services/api';
import {
  Truck,
  Plus,
  Search,
  Phone,
  User,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit2,
  X,
  CreditCard,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const DriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await driverApi.getAllDrivers();
      if (res.data) setDrivers(res.data);
    } catch (err) {
      console.error('Error al cargar repartidores desde MySQL:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    const handleBackendOnline = () => fetchDrivers();
    window.addEventListener('vivero_backend_online', handleBackendOnline);
    return () => window.removeEventListener('vivero_backend_online', handleBackendOnline);
  }, []);

  const openCreateModal = () => {
    setEditingDriver(null);
    setFullName('');
    setDocumentNumber('');
    setPhone('+51 987654321');
    setVehicleInfo('');
    setLicenseNumber('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setFullName(driver.fullName || '');
    setDocumentNumber(driver.documentNumber || '');
    setPhone(driver.phone || '');
    setVehicleInfo(driver.vehicleInfo || '');
    setLicenseNumber(driver.licenseNumber || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('El nombre completo del repartidor es obligatorio.');
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      fullName: fullName.trim(),
      documentNumber: documentNumber.trim(),
      phone: phone.trim(),
      vehicleInfo: vehicleInfo.trim(),
      licenseNumber: licenseNumber.trim(),
      active: editingDriver ? editingDriver.active : true
    };

    try {
      if (editingDriver) {
        await driverApi.updateDriver(editingDriver.id, payload);
      } else {
        await driverApi.createDriver(payload);
      }
      await fetchDrivers();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error al guardar repartidor:', err);
      setFormError('No se pudo guardar la información del repartidor en la base de datos MySQL.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await driverApi.toggleDriverStatus(id);
      await fetchDrivers();
    } catch (err) {
      console.error('Error al cambiar estado del repartidor:', err);
    }
  };

  const filteredDrivers = drivers.filter(d => {
    const query = search.toLowerCase();
    return (
      d.fullName.toLowerCase().includes(query) ||
      (d.phone && d.phone.includes(query)) ||
      (d.documentNumber && d.documentNumber.includes(query)) ||
      (d.vehicleInfo && d.vehicleInfo.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-3.5 pb-24 lg:pb-8">
      {/* Search & Actions Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, celular, DNI o vehículo..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 focus:bg-white text-xs font-semibold text-slate-800 rounded-xl border border-transparent focus:border-vivero-mint/60 focus:outline-none transition-all"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto py-2 px-3.5 bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nuevo Repartidor</span>
        </button>
      </div>

      {/* Driver Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredDrivers.map(driver => (
          <div
            key={driver.id}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card hover:shadow-soft transition-all space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-vivero-soft text-vivero-dark flex items-center justify-center font-black flex-shrink-0">
                    <Truck className="w-5 h-5 text-vivero-primary" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">{driver.fullName}</h4>
                    <p className="text-[11px] text-slate-400 font-bold">DNI: {driver.documentNumber || 'N/A'}</p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  driver.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {driver.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 text-xs font-semibold text-slate-700">
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-vivero-primary" />
                  <span>{driver.phone || 'Sin celular registrado'}</span>
                </p>
                <p className="flex items-center gap-1.5 text-slate-600">
                  <Truck className="w-3.5 h-3.5 text-vivero-primary" />
                  <span>{driver.vehicleInfo || 'Vehículo no especificado'}</span>
                </p>
                {driver.licenseNumber && (
                  <p className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-vivero-primary" />
                    <span>Licencia: <strong>{driver.licenseNumber}</strong></span>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
              <button
                onClick={() => openEditModal(driver)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold px-2.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => handleToggleStatus(driver.id)}
                className={`p-1.5 rounded-lg text-xs font-bold px-2.5 flex items-center gap-1 ${
                  driver.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {driver.active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{driver.active ? 'Desactivar' : 'Activar'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Creating / Editing Driver */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-slate-800 text-sm">
                {editingDriver ? 'Editar Repartidor' : 'Nuevo Repartidor de Delivery'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-3 text-xs font-semibold">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="text-slate-500 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Ej. Carlos Delivery Ruiz"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-vivero-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-500 block mb-1">N° DNI / Documento</label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={e => setDocumentNumber(e.target.value)}
                    placeholder="45891234"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-vivero-primary"
                  />
                </div>

                <div>
                  <label className="text-slate-500 block mb-1">Celular / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+51 987654323"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-vivero-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Vehículo Asignado / Placa</label>
                <input
                  type="text"
                  value={vehicleInfo}
                  onChange={e => setVehicleInfo(e.target.value)}
                  placeholder="Ej. Camión Isuzu 3.5T (Placa: ABC-123)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-vivero-primary"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">N° Licencia de Conducir</label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                  placeholder="Ej. A-IIb 45891234"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-vivero-primary"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#1b4332] text-vivero-mint font-extrabold rounded-xl shadow-md text-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving ? 'Guardando...' : 'Guardar Repartidor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
