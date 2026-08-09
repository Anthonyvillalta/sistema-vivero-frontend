import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompanySettings } from '../context/CompanyContext';
import {
  Lock, Mail, Eye, EyeOff, ArrowRight, Leaf, AlertCircle,
  CheckCircle2, ShieldCheck, Sparkles, Store, Truck, BarChart3, KeyRound
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { companyName } = useCompanySettings();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Detect Caps Lock
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState('CapsLock')) {
      setCapsLockOn(true);
    } else {
      setCapsLockOn(false);
    }
  };

  // Quick fill handler
  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const ok = await login(email, password);
    if (!ok) {
      setError('Correo electrónico o contraseña incorrectos. Verifica tus datos.');
    }
  };

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#0a1f18] flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans select-none">
      
      {/* Dynamic Animated Ambient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-emerald-500/15 to-vivero-mint/10 rounded-full blur-[120px] animate-pulse duration-1000" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-[#1b4332]/40 to-emerald-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[160px]" />
        
        {/* Subtle SVG Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2352b788' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Main Container Card */}
      <div className="relative w-full max-w-5xl bg-slate-900/80 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl sm:rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[520px] lg:min-h-[580px]">
        
        {/* LEFT COLUMN: Hero Brand & Feature Showcase (Visible on lg screens) */}
        <div className="hidden lg:flex lg:col-span-6 relative flex-col justify-between p-10 bg-gradient-to-br from-[#1b4332]/90 via-[#143627]/95 to-[#0b2219] border-r border-emerald-500/15 overflow-hidden">
          
          {/* Background Image with Gradient Overlay */}
          <div className="absolute inset-0 opacity-20 mix-blend-overlay">
            <img 
              src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80" 
              alt="Vivero Background" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Top Brand Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-vivero-mint via-emerald-400 to-vivero-light p-0.5 shadow-lg shadow-emerald-900/40">
              <div className="w-full h-full bg-[#1b4332] rounded-[14px] flex items-center justify-center">
                <Leaf className="w-6 h-6 text-vivero-mint stroke-[2.5]" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight leading-none uppercase">
                {companyName}
              </h2>
              <span className="text-[10px] font-extrabold text-vivero-mint uppercase tracking-widest bg-vivero-mint/10 border border-vivero-mint/20 px-2 py-0.5 rounded-full inline-block mt-1">
                ERP Empresarial v2.0
              </span>
            </div>
          </div>

          {/* Middle Hero Content */}
          <div className="relative z-10 space-y-6 my-auto py-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-vivero-mint" />
              <span>Gestión Viverística Inteligente</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight">
              Control total de tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-vivero-mint via-emerald-300 to-teal-200">vivero y ventas POS</span>
            </h1>

            <p className="text-xs xl:text-sm text-emerald-200/70 font-medium leading-relaxed">
              Plataforma integral para inventario de plantas, facturación electrónica POS, logística GPS de delivery y analítica gerencial.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <Store className="w-4 h-4 text-vivero-mint" />
                <span className="text-xs font-bold text-slate-200">POS Multicaja</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Delivery GPS</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <BarChart3 className="w-4 h-4 text-teal-300" />
                <span className="text-xs font-bold text-slate-200">Reportes Flujo</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 text-vivero-mint" />
                <span className="text-xs font-bold text-slate-200">Seguridad SSL</span>
              </div>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10 text-[11px] font-bold text-emerald-200/50">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Conexión Encriptada SSL 256-bit
            </span>
            <span>{companyName || 'Sistema Vivero'} ERP © {new Date().getFullYear()}</span>
          </div>
        </div>


        {/* RIGHT COLUMN: Modern Form Section */}
        <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-slate-900/90 relative">
          
          {/* Header Mobile Brand (Only shown on small screens) */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-vivero-mint via-emerald-400 to-vivero-light p-0.5 mx-auto mb-3 shadow-lg shadow-emerald-900/40">
              <div className="w-full h-full bg-[#1b4332] rounded-[14px] flex items-center justify-center">
                <Leaf className="w-7 h-7 text-vivero-mint stroke-[2.5]" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">
              {companyName}
            </h2>
            <p className="text-xs text-emerald-300/70 font-semibold mt-0.5">
              Sistema ERP & PWA de Gestión
            </p>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Iniciar Sesión
              <KeyRound className="w-5 h-5 text-vivero-mint" />
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
              Ingresa tus credenciales para acceder al panel de control
            </p>
          </div>

          {/* Alert Error Box */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2.5 animate-in slide-in-from-top duration-200">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-200">Error de Autenticación</p>
                <p className="text-xs text-red-300/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Alert Success Box */}
          {success && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-2.5 animate-in slide-in-from-top duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-emerald-200">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 my-auto">
            
            {/* Field: Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Correo Electrónico</span>
                <span className="text-[10px] text-emerald-400/80 font-semibold">Obligatorio</span>
              </label>

              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-focus-within:bg-vivero-mint/10 transition-colors">
                  <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-vivero-mint transition-colors" />
                </div>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  required
                  placeholder="ej: admin@vivero.com"
                  className="w-full pl-13 pr-4 py-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-vivero-mint focus:ring-2 focus:ring-vivero-mint/20 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Field: Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Contraseña
                </label>
                {capsLockOn && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                    ⚠️ BLOQ MAYÚS activo
                  </span>
                )}
              </div>

              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-focus-within:bg-vivero-mint/10 transition-colors">
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-vivero-mint transition-colors" />
                </div>

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={handleKeyDown}
                  required
                  minLength={5}
                  placeholder="Ingresa tu contraseña"
                  className="w-full pl-13 pr-12 py-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-vivero-mint focus:ring-2 focus:ring-vivero-mint/20 transition-all shadow-inner"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  tabIndex={-1}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs py-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md bg-slate-800 border-slate-700 text-vivero-mint focus:ring-vivero-mint focus:ring-offset-slate-900"
                />
                <span>Recordar mi sesión</span>
              </label>

              <span className="text-vivero-mint/70 hover:text-vivero-mint font-bold text-[11px] cursor-pointer">
                ¿Soporte técnico?
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="relative w-full py-4 bg-gradient-to-r from-vivero-mint via-emerald-400 to-teal-300 text-vivero-dark font-black text-sm rounded-2xl shadow-lg shadow-emerald-950/50 hover:shadow-vivero-mint/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden group"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-vivero-dark border-t-transparent rounded-full animate-spin" />
                  <span>Validando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Demo Credentials Pill */}
            <div className="pt-3 text-center border-t border-slate-800/80 mt-4">
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                Credenciales Demo de prueba:
              </p>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@vivero.com', 'admin123')}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800/90 hover:bg-vivero-mint/10 border border-slate-700/80 hover:border-vivero-mint/40 rounded-xl text-xs font-bold text-slate-300 hover:text-vivero-mint transition-all active:scale-95"
                title="Hic clic para autocompletar credenciales de prueba demo"
              >
                <span>admin@vivero.com</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-mono">admin123</span>
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};
