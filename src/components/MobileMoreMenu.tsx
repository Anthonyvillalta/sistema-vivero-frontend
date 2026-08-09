import React from 'react';
import {
  X,
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

interface MobileMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileMoreMenu: React.FC<MobileMoreMenuProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab
}) => {
  const { user, logout } = useAuth();
  const { companyName } = useCompanySettings();

  if (!isOpen) return null;

  const menuModules = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'General' },
    { id: 'products', label: 'Productos', icon: Sprout, category: 'Catálogo' },
    { id: 'categories', label: 'Categorías', icon: FolderTree, category: 'Catálogo' },
    { id: 'inventory', label: 'Inventario', icon: Boxes, category: 'Catálogo', highlight: true },
    { id: 'sales', label: 'Ventas (POS)', icon: ShoppingBag, category: 'Comercial' },
    { id: 'sales-history', label: 'Historial Ventas', icon: History, category: 'Comercial' },
    { id: 'orders', label: 'Pedidos', icon: PackageCheck, category: 'Comercial' },
    { id: 'delivery', label: 'Delivery GPS', icon: Truck, category: 'Logística' },
    { id: 'customers', label: 'Clientes (CRM)', icon: Users, category: 'Comercial' },
    { id: 'suppliers', label: 'Proveedores', icon: Building2, category: 'Compras' },
    { id: 'drivers', label: 'Repartidores', icon: Truck, category: 'Logística' },
    { id: 'purchases', label: 'Compras', icon: Receipt, category: 'Compras' },
    { id: 'expenses', label: 'Gastos Operativos', icon: DollarSign, category: 'Finanzas' },
    { id: 'reports', label: 'Reportes Flujo', icon: BarChart3, category: 'Finanzas' },
    { id: 'users', label: 'Usuarios', icon: Shield, category: 'Sistema' },
    { id: 'settings', label: 'Configuración', icon: Settings, category: 'Sistema' },
  ];

  const handleSelect = (tabId: string) => {
    setActiveTab(tabId);
    onClose();
  };

  return (
    <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex flex-col justify-end">
      <div className="bg-white w-full max-h-[85vh] rounded-t-3xl overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1b4332] text-vivero-mint flex items-center justify-center font-bold">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">
                Todos los Módulos ERP
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Accede a la gestión completa de {companyName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modules Grid */}
        <div className="overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {menuModules.map((module) => {
              const Icon = module.icon;
              const isActive = activeTab === module.id;
              return (
                <button
                  key={module.id}
                  onClick={() => handleSelect(module.id)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all active:scale-95 ${
                    isActive
                      ? 'bg-[#1b4332] text-white border-[#1b4332] shadow-md'
                      : module.highlight
                      ? 'bg-vivero-soft/80 border-vivero-mint text-vivero-dark font-extrabold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-2 rounded-xl ${
                        isActive
                          ? 'bg-white/10 text-vivero-mint'
                          : module.highlight
                          ? 'bg-[#1b4332] text-vivero-mint'
                          : 'bg-white text-vivero-dark shadow-sm'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    {module.highlight && !isActive && (
                      <span className="px-2 py-0.5 bg-[#1b4332] text-vivero-mint text-[9px] font-black rounded-full uppercase">
                        Principal
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-800'}`}>
                      {module.label}
                    </h4>
                    <span className={`text-[10px] font-medium block ${isActive ? 'text-emerald-200' : 'text-slate-400'}`}>
                      {module.category}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover border-2 border-vivero-mint"
            />
            <div>
              <p className="text-xs font-bold text-slate-800">{user?.fullName || 'Admin'}</p>
              <p className="text-[10px] text-vivero-primary font-bold">Administrador General</p>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Salir</span>
          </button>
        </div>

      </div>
    </div>
  );
};
