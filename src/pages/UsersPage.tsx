import React, { useState, useEffect } from 'react';
import {
  Users, Search, Plus, Edit, Trash2, Shield, User as UserIcon,
  Lock, Eye, EyeOff, CheckCircle2, X, Save, AlertCircle
} from 'lucide-react';
import { userApi } from '../services/api';
import { User, RoleName } from '../types';

const ROLE_OPTIONS: { value: RoleName; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'ROLE_ADMIN', label: 'Administrador', color: 'bg-purple-500/10 text-purple-700 border-purple-200', icon: '👑' },
  { value: 'ROLE_VENDEDOR', label: 'Vendedor', color: 'bg-blue-500/10 text-blue-700 border-blue-200', icon: '💼' },
  { value: 'ROLE_REPARTIDOR', label: 'Repartidor', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200', icon: '🚚' },
];

const getRoleLabel = (role: string) => {
  const found = ROLE_OPTIONS.find(r => r.value === role);
  return found ? found.label : role;
};

const getRoleStyle = (role: string) => {
  const found = ROLE_OPTIONS.find(r => r.value === role);
  return found ? found.color : 'bg-slate-100 text-slate-700 border-slate-200';
};

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<Partial<User> & { password?: string }>({});
  const [formError, setFormError] = useState('');

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

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ username: '', fullName: '', email: '', phone: '', role: 'ROLE_VENDEDOR' as RoleName, password: '' });
    setShowPassword(false);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({ fullName: user.fullName, email: user.email || '', phone: user.phone || '', role: user.role, active: user.active });
    setShowPassword(false);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleSave = async () => {
    setFormError('');
    if (!formData.username && !editingUser) {
      setFormError('El nombre de usuario es obligatorio');
      return;
    }
    if (!formData.password && !editingUser) {
      setFormError('La contraseña es obligatoria');
      return;
    }
    if (!formData.fullName) {
      setFormError('El nombre completo es obligatorio');
      return;
    }

    try {
      if (editingUser) {
        await userApi.updateUser(editingUser.id!, {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          roleName: formData.role,
          active: formData.active,
          ...(formData.password ? { password: formData.password } : {})
        });
      } else {
        await userApi.createUser({
          username: formData.username!,
          password: formData.password!,
          fullName: formData.fullName!,
          email: formData.email,
          phone: formData.phone,
          roleName: formData.role
        });
      }
      await fetchUsers();
      setShowModal(false);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Error al guardar usuario');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`¿Estás seguro deEliminar al usuario "${name}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      await userApi.deleteUser(id);
      await fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Error al eliminar el usuario');
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

  return (
    <div className="space-y-6 pb-10">
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Gestión de Usuarios</h1>
          <p className="text-sm text-slate-500 mt-1">Administra usuarios, roles y permisos del sistema</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-vivero-primary hover:bg-vivero-emerald text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre de usuario, nombre completo o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-vivero-mint focus:border-transparent transition-all"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80">
                <th className="text-left py-3 px-4 font-black text-slate-700 text-xs uppercase">Usuario</th>
                <th className="text-left py-3 px-4 font-black text-slate-700 text-xs uppercase">Nombre</th>
                <th className="text-left py-3 px-4 font-black text-slate-700 text-xs uppercase">Email</th>
                <th className="text-center py-3 px-4 font-black text-slate-700 text-xs uppercase">Rol</th>
                <th className="text-center py-3 px-4 font-black text-slate-700 text-xs uppercase">Estado</th>
                <th className="text-right py-3 px-4 font-black text-slate-700 text-xs uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100/80 last:border-0">
                    <td className="py-3 px-4"><div className="h-4 w-28 bg-slate-200 rounded animate-pulse" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-32 bg-slate-200 rounded animate-pulse" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-40 bg-slate-200 rounded animate-pulse" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse mx-auto" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-16 bg-slate-200 rounded animate-pulse mx-auto" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No se encontraron usuarios</p>
                    <p className="text-xs mt-1">Ajusta tu búsqueda o crea un nuevo usuario</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id || u.username} className="border-b border-slate-100/80 last:border-0 hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-vivero-soft flex items-center justify-center text-vivero-primary font-black text-xs">
                          {u.fullName?.[0] || u.username?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {u.email || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleStyle(u.role)}`}>
                        {u.role === 'ROLE_ADMIN' ? '👑' : u.role === 'ROLE_VENDEDOR' ? '💼' : '🚚'} {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.active === false ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                          Inactivo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Activo
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={u.active ? 'Desactivar usuario' : 'Activar usuario'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.active
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.active ? <Shield className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          title="Editar usuario"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id!, u.fullName || u.username)}
                          title="Eliminar usuario"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Count Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card">
          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Usuarios</p>
          <p className="text-2xl font-black text-slate-800">{users.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card">
          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Administradores</p>
          <p className="text-2xl font-black text-purple-700">{users.filter(u => u.role === 'ROLE_ADMIN').length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card">
          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Activos</p>
          <p className="text-2xl font-black text-emerald-700">{users.filter(u => u.active !== false).length}</p>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-slate-800">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{formError}</p>
              </div>
            )}

            <div className="space-y-4">
              {!editingUser && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Nombre de Usuario</label>
                  <input
                    type="text"
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="ej: juanito"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-vivero-mint focus:border-transparent transition-all"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Nombre Completo</label>
                <input
                  type="text"
                  value={formData.fullName || ''}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Nombre completo"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-vivero-mint focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@ejemplo.com"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-vivero-mint focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+51 9..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-vivero-mint focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Rol de Acceso</label>
                <select
                  value={formData.role || 'ROLE_VENDEDOR'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as RoleName })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-vivero-mint focus:border-transparent transition-all"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {!editingUser && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-vivero-mint focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {editingUser && formData.password !== undefined && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase flex items-center justify-between">
                    <span>Nueva Contraseña (opcional)</span>
                    <label className="text-xs font-medium text-slate-500 flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.checked ? '' : undefined })}
                        className="w-3 h-3 rounded"
                      />
                      Cambiar
                    </label>
                  </label>
                  {formData.password !== undefined && (
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password || ''}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Nueva contraseña"
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-vivero-mint focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active !== false}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded text-vivero-primary focus:ring-vivero-mint"
                />
                <label htmlFor="active" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Usuario activo
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 bg-vivero-primary hover:bg-vivero-emerald text-white font-black rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {editingUser ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
