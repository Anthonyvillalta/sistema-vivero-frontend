import React, { useState, useEffect } from 'react';
import {
  Users, Search, Plus, Edit2, Trash2, Shield, User as UserIcon,
  Lock, Eye, EyeOff, CheckCircle2, X, Save, AlertCircle,
  Crown, Briefcase, Truck, Mail, Phone, LayoutGrid, List,
  RefreshCw, KeyRound, Check, ShieldAlert, Sparkles, UserCheck
} from 'lucide-react';
import { userApi } from '../services/api';
import { User, RoleName } from '../types';

const ROLE_OPTIONS: { value: RoleName; label: string; desc: string; color: string; badge: string; icon: React.ReactNode }[] = [
  {
    value: 'ROLE_ADMIN',
    label: 'Administrador General',
    desc: 'Acceso total a reportes gerenciales, finanzas, configuración y usuarios.',
    color: 'border-purple-500/30 bg-purple-500/5 text-purple-900',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: <Crown className="w-5 h-5 text-purple-600" />
  },
  {
    value: 'ROLE_VENDEDOR',
    label: 'Vendedor POS',
    desc: 'Acceso a ventas POS, catálogo de productos, clientes e historial.',
    color: 'border-blue-500/30 bg-blue-500/5 text-blue-900',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Briefcase className="w-5 h-5 text-blue-600" />
  },
  {
    value: 'ROLE_REPARTIDOR',
    label: 'Repartidor Delivery',
    desc: 'Acceso al módulo de entregas, rutas GPS y pedidos asignados.',
    color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-900',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: <Truck className="w-5 h-5 text-emerald-600" />
  },
];

const getRoleBadgeStyle = (role: string) => {
  const found = ROLE_OPTIONS.find(r => r.value === role);
  return found ? found.badge : 'bg-slate-100 text-slate-700 border-slate-200';
};

const getRoleLabel = (role: string) => {
  const found = ROLE_OPTIONS.find(r => r.value === role);
  return found ? found.label : role;
};

const getRoleIcon = (role: string) => {
  if (role === 'ROLE_ADMIN') return <Crown className="w-4 h-4 text-purple-600" />;
  if (role === 'ROLE_REPARTIDOR') return <Truck className="w-4 h-4 text-emerald-600" />;
  return <Briefcase className="w-4 h-4 text-blue-600" />;
};

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'TODOS' | RoleName>('TODOS');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassModal, setShowPassModal] = useState(false);
  const [passUser, setPassUser] = useState<User | null>(null);

  // Form State
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<Partial<User> & { password?: string }>({});
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userApi.getAllUsers();
      if (res?.data) setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers().finally(() => setRefreshing(false));
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));

    const matchesRole = roleFilter === 'TODOS' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'TODOS' ||
      (statusFilter === 'ACTIVOS' && u.active !== false) ||
      (statusFilter === 'INACTIVOS' && u.active === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      fullName: '',
      email: '',
      phone: '',
      role: 'ROLE_VENDEDOR' as RoleName,
      password: '',
      active: true
    });
    setShowPassword(false);
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      active: user.active !== false
    });
    setShowPassword(false);
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const openPassModal = (user: User) => {
    setPassUser(user);
    setNewPasswordVal('');
    setShowPassword(false);
    setFormError('');
    setFormSuccess('');
    setShowPassModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowPassModal(false);
  };

  const handleSave = async () => {
    setFormError('');
    setFormSuccess('');

    if (!editingUser) {
      if (!formData.username?.trim()) {
        setFormError('El correo electrónico / usuario es obligatorio.');
        return;
      }
      if (!formData.password || formData.password.length < 5) {
        setFormError('La contraseña debe tener al menos 5 caracteres.');
        return;
      }
    }

    if (!formData.fullName?.trim()) {
      setFormError('El nombre completo es obligatorio.');
      return;
    }

    try {
      if (editingUser) {
        await userApi.updateUser(editingUser.id!, {
          fullName: formData.fullName.trim(),
          email: formData.email?.trim() || undefined,
          phone: formData.phone?.trim() || undefined,
          roleName: formData.role,
          active: formData.active,
          ...(formData.password ? { password: formData.password } : {})
        });
        setFormSuccess('Usuario actualizado correctamente');
      } else {
        await userApi.createUser({
          username: formData.username!.trim().toLowerCase(),
          password: formData.password!.trim(),
          fullName: formData.fullName.trim(),
          email: formData.email?.trim() || formData.username!.trim().toLowerCase(),
          phone: formData.phone?.trim() || undefined,
          roleName: formData.role || 'ROLE_VENDEDOR'
        });
        setFormSuccess('Usuario registrado correctamente');
      }

      await fetchUsers();
      setTimeout(() => closeModal(), 400);
    } catch (err: any) {
      console.error('Error saving user:', err);
      let msg = 'No se pudo guardar el usuario en la base de datos.';
      if (err.response?.data?.message) msg = err.response.data.message;
      setFormError(msg);
    }
  };

  const handleResetPasswordSubmit = async () => {
    if (!passUser || !newPasswordVal || newPasswordVal.length < 5) {
      setFormError('La nueva contraseña debe tener al menos 5 caracteres.');
      return;
    }

    try {
      await userApi.resetPassword(passUser.id!, newPasswordVal.trim());
      setFormSuccess('Contraseña restablecida correctamente');
      await fetchUsers();
      setTimeout(() => closeModal(), 500);
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setFormError(err.response?.data?.message || 'Error al restablecer la contraseña');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario "${name}"?\nEsta acción es permanente.`)) return;
    try {
      await userApi.deleteUser(id);
      await fetchUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert(err.response?.data?.message || 'Error al eliminar el usuario');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await userApi.toggleUserStatus(user.id!);
      await fetchUsers();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const countAdmins = users.filter(u => u.role === 'ROLE_ADMIN').length;
  const countVendedores = users.filter(u => u.role === 'ROLE_VENDEDOR').length;
  const countRepartidores = users.filter(u => u.role === 'ROLE_REPARTIDOR').length;
  const countActivos = users.filter(u => u.active !== false).length;

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 lg:pb-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f2e1f] via-[#1b4332] to-[#2d6a4f] rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-xl">
        <div className="absolute -top-20 -right-16 w-40 sm:w-64 h-40 sm:h-64 rounded-full bg-vivero-mint/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-12 w-48 sm:w-72 h-48 sm:h-72 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/10 border border-vivero-mint/25 shadow-inner flex-shrink-0">
                <Users className="w-5 h-5 sm:w-7 sm:h-7 text-vivero-mint" />
              </div>
              <div>
                <h1 className="text-base sm:text-2xl font-black leading-tight tracking-tight">Gestión de Usuarios & Permisos</h1>
                <p className="text-[11px] sm:text-xs text-emerald-200/90 font-medium mt-0.5">
                  Administra accesos, roles y credenciales de seguridad del sistema ERP
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white active:scale-95 disabled:opacity-50"
                title="Actualizar lista de usuarios"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={openCreateModal}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-vivero-mint text-vivero-dark text-xs sm:text-sm font-black hover:bg-white active:scale-95 transition-all shadow-lg shadow-vivero-mint/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Nuevo Usuario</span>
              </button>
            </div>
          </div>

          {/* KPI Mini Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-5 pt-4 border-t border-white/10">
            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-white/10">
              <div className="flex items-center gap-1.5 text-emerald-200 text-[10px] sm:text-xs font-bold uppercase">
                <Users className="w-3.5 h-3.5 text-vivero-mint" />
                <span>Total Usuarios</span>
              </div>
              <p className="text-lg sm:text-2xl font-black text-white mt-1 leading-none">{users.length}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-white/10">
              <div className="flex items-center gap-1.5 text-purple-200 text-[10px] sm:text-xs font-bold uppercase">
                <Crown className="w-3.5 h-3.5 text-purple-300" />
                <span>Admins</span>
              </div>
              <p className="text-lg sm:text-2xl font-black text-white mt-1 leading-none">{countAdmins}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-white/10">
              <div className="flex items-center gap-1.5 text-blue-200 text-[10px] sm:text-xs font-bold uppercase">
                <Briefcase className="w-3.5 h-3.5 text-blue-300" />
                <span>Vendedores</span>
              </div>
              <p className="text-lg sm:text-2xl font-black text-white mt-1 leading-none">{countVendedores}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-white/10">
              <div className="flex items-center gap-1.5 text-emerald-200 text-[10px] sm:text-xs font-bold uppercase">
                <UserCheck className="w-3.5 h-3.5 text-vivero-mint" />
                <span>Activos</span>
              </div>
              <p className="text-lg sm:text-2xl font-black text-vivero-mint mt-1 leading-none">{countActivos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por usuario, correo o teléfono..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-vivero-primary focus:ring-2 focus:ring-vivero-mint/30 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle & Status Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            
            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-vivero-primary"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="ACTIVOS">Solo Activos ✓</option>
              <option value="INACTIVOS">Solo Inactivos 🚫</option>
            </select>

            {/* View Mode Grid/Table */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-vivero-primary shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista en Tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-vivero-primary shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista en Tabla"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Role Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setRoleFilter('TODOS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition-all border ${
              roleFilter === 'TODOS'
                ? 'bg-[#1b4332] text-vivero-mint border-[#1b4332] shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Todos ({users.length})
          </button>

          {ROLE_OPTIONS.map(role => (
            <button
              key={role.value}
              onClick={() => setRoleFilter(role.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition-all border ${
                roleFilter === role.value
                  ? 'bg-[#1b4332] text-vivero-mint border-[#1b4332] shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              {role.icon}
              {role.label} ({users.filter(u => u.role === role.value).length})
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3 w-1/2 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="h-10 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-800">No se encontraron usuarios</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Ajusta los filtros o crea un nuevo usuario del sistema.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-vivero-primary text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Crear Usuario
          </button>
        </div>
      ) : viewMode === 'grid' ? (

        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredUsers.map((u) => {
            const isUserActive = u.active !== false;
            return (
              <div
                key={u.id || u.username}
                className={`bg-white rounded-2xl border shadow-2xs p-4 flex flex-col justify-between gap-3 transition-all hover:shadow-card ${
                  !isUserActive ? 'border-red-200 bg-red-50/20 opacity-85' : 'border-slate-200/80'
                }`}
              >
                {/* User Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-vivero-mint flex items-center justify-center font-black text-sm shadow-md flex-shrink-0">
                        {u.fullName?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          isUserActive ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                        title={isUserActive ? 'Usuario Activo' : 'Usuario Inactivo'}
                      />
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-800 text-sm truncate leading-snug">
                        {u.fullName}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          @{u.username}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 flex-shrink-0 ${getRoleBadgeStyle(u.role)}`}>
                    {getRoleIcon(u.role)}
                    <span>{getRoleLabel(u.role)}</span>
                  </span>
                </div>

                {/* Contact Details */}
                <div className="bg-slate-50/80 rounded-xl p-2.5 space-y-1.5 text-xs border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600 truncate">
                    <Mail className="w-3.5 h-3.5 text-vivero-primary flex-shrink-0" />
                    <span className="truncate font-semibold text-[11px]">
                      {u.email || 'Sin correo registrado'}
                    </span>
                  </div>
                  {u.phone && (
                    <div className="flex items-center justify-between text-slate-600">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-vivero-primary flex-shrink-0" />
                        <span className="font-semibold text-[11px]">{u.phone}</span>
                      </div>
                      <a
                        href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md hover:bg-emerald-200 transition-colors"
                      >
                        WhatsApp
                      </a>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-colors ${
                        isUserActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      {isUserActive ? 'Activo ✓' : 'Inactivo 🚫'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openPassModal(u)}
                      className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Restablecer Contraseña"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(u)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Editar Usuario"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id!, u.fullName || u.username)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      title="Eliminar Usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      ) : (

        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-extrabold uppercase">
                  <th className="py-3 px-4 text-left">Usuario / Nombre</th>
                  <th className="py-3 px-4 text-left">Correo Electrónico</th>
                  <th className="py-3 px-4 text-left">Teléfono</th>
                  <th className="py-3 px-4 text-center">Rol Asignado</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredUsers.map((u) => {
                  const isUserActive = u.active !== false;
                  return (
                    <tr key={u.id || u.username} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#1b4332] text-vivero-mint flex items-center justify-center font-black text-xs">
                            {u.fullName?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 text-xs">{u.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">@{u.username}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {u.email || <span className="text-slate-300">—</span>}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {u.phone || <span className="text-slate-300">—</span>}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border inline-flex items-center gap-1 ${getRoleBadgeStyle(u.role)}`}>
                          {getRoleIcon(u.role)}
                          <span>{getRoleLabel(u.role)}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isUserActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isUserActive ? 'Activo ✓' : 'Inactivo 🚫'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                            title={isUserActive ? 'Desactivar' : 'Activar'}
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openPassModal(u)}
                            className="p-1 rounded-lg text-amber-600 hover:bg-amber-50"
                            title="Restablecer Contraseña"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1 rounded-lg text-slate-600 hover:bg-slate-100"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id!, u.fullName || u.username)}
                            className="p-1 rounded-lg text-red-500 hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* CREATE / EDIT USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-vivero-soft text-vivero-dark">
                  <UserIcon className="w-5 h-5 text-vivero-primary" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800">
                    {editingUser ? 'Editar Usuario ERP' : 'Nuevo Usuario ERP'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {editingUser ? 'Modifica permisos o datos personales' : 'Asigna rol y credenciales de acceso'}
                  </p>
                </div>
              </div>

              <button
                onClick={closeModal}
                className="p-1.5 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-semibold">{formError}</p>
              </div>
            )}

            {formSuccess && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-700 font-semibold">{formSuccess}</p>
              </div>
            )}

            <div className="space-y-4 my-4 max-h-[65vh] overflow-y-auto no-scrollbar pr-1">
              
              {/* Role Cards Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Selecciona el Rol de Acceso
                </label>

                <div className="grid grid-cols-1 gap-2">
                  {ROLE_OPTIONS.map((opt) => {
                    const isSelected = (formData.role || 'ROLE_VENDEDOR') === opt.value;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => setFormData({ ...formData, role: opt.value })}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? `${opt.color} border-2 shadow-2xs`
                            : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-white shadow-2xs flex-shrink-0">
                          {opt.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-black text-xs text-slate-900">{opt.label}</p>
                            {isSelected && <Check className="w-4 h-4 text-vivero-primary stroke-[3]" />}
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">
                            {opt.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                
                {/* Email / Username */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700">Correo Electrónico / Usuario</label>
                  <input
                    type="text"
                    disabled={!!editingUser}
                    value={formData.username || ''}
                    onChange={e => setFormData({ ...formData, username: e.target.value, email: e.target.value })}
                    placeholder="ej: usuario@vivero.pe"
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${
                      editingUser
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                        : 'bg-white border-slate-200 focus:border-vivero-primary focus:outline-none'
                    }`}
                  />
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700">Nombre Completo</label>
                  <input
                    type="text"
                    value={formData.fullName || ''}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="ej: Carlos Pérez"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-vivero-primary focus:outline-none"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+51 987654321"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-vivero-primary focus:outline-none"
                  />
                </div>

                {/* Password (for new user) */}
                {!editingUser && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700">Contraseña de Acceso</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password || ''}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Mínimo 5 caracteres"
                        className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-vivero-primary focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Status Switch */}
              <div className="flex items-center gap-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-extrabold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.active !== false}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded text-vivero-primary focus:ring-vivero-mint"
                  />
                  <span>Usuario Activo en el ERP</span>
                </label>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-vivero-primary text-white text-xs font-extrabold hover:bg-vivero-emerald active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{editingUser ? 'Guardar Cambios' : 'Registrar Usuario'}</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* RESET PASSWORD DEDICATED MODAL */}
      {showPassModal && passUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Restablecer Contraseña</h3>
                  <p className="text-[10px] text-slate-400 font-medium">@{passUser.username}</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold">
                {formSuccess}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 block">Nueva Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPasswordVal}
                  onChange={e => setNewPasswordVal(e.target.value)}
                  placeholder="Mínimo 5 caracteres"
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-vivero-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={closeModal}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPasswordSubmit}
                className="flex-1 py-2 rounded-xl bg-amber-600 text-white text-xs font-extrabold shadow-md hover:bg-amber-700"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
