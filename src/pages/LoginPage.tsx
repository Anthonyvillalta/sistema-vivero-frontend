import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompanySettings } from '../context/CompanyContext';
import { Lock, User, Eye, EyeOff, ArrowRight, Leaf, AlertCircle, CheckCircle2 } from 'lucide-react';
import { RoleName } from '../types';

const ROLE_LABELS: Record<RoleName, string> = {
  ROLE_ADMIN: ' Administrador',
  ROLE_VENDEDOR: 'Vendedor',
  ROLE_REPARTIDOR: 'Repartidor'
};

const ROLE_ICONS: Record<RoleName, React.ReactNode> = {
  ROLE_ADMIN: '👑',
  ROLE_VENDEDOR: '💼',
  ROLE_REPARTIDOR: '🚚'
};

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { companyName } = useCompanySettings();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const userRole: RoleName = 'ROLE_ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const ok = await login(username, password);
    if (!ok) {
      setError('Usuario o contraseña incorrectos. Inténtalo de nuevo.');
    }
  };

  const isFormValid = username.trim().length > 0 && password.trim().length > 0;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#143627] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-vivero-mint/3 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl animate-in fade-in duration-500"
          style={{ animationDelay: '0ms' }}
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-vivero-mint to-emerald-300 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-white/20">
              <Leaf className="w-8 h-8 text-vivero-dark stroke-[2.5]" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-1">
              {companyName}
            </h1>
            <p className="text-sm text-emerald-200/80 font-medium">
              Sistema de Gestión Viveristica Profesional
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 animate-in slide-in-from-top duration-200">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2 animate-in slide-in-from-top duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-300">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-200 uppercase tracking-wider flex items-center justify-between">
                Usuario
                <span className="text-[10px] text-emerald-300/60">Mínimo 3 caracteres</span>
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-emerald-400/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  required
                  minLength={3}
                  placeholder="ej: admin, vendedor..."
                  className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/20 rounded-2xl text-sm font-medium text-white placeholder-emerald-200/40 focus:outline-none focus:border-vivero-mint/50 focus:ring-2 focus:ring-vivero-mint/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-200 uppercase tracking-wider flex items-center justify-between">
                Contraseña
                <span className="text-[10px] text-emerald-300/60">Mínimo 6 caracteres</span>
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-emerald-400/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                  minLength={6}
                  placeholder="Ingresa tu contraseña"
                  className="w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/20 rounded-2xl text-sm font-medium text-white placeholder-emerald-200/40 focus:outline-none focus:border-vivero-mint/50 focus:ring-2 focus:ring-vivero-mint/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400/50 hover:text-emerald-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
              <div className="text-2xl">{ROLE_ICONS[userRole]}</div>
              <div>
                <p className="text-xs text-emerald-200/60">Acceso como</p>
                <p className="text-sm font-bold text-white">{ROLE_LABELS[userRole]}</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-vivero-mint to-emerald-400 text-vivero-dark font-extrablack text-sm rounded-2xl shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-vivero-dark border-t-transparent rounded-full animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[10px] text-emerald-200/40 font-medium">
              Credenciales predeterminadas • admin / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
