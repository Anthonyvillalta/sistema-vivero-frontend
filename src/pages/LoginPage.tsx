import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompanySettings } from '../context/CompanyContext';
import { Leaf, Lock, User, ArrowRight } from 'lucide-react';
import { RoleName } from '../types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { companyName } = useCompanySettings();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [role, setRole] = useState<RoleName>('ROLE_ADMIN');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, role, 'mock-jwt-token', username === 'admin' ? 'Administrador' : username);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#143627] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-vivero-soft text-vivero-dark rounded-2xl flex items-center justify-center mx-auto shadow-md border border-vivero-mint/30">
            <Leaf className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
            {companyName}
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Sistema ERP & PWA Empresarial
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase">Usuario</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-vivero-primary/30"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-vivero-primary/30"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase">Rol de Acceso</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as RoleName)}
              className="w-full px-4 py-3 bg-slate-100 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="ROLE_ADMIN">Administrador (Acceso Completo)</option>
              <option value="ROLE_VENDEDOR">Vendedor (Ventas & Pedidos)</option>
              <option value="ROLE_REPARTIDOR">Repartidor (Delivery & Rutas)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-vivero-dark hover:bg-vivero-primary text-vivero-mint font-extrabold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all mt-4"
          >
            <span>Ingresar al Sistema</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
