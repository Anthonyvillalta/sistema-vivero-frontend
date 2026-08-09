import React, { useState, useEffect } from 'react';
import { orderApi, driverApi } from '../services/api';
import { Order, OrderStatus, Driver } from '../types';
import { RealTimeMap } from '../components/RealTimeMap';
import { LeavesLoader } from '../components/LeavesLoader';
import { useCompanySettings } from '../context/CompanyContext';
import {
  Truck,
  MapPin,
  Clock,
  Phone,
  Navigation,
  CheckCircle2,
  Search,
  AlertCircle,
  Radio,
  Users,
  PackageCheck
} from 'lucide-react';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

interface DeliveryPageProps {
  onSelectOrder?: (order: Order) => void;
}

export const DeliveryPage: React.FC<DeliveryPageProps> = () => {
  const { companyName } = useCompanySettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'activos' | 'flota' | 'historial'>('activos');
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, driversRes] = await Promise.all([
        orderApi.getAllOrders(),
        driverApi.getAllDrivers()
      ]);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (driversRes.data) setDrivers(driversRes.data);
    } catch (err) {
      console.error('Error al cargar datos de delivery desde la base de datos MySQL:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleBackendOnline = () => fetchData();
    window.addEventListener('vivero_backend_online', handleBackendOnline);
    return () => window.removeEventListener('vivero_backend_online', handleBackendOnline);
  }, []);

  const filteredOrders = orders.filter(o => {
    const query = search.toLowerCase();
    const matches =
      (o.orderNumber || '').toLowerCase().includes(query) ||
      (o.customerName || '').toLowerCase().includes(query) ||
      (o.deliveryAddress || '').toLowerCase().includes(query);

    if (activeTab === 'activos') return matches && (o.status === 'EN_DELIVERY' || o.status === 'PREPARANDO' || o.status === 'PENDIENTE');
    if (activeTab === 'historial') return matches && o.status === 'ENTREGADO';
    return matches;
  });

  const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await orderApi.updateOrderStatus(orderId, newStatus);
      await fetchData();
    } catch (err) {
      console.error('Error al actualizar estado del pedido en MySQL:', err);
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    }
  };

  const getDriverActiveOrder = (driver: Driver) =>
    orders.find(o => o.status === 'EN_DELIVERY' && o.assignedDriverName === driver.fullName);

  const getDriverDeliveredCount = (driver: Driver) =>
    orders.filter(o => o.status === 'ENTREGADO' && o.assignedDriverName === driver.fullName).length;

  const openWhatsAppAlert = (order: Order) => {
    const phone = order.customerPhone.replace(/[^0-9]/g, '');
    const formatted = phone.length === 9 ? '51' + phone : phone;
    const msg = `Hola ${order.customerName} 👋\nNotificación de ${companyName.toUpperCase()} 🌱:\nTu pedido ${order.orderNumber} con el repartidor ${order.assignedDriverName || 'Repartidor'} está en camino a: ${order.deliveryAddress}.\n\nEstar atentos a la llegada. ¡Muchas gracias!`;
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const activeDeliveriesCount = orders.filter(o => o.status === 'EN_DELIVERY').length;
  const deliveredCount = orders.filter(o => o.status === 'ENTREGADO').length;
  const activeDriversCount = drivers.filter(d => d.active).length;

  return (
    <div className="space-y-3 pb-24 lg:pb-8">
      {/* Compact Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] rounded-2xl p-2.5 text-white shadow-lg">
          <Truck className="w-4 h-4 text-vivero-mint mb-1.5" />
          <span className="block text-lg font-black leading-none">{activeDeliveriesCount}</span>
          <span className="text-[9px] font-bold text-emerald-200 mt-1 block">En Ruta GPS</span>
        </div>

        <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-card">
          <Users className="w-4 h-4 text-purple-500 mb-1.5" />
          <span className="block text-lg font-black text-slate-800 leading-none">{activeDriversCount}/{drivers.length}</span>
          <span className="text-[9px] font-bold text-slate-400 mt-1 block">Flota Activa</span>
        </div>

        <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-card">
          <PackageCheck className="w-4 h-4 text-emerald-500 mb-1.5" />
          <span className="block text-lg font-black text-slate-800 leading-none">{deliveredCount}</span>
          <span className="text-[9px] font-bold text-slate-400 mt-1 block">Entregados</span>
        </div>
      </div>

      {/* Search & Segmented Tabs */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-card space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por N° Pedido, cliente o dirección..."
            className="w-full pl-8 pr-3 py-2 bg-slate-100 focus:bg-white text-xs font-semibold text-slate-800 rounded-xl border border-transparent focus:border-vivero-mint/60 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { id: 'activos', label: 'Despachos', icon: Navigation },
            { id: 'flota', label: 'Flota', icon: Users },
            { id: 'historial', label: 'Historial', icon: CheckCircle2 },
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

      {/* View Content */}
      {loading ? (
        <LeavesLoader message="Cargando datos desde la base de datos..." />
      ) : (
        <>
          {activeTab === 'activos' && (
            <div className="space-y-2.5">
              {filteredOrders.length === 0 && (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-1.5">
                  <Truck className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-extrabold text-slate-500">No hay despachos activos</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Los pedidos en preparación o en ruta aparecerán aquí</p>
                </div>
              )}

              {filteredOrders.map(order => {
                const isInRoute = order.status === 'EN_DELIVERY';
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden"
                  >
                    <div className="px-3.5 pt-3 pb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs ${
                            isInRoute
                              ? 'bg-gradient-to-br from-purple-500 to-purple-800 text-white'
                              : 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                          }`}
                        >
                          {order.orderNumber?.replace(/\D/g, '').slice(-2) || order.id}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-800 text-xs leading-tight truncate">
                            {order.orderNumber}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
                            {order.customerName}
                          </p>
                        </div>
                      </div>

                      <span className={`px-2 py-1 text-[9px] font-black rounded-lg uppercase flex items-center gap-1 flex-shrink-0 ${
                        isInRoute ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isInRoute ? 'En Ruta' : 'Por Despachar'}
                      </span>
                    </div>

                    <div className="px-3.5 pb-2 space-y-1.5">
                      <p className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold min-w-0">
                        <MapPin className="w-3 h-3 text-vivero-primary flex-shrink-0" />
                        <span className="truncate">{order.deliveryAddress}</span>
                      </p>
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-500 font-semibold flex items-center gap-1 min-w-0">
                          <Phone className="w-3 h-3 text-vivero-primary flex-shrink-0" />
                          <span className="truncate">{order.customerPhone}</span>
                        </span>
                        <span className="text-slate-500 font-semibold whitespace-nowrap">
                          <strong className="text-slate-800">{order.deliveryTimeSlot || '10:00 AM'}</strong>
                        </span>
                      </div>
                      <p className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                        <Truck className="w-3 h-3 text-vivero-primary flex-shrink-0" />
                        <span className="truncate">
                          Repartidor: <strong className="text-vivero-primary">{order.assignedDriverName || 'Por asignar'}</strong>
                        </span>
                      </p>
                    </div>

                    <div className="px-3.5 pb-3 pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => openWhatsAppAlert(order)}
                        className="py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-xs active:scale-95 transition-all"
                        title="Alertar Cliente por WhatsApp"
                      >
                        <WhatsAppIcon className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setTrackingOrder(order)}
                        className="py-2 bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Rastrear</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(order.id, 'ENTREGADO')}
                        className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Entregar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'flota' && (
            <div className="space-y-2.5">
              {drivers.length === 0 && (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-1.5">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-extrabold text-slate-500">Sin repartidores registrados</p>
                  <p className="text-[10px] text-slate-400 font-semibold">La flota se administra desde la base de datos</p>
                </div>
              )}

              {drivers.map(driver => {
                const activeOrder = getDriverActiveOrder(driver);
                const activeDelivery = activeOrder?.delivery;
                const hasGps = activeDelivery?.currentLatitude != null && activeDelivery?.currentLongitude != null;
                return (
                  <div key={driver.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
                    <div className="px-3.5 pt-3 pb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                          {driver.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-800 text-xs leading-tight truncate">{driver.fullName}</h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
                            {driver.vehicleInfo || 'Sin vehículo registrado'}
                            {driver.licenseNumber ? ` • Lic: ${driver.licenseNumber}` : ''}
                          </p>
                        </div>
                      </div>

                      <span className={`px-2 py-1 text-[9px] font-black rounded-lg uppercase flex-shrink-0 ${
                        driver.active ? 'bg-purple-100 text-purple-800 animate-pulse' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {driver.active ? 'En Ruta' : 'Inactivo'}
                      </span>
                    </div>

                    <div className="px-3.5 pb-2 space-y-1.5">
                      <p className="text-[11px] font-semibold text-slate-600">
                        Pedido asignado: <strong className="text-vivero-primary font-extrabold">
                          {activeOrder ? activeOrder.orderNumber : 'Sin pedido en ruta'}
                        </strong>
                      </p>
                      <p className="text-[11px] font-semibold text-slate-600">
                        Entregas completadas: <strong className="text-slate-800">{getDriverDeliveredCount(driver)} pedidos</strong>
                      </p>
                      {activeDelivery && (
                        <>
                          {hasGps ? (
                            <p className="flex items-center gap-1.5 text-[10px] text-vivero-dark bg-vivero-soft/60 border border-vivero-mint/30 rounded-lg px-2 py-1 font-semibold">
                              <Radio className="w-3 h-3 text-vivero-primary flex-shrink-0" />
                              <span className="truncate">
                                GPS: <strong className="font-black">
                                  {Number(activeDelivery.currentLatitude).toFixed(4)}, {Number(activeDelivery.currentLongitude).toFixed(4)}
                                </strong>
                                {activeDelivery.gpsAccuracy != null && ` (±${Number(activeDelivery.gpsAccuracy).toFixed(0)}m)`}
                              </span>
                            </p>
                          ) : (
                            <p className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 font-semibold">
                              <AlertCircle className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">Sin posición GPS registrada</span>
                            </p>
                          )}
                          {activeDelivery.estimatedArrival && (
                            <p className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                              <Clock className="w-3 h-3 text-vivero-primary flex-shrink-0" />
                              <span className="truncate">
                                Llegada estimada: <strong className="text-slate-800">
                                  {new Date(activeDelivery.estimatedArrival).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                </strong>
                                {' '}• {activeDelivery.routeStatus === 'ENTREGADO' ? 'Entregado' : 'En camino'}
                              </span>
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <div className="px-3.5 pb-3 pt-2 border-t border-slate-100">
                      <a
                        href={`tel:${driver.phone || ''}`}
                        className={`w-full py-2 text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                          driver.phone
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold active:scale-95'
                            : 'bg-slate-50 text-slate-400 font-bold cursor-not-allowed pointer-events-none'
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Llamar al Repartidor</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'historial' && (
            <div className="space-y-2.5">
              {orders.filter(o => o.status === 'ENTREGADO').length === 0 && (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-1.5">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-extrabold text-slate-500">Sin entregas completadas</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Las entregas confirmadas quedarán registradas aquí</p>
                </div>
              )}

              {orders.filter(o => o.status === 'ENTREGADO').map(o => (
                <div key={o.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-card px-3.5 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-800 truncate">
                      {o.orderNumber} <span className="text-slate-400 font-bold">•</span>{' '}
                      <span className="text-slate-600">{o.customerName}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{o.deliveryAddress}</p>
                  </div>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-black text-[9px] rounded-lg uppercase flex items-center gap-1 flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Entregado
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* GPS Real-Time Map Modal */}
      {trackingOrder && (
        <RealTimeMap
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
};
