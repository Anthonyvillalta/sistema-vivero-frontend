import React, { useState, useEffect } from 'react';
import { orderApi } from '../services/api';
import { Order, OrderStatus } from '../types';
import { RealTimeMap } from '../components/RealTimeMap';
import { useCompanySettings } from '../context/CompanyContext';
import {
  PackageCheck,
  Truck,
  Clock,
  MapPin,
  CheckCircle2,
  Phone,
  Search,
  MessageSquare,
  Navigation,
  User,
  ClipboardList
} from 'lucide-react';

interface OrdersPageProps {
  onSelectOrder: (order: Order) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onSelectOrder }) => {
  const { companyName } = useCompanySettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [activeStatusTab, setActiveStatusTab] = useState<string>('Todos');
  const [search, setSearch] = useState<string>('');
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await orderApi.getAllOrders();
      if (res.data) setOrders(res.data);
    } catch (err) {
      console.error('Error al cargar pedidos desde la base de datos MySQL:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const handleBackendOnline = () => fetchOrders();
    window.addEventListener('vivero_backend_online', handleBackendOnline);
    return () => window.removeEventListener('vivero_backend_online', handleBackendOnline);
  }, []);

  const statusTabs = ['Todos', 'Pendientes', 'Preparando', 'En delivery', 'Entregados'];

  const filteredOrders = orders.filter(o => {
    const query = search.toLowerCase();
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(query) ||
      (o.customerName && o.customerName.toLowerCase().includes(query)) ||
      (o.customerPhone && o.customerPhone.includes(query)) ||
      (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(query));

    if (activeStatusTab === 'Todos') return matchesSearch;
    if (activeStatusTab === 'Pendientes') return matchesSearch && o.status === 'PENDIENTE';
    if (activeStatusTab === 'Preparando') return matchesSearch && o.status === 'PREPARANDO';
    if (activeStatusTab === 'En delivery') return matchesSearch && o.status === 'EN_DELIVERY';
    if (activeStatusTab === 'Entregados') return matchesSearch && o.status === 'ENTREGADO';
    return matchesSearch;
  });

  const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await orderApi.updateOrderStatus(orderId, newStatus);
      await fetchOrders();
    } catch (err) {
      console.error('Error al actualizar estado del pedido en MySQL:', err);
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDIENTE':
        return (
          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pendiente
          </span>
        );
      case 'PREPARANDO':
        return (
          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Preparando
          </span>
        );
      case 'EN_DELIVERY':
        return (
          <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-black rounded-full flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping" />
            En Delivery GPS
          </span>
        );
      case 'ENTREGADO':
        return (
          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Entregado
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black rounded-full">
            Cancelado
          </span>
        );
    }
  };

  const openWhatsAppConfirmation = (order: Order) => {
    const phone = order.customerPhone.replace(/[^0-9]/g, '');
    const formatted = phone.length === 9 ? '51' + phone : phone;
    const msg = `Hola ${order.customerName} 👋\nGracias por tu compra en ${companyName.toUpperCase()} 🌱.\n\nConfirmamos tu pedido ${order.orderNumber}:\n• Dirección: ${order.deliveryAddress}\n• Fecha/Hora: ${order.deliveryDate || 'Hoy'}\n• Repartidor asignado: ${order.assignedDriverName || 'Carlos Delivery'}\n\nCualquier consulta estamos a tu disposición.`;
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Metrics Counters
  const pendingCount = orders.filter(o => o.status === 'PENDIENTE').length;
  const preparingCount = orders.filter(o => o.status === 'PREPARANDO').length;
  const inDeliveryCount = orders.filter(o => o.status === 'EN_DELIVERY').length;
  const deliveredCount = orders.filter(o => o.status === 'ENTREGADO').length;

  return (
    <div className="space-y-3.5 pb-24 lg:pb-8">

      {/* Header Banner with Live Metrics */}
      <div className="bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] rounded-2xl sm:rounded-3xl p-4 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 border border-white/15 text-vivero-mint">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Pedidos</h2>
              <p className="text-[10px] text-vivero-mint font-medium">
                Gestión y seguimiento de entregas GPS
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3 mt-3.5 sm:mt-5">
          <div className="bg-white/10 border border-white/15 rounded-xl sm:rounded-2xl py-1.5 sm:py-3.5 text-center">
            <span className="block text-sm sm:text-2xl font-black text-amber-300 leading-tight">{pendingCount}</span>
            <span className="text-[8px] sm:text-[11px] font-bold uppercase text-white/70 tracking-wide">Pendientes</span>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-xl sm:rounded-2xl py-1.5 sm:py-3.5 text-center">
            <span className="block text-sm sm:text-2xl font-black text-blue-300 leading-tight">{preparingCount}</span>
            <span className="text-[8px] sm:text-[11px] font-bold uppercase text-white/70 tracking-wide">Preparando</span>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-xl sm:rounded-2xl py-1.5 sm:py-3.5 text-center">
            <span className="block text-sm sm:text-2xl font-black text-purple-300 leading-tight">{inDeliveryCount}</span>
            <span className="text-[8px] sm:text-[11px] font-bold uppercase text-white/70 tracking-wide">En ruta</span>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-xl sm:rounded-2xl py-1.5 sm:py-3.5 text-center">
            <span className="block text-sm sm:text-2xl font-black text-emerald-300 leading-tight">{deliveredCount}</span>
            <span className="text-[8px] sm:text-[11px] font-bold uppercase text-white/70 tracking-wide">Entregados</span>
          </div>
        </div>
      </div>

      {/* Search & Status Filter Tabs Bar */}
      <div className="bg-white p-2.5 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-card space-y-2.5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por N° Pedido, cliente o dirección..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 focus:bg-white text-xs font-semibold text-slate-800 rounded-xl border border-transparent focus:border-vivero-mint/60 focus:outline-none transition-all"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
          {statusTabs.map(tab => {
            const isActive = activeStatusTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveStatusTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#1b4332] text-vivero-mint shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List - Compact Professional Cards */}
      <div className="space-y-2.5">
        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-8 text-center">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">No se encontraron pedidos</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Ajusta la búsqueda o el filtro de estado
            </p>
          </div>
        )}

        {filteredOrders.map(order => {
          const isPending = order.status === 'PENDIENTE';
          const isPreparing = order.status === 'PREPARANDO';
          const isInDelivery = order.status === 'EN_DELIVERY';
          const isDelivered = order.status === 'ENTREGADO';

          const progressPct = isDelivered ? '100%' : isInDelivery ? '75%' : isPreparing ? '50%' : '25%';
          const progressColor = isDelivered
            ? 'bg-emerald-500'
            : isInDelivery
              ? 'bg-purple-500'
              : isPreparing
                ? 'bg-blue-500'
                : 'bg-amber-500';
          const stepLabel = isDelivered
            ? 'Entregado'
            : isInDelivery
              ? 'En ruta GPS'
              : isPreparing
                ? 'Preparando'
                : 'Recibido';

          const statusTile =
            isDelivered
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white'
              : isInDelivery
                ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                : isPreparing
                  ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
                  : 'bg-gradient-to-br from-amber-500 to-amber-700 text-white';

          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-card hover:shadow-soft transition-all overflow-hidden"
            >
              {/* Card Header */}
              <div className="px-3.5 pt-3 pb-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${statusTile} shadow-md`}>
                    {isDelivered ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isInDelivery ? (
                      <Truck className="w-5 h-5" />
                    ) : isPreparing ? (
                      <PackageCheck className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-black text-xs text-slate-900 block truncate">
                      {order.orderNumber}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 block truncate">
                      {order.customerName}
                    </span>
                  </div>
                </div>
                {getStatusBadge(order.status)}
              </div>

              {/* Compact Progress Bar */}
              <div className="px-3.5 pb-2.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                    style={{ width: progressPct }}
                  />
                </div>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wide flex-shrink-0">
                  {stepLabel}
                </span>
              </div>

              {/* Info Rows */}
              <div className="px-3.5 pb-3 space-y-1.5">
                <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-vivero-primary flex-shrink-0" />
                  <span className="truncate">{order.deliveryAddress}</span>
                </p>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 min-w-0">
                  <Clock className="w-3.5 h-3.5 text-vivero-primary flex-shrink-0" />
                  <span className="truncate">
                    {order.deliveryTimeSlot || (order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('es-PE') : 'Por programar')}
                  </span>
                  <span className="text-slate-300 flex-shrink-0">•</span>
                  <span className="truncate flex-shrink-0">{order.customerPhone}</span>
                </div>
                <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 min-w-0">
                  <User className="w-3.5 h-3.5 text-vivero-primary flex-shrink-0" />
                  <span className="truncate">
                    Repartidor: <strong className="text-vivero-primary">{order.assignedDriverName || 'Carlos Delivery'}</strong>
                  </span>
                </p>
              </div>

              {/* Action Buttons - 3 Equal Columns */}
              <div className="px-3.5 pb-3.5 grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => openWhatsAppConfirmation(order)}
                  className="py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="truncate">WhatsApp</span>
                </button>

                <button
                  onClick={() => setTrackingOrder(order)}
                  className="py-2 rounded-xl bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint text-[10px] font-extrabold flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span className="truncate">Rastreo GPS</span>
                </button>

                {isPending && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'PREPARANDO')}
                    className="py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span className="truncate">Preparar</span>
                  </button>
                )}

                {isPreparing && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'EN_DELIVERY')}
                    className="py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-extrabold flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span className="truncate">Enviar</span>
                  </button>
                )}

                {isInDelivery && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'ENTREGADO')}
                    className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="truncate">Entregar</span>
                  </button>
                )}

                {isDelivered && (
                  <div className="py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold flex items-center justify-center gap-1 w-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="truncate">Entregado</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-Time GPS Interactive Map Tracking Modal */}
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
