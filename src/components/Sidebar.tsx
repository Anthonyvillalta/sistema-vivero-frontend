import React from 'react';
import {
  LayoutDashboard,
  Sprout,
  FolderTree,
  Boxes,
  ShoppingBag,
  PackageCheck,
  Truck,
  Users,
  Building2,
  Receipt,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Leaf,
  History,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCompanySettings } from '../context/CompanyContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const { companyName } = useCompanySettings();

  const nameParts = companyName.trim().split(' ');
  const firstPart = nameParts[0] || companyName;
  const secondPart = nameParts.slice(1).join(' ');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Productos', icon: Sprout },
    { id: 'categories', label: 'Categorías', icon: FolderTree },
    { id: 'inventory', label: 'Inventario', icon: Boxes },
    { id: 'sales', label: 'Ventas (POS)', icon: ShoppingBag },
    { id: 'sales-history', label: 'Historial Ventas', icon: History },
    { id: 'orders', label: 'Pedidos', icon: PackageCheck },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'suppliers', label: 'Proveedores', icon: Building2 },
    { id: 'drivers', label: 'Repartidores', icon: Truck },
    { id: 'purchases', label: 'Compras', icon: Receipt },
    { id: 'expenses', label: 'Gastos', icon: DollarSign },
    { id: 'reports', label: 'Reportes', icon: BarChart3 },
    { id: 'users', label: 'Usuarios', icon: Shield },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-[#1b4332] text-white min-h-screen fixed left-0 top-0 bottom-0 z-30 shadow-xl select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-vivero-mint to-vivero-light flex items-center justify-center text-vivero-dark font-bold shadow-md flex-shrink-0">
          <Leaf className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div className="min-w-0">
          {secondPart ? (
            <>
              <h1 className="font-extrabold text-xs tracking-wider leading-none text-white uppercase truncate">
                {firstPart}
              </h1>
              <h2 className="font-extrabold text-sm tracking-wider leading-tight text-vivero-mint uppercase truncate">
                {secondPart}
              </h2>
            </>
          ) : (
            <h1 className="font-extrabold text-sm tracking-wider leading-tight text-vivero-mint uppercase truncate">
              {firstPart}
            </h1>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-vivero-emerald to-[#2d6a4f] text-white shadow-md font-semibold'
                  : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-vivero-soft' : 'text-emerald-300/80'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-white/10 bg-[#143627]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover border-2 border-vivero-mint shadow-sm"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">
                {user?.fullName || 'Admin'}
              </p>
              <p className="text-xs text-vivero-mint truncate">
                {user?.role === 'ROLE_ADMIN' ? 'Administrador' : user?.role === 'ROLE_VENDEDOR' ? 'Vendedor' : 'Repartidor'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="p-2 text-emerald-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
