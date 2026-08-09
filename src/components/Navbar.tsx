import React from 'react';
import { Search, Bell, Calendar, ShoppingCart, Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCompanySettings } from '../context/CompanyContext';

interface NavbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({ searchTerm, setSearchTerm, activeTab }) => {
  const { user } = useAuth();
  const { items, setIsCartOpen, cartBump } = useCart();
  const { companyName } = useCompanySettings();
  const totalCartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const now = new Date();
  const todayLabel = `Hoy, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return '¡Bienvenido, ' + (user?.fullName || 'Admin') + '!';
      case 'products': return 'Gestión de Productos';
      case 'categories': return 'Categorías de Productos';
      case 'inventory': return 'Control de Inventario';
      case 'sales': return 'Punto de Venta (POS)';
      case 'sales-history': return 'Historial de Ventas';
      case 'orders': return 'Gestión de Pedidos';
      case 'delivery': return 'Rutas y Delivery';
      case 'customers': return 'Clientes y CRM';
      case 'suppliers': return 'Proveedores';
      case 'purchases': return 'Compras a Proveedores';
      case 'expenses': return 'Control Financiero y Gastos';
      case 'reports': return 'Reportes Gerenciales';
      default: return companyName;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-sm">
      {/* Mobile Logo Brand Header */}
      <div className="flex lg:hidden items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-vivero-dark flex items-center justify-center text-vivero-mint shadow-sm">
          <Leaf className="w-5 h-5" />
        </div>
        <span className="font-extrabold text-vivero-dark text-sm tracking-tight truncate max-w-[180px]">
          {companyName.toUpperCase()}
        </span>
      </div>

      {/* Desktop Header Title & Search */}
      <div className="hidden lg:flex items-center gap-6 flex-1 max-w-2xl">
        <div>
          <h1 className="text-xl font-bold text-slate-800 leading-snug">
            {getTitle()}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Aquí tienes el resumen general de tu negocio.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="hidden md:flex items-center relative flex-1 max-w-xs mx-4">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar..."
          className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-sm rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-vivero-primary/30 transition-all border border-transparent focus:border-vivero-mint/50"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Date Pill: always shows today's real date */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200/60">
          <span>{todayLabel}</span>
          <Calendar className="w-4 h-4 text-vivero-primary" />
        </div>

        {/* Cart Trigger Button for Mobile/Desktop */}
        <button
          data-cart-trigger
          onClick={() => setIsCartOpen(true)}
          className="relative p-2.5 bg-slate-100 hover:bg-vivero-soft text-slate-700 hover:text-vivero-dark rounded-xl transition-all"
          title="Ver Carrito / POS"
        >
          <span key={cartBump} className="cart-bump">
            <ShoppingCart className="w-5 h-5" />
          </span>
          {totalCartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-vivero-mint text-vivero-dark text-xs font-black rounded-full flex items-center justify-center border-2 border-white">
              {totalCartCount}
            </span>
          )}
        </button>

        {/* Notification Bell */}
        <button
          className="relative p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
          title="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            3
          </span>
        </button>
      </div>
    </header>
  );
};
