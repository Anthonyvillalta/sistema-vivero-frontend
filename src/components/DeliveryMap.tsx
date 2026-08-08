import React, { useState } from 'react';
import { Order } from '../types';
import { Truck, CheckCircle2, Phone, ArrowLeft, Navigation, MapPin } from 'lucide-react';

interface DeliveryMapProps {
  order: Order | null;
  onClose: () => void;
  onMarkDelivered: (orderId: number) => void;
}

export const DeliveryMap: React.FC<DeliveryMapProps> = ({ order, onClose, onMarkDelivered }) => {
  if (!order) return null;

  const [isDelivered, setIsDelivered] = useState(order.status === 'ENTREGADO');

  const handleDelivered = () => {
    setIsDelivered(true);
    onMarkDelivered(order.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg h-[90vh] sm:h-[85vh] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-700 hover:text-vivero-dark font-extrabold text-base"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Delivery #{order.orderNumber}</span>
          </button>
          <span className="px-3 py-1 bg-vivero-soft text-vivero-dark text-xs font-black rounded-full uppercase">
            {isDelivered ? 'Entregado' : 'En camino'}
          </span>
        </div>

        {/* Map Placeholder Graphic */}
        <div className="flex-1 bg-slate-200 relative overflow-hidden flex items-center justify-center">
          {/* Simulated Vector Map with Roads & Pin */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#1b4332_1px,transparent_1px)] [background-size:16px_16px]" />

          <svg className="w-full h-full absolute inset-0 text-vivero-primary stroke-current opacity-60" fill="none">
            <path d="M 50 100 Q 200 150 250 300 T 400 450" strokeWidth="6" strokeLinecap="round" strokeDasharray="8 8" className="animate-pulse" />
          </svg>

          {/* Delivery Driver Marker */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce">
            <div className="w-12 h-12 bg-vivero-dark text-vivero-mint rounded-2xl shadow-floating flex items-center justify-center border-2 border-white">
              <Truck className="w-6 h-6" />
            </div>
            <span className="mt-1 px-2.5 py-0.5 bg-vivero-dark text-white text-[10px] font-extrabold rounded-md shadow-md">
              Carlos (Repartidor)
            </span>
          </div>

          {/* Destination Marker */}
          <div className="absolute bottom-1/3 right-1/4 flex flex-col items-center">
            <div className="w-10 h-10 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center border-2 border-white">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="mt-1 px-2 py-0.5 bg-white text-slate-800 text-[10px] font-bold rounded-md shadow-md">
              {order.customerName}
            </span>
          </div>
        </div>

        {/* Floating Delivery Card at Bottom */}
        <div className="p-5 bg-white border-t border-slate-100 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-vivero-soft text-vivero-dark flex items-center justify-center font-bold">
                <Navigation className="w-5 h-5 text-vivero-primary" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">
                  {order.customerName}
                </h4>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-vivero-primary" />
                  {order.deliveryAddress}
                </p>
              </div>
            </div>
            <a
              href={`tel:${order.customerPhone}`}
              className="p-3 bg-slate-100 hover:bg-vivero-soft text-slate-700 hover:text-vivero-dark rounded-xl transition-colors"
              title="Llamar al cliente"
            >
              <Phone className="w-5 h-5" />
            </a>
          </div>

          <div className="text-xs text-slate-500 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between">
            <span>Hora Programada: <strong>{order.deliveryTimeSlot || 'Hoy'}</strong></span>
            <span>Repartidor: <strong>{order.assignedDriverName || 'Por asignar'}</strong></span>
          </div>

          <button
            onClick={handleDelivered}
            disabled={isDelivered}
            className={`w-full py-4 rounded-2xl font-extrabold text-base shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              isDelivered
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-vivero-dark hover:bg-vivero-primary text-vivero-mint'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isDelivered ? '¡Pedido Entregado!' : 'Marcar como entregado'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
