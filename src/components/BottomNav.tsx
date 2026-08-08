import React from 'react';
import { Home, Sprout, Plus, PackageCheck, MoreHorizontal } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onQuickAction: () => void;
  onOpenMore: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onQuickAction,
  onOpenMore
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1b4332] text-white px-3 py-2 border-t border-white/10 shadow-2xl flex items-center justify-around">
      {/* Inicio */}
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors ${
          activeTab === 'dashboard' ? 'text-vivero-mint font-bold' : 'text-emerald-100/60 hover:text-white'
        }`}
      >
        <Home className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
        <span className="text-[10px] tracking-tight">Inicio</span>
      </button>

      {/* Productos */}
      <button
        onClick={() => setActiveTab('products')}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors ${
          activeTab === 'products' ? 'text-vivero-mint font-bold' : 'text-emerald-100/60 hover:text-white'
        }`}
      >
        <Sprout className={`w-5 h-5 ${activeTab === 'products' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
        <span className="text-[10px] tracking-tight">Productos</span>
      </button>

      {/* Quick Add POS Plus Button */}
      <button
        onClick={onQuickAction}
        className="-mt-6 w-14 h-14 rounded-full bg-vivero-mint text-vivero-dark flex items-center justify-center shadow-lg active:scale-95 transition-transform border-4 border-slate-50"
        title="Nueva Venta / Carrito"
      >
        <Plus className="w-8 h-8 stroke-[3]" />
      </button>

      {/* Pedidos */}
      <button
        onClick={() => setActiveTab('orders')}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors ${
          activeTab === 'orders' ? 'text-vivero-mint font-bold' : 'text-emerald-100/60 hover:text-white'
        }`}
      >
        <PackageCheck className={`w-5 h-5 ${activeTab === 'orders' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
        <span className="text-[10px] tracking-tight">Pedidos</span>
      </button>

      {/* Más (Abre el Menú de Todos los Módulos incluyendo Inventario) */}
      <button
        onClick={onOpenMore}
        className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors text-emerald-100/60 hover:text-white"
      >
        <MoreHorizontal className="w-5 h-5 stroke-[1.75]" />
        <span className="text-[10px] tracking-tight">Más</span>
      </button>
    </nav>
  );
};
