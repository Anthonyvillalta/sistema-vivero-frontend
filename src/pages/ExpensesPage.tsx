import React, { useState, useEffect } from 'react';
import { Expense } from '../types';
import { expenseApi } from '../services/api';
import { LeavesLoader } from '../components/LeavesLoader';
import {
  Truck,
  Wrench,
  Users,
  Package,
  Search,
  Plus,
  X,
  Receipt,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';

const CATEGORIES = [
  { id: 'TRANSPORTE', label: 'Transporte', icon: Truck, tile: 'bg-blue-100 text-blue-700' },
  { id: 'PERSONAL', label: 'Personal', icon: Users, tile: 'bg-emerald-100 text-[#1b4332]' },
  { id: 'INSUMOS', label: 'Insumos', icon: Package, tile: 'bg-purple-100 text-purple-700' },
  { id: 'MANTENIMIENTO', label: 'Mantenimiento', icon: Wrench, tile: 'bg-amber-100 text-amber-700' },
  { id: 'OTROS', label: 'Otros', icon: Receipt, tile: 'bg-slate-100 text-slate-600' }
];

const PAYMENT_METHODS = ['EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA'];

const categoryConfig = (id: string) =>
  CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

const formatDate = (d?: string) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return (
    dt.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' • ' +
    dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  );
};

const isThisMonth = (d?: string) => {
  if (!d) return false;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return false;
  const now = new Date();
  return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
};

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('TODOS');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [expCategory, setExpCategory] = useState('TRANSPORTE');
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPaymentMethod, setExpPaymentMethod] = useState('EFECTIVO');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchExpenses = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await expenseApi.getRecentExpenses();
      if (res.data) setExpenses(res.data);
    } catch (err) {
      console.error('Error al cargar gastos desde MySQL:', err);
      setLoadError('No se pudieron cargar los gastos desde la base de datos MySQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    const handleBackendOnline = () => fetchExpenses();
    window.addEventListener('vivero_backend_online', handleBackendOnline);
    return () => window.removeEventListener('vivero_backend_online', handleBackendOnline);
  }, []);

  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  // Metrics (100% desde BD)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthTotal = expenses.filter(e => isThisMonth(e.expenseDate)).reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter(e => {
    const query = search.toLowerCase();
    const matchesSearch =
      e.description.toLowerCase().includes(query) ||
      e.category.toLowerCase().includes(query) ||
      e.paymentMethod.toLowerCase().includes(query);

    if (!matchesSearch) return false;
    if (activeCategoryTab === 'TODOS') return true;
    return e.category === activeCategoryTab;
  });

  // Logic: newest first
  const sortedExpenses = [...filteredExpenses].sort(
    (a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
  );

  const openNewExpense = () => {
    setExpCategory('TRANSPORTE');
    setExpDescription('');
    setExpAmount('');
    setExpPaymentMethod('EFECTIVO');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expAmount) || 0;
    if (!expDescription.trim()) {
      setFormError('La descripción del gasto es requerida.');
      return;
    }
    if (amount <= 0) {
      setFormError('El monto debe ser mayor a cero.');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      await expenseApi.createExpense({
        category: expCategory,
        description: expDescription.trim(),
        amount,
        paymentMethod: expPaymentMethod
      });
      await fetchExpenses();
      setIsAddModalOpen(false);
      setSuccessMsg('Gasto operativo registrado en MySQL.');
    } catch (err: any) {
      console.error('Error al guardar gasto en MySQL:', err);
      const msg = err.response?.data?.message || err.message || 'No se pudo guardar el gasto en la base de datos MySQL.';
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3 pb-24 lg:pb-8">
      {/* Compact Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gradient-to-br from-red-900 to-red-700 rounded-2xl p-2.5 text-white shadow-lg">
          <TrendingDown className="w-4 h-4 text-red-200 mb-1.5" />
          <span className="block text-lg font-black leading-none">
            {totalExpenses >= 1000 ? `S/ ${(totalExpenses / 1000).toFixed(1)}k` : `S/ ${totalExpenses.toFixed(0)}`}
          </span>
          <span className="text-[9px] font-bold text-red-200 mt-1 block">Total Egresos</span>
        </div>

        <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-card">
          <Calendar className="w-4 h-4 text-vivero-primary mb-1.5" />
          <span className="block text-lg font-black text-[#1b4332] leading-none">
            {thisMonthTotal >= 1000 ? `S/ ${(thisMonthTotal / 1000).toFixed(1)}k` : `S/ ${thisMonthTotal.toFixed(0)}`}
          </span>
          <span className="text-[9px] font-bold text-slate-400 mt-1 block">Este Mes</span>
        </div>

        <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-card">
          <Receipt className="w-4 h-4 text-amber-500 mb-1.5" />
          <span className="block text-lg font-black text-slate-800 leading-none">{expenses.length}</span>
          <span className="text-[9px] font-bold text-slate-400 mt-1 block">Registros</span>
        </div>
      </div>

      {loadError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Category Tabs */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-card space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por descripción, categoría o pago..."
            className="w-full pl-8 pr-12 py-2 bg-slate-100 focus:bg-white text-xs font-semibold text-slate-800 rounded-xl border border-transparent focus:border-vivero-mint/60 focus:outline-none transition-all"
          />
          <button
            onClick={openNewExpense}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-all"
            title="Registrar Gasto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[{ id: 'TODOS', label: 'Todos', icon: Receipt }, ...CATEGORIES.map(c => ({ id: c.id, label: c.label, icon: c.icon }))].map(tab => {
            const Icon = tab.icon;
            const isActive = activeCategoryTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategoryTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap flex items-center gap-1 transition-all ${
                  isActive
                    ? 'bg-[#1b4332] text-vivero-mint shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-2.5">
        {loading ? (
          <LeavesLoader compact message="Cargando gastos desde MySQL..." />
        ) : sortedExpenses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-1.5">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-extrabold text-slate-500">Sin gastos que coincidan</p>
            <p className="text-[10px] text-slate-400 font-semibold">Toca + para registrar un gasto operativo</p>
          </div>
        ) : (
          sortedExpenses.map(expense => {
            const cfg = categoryConfig(expense.category);
            const Icon = cfg.icon;
            return (
              <div
                key={expense.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden"
              >
                <div className="px-3.5 pt-3 pb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${cfg.tile}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-800 text-xs leading-tight truncate">
                        {expense.description}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
                        {formatDate(expense.expenseDate)} • por {expense.registeredBy || 'admin'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-black text-red-600 text-sm block">- S/ {expense.amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="px-3.5 pb-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${cfg.tile}`}>
                    {expense.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Pago: <strong className="text-slate-600">{expense.paymentMethod}</strong>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Register New Expense */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-200 my-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">Registrar Gasto Operativo</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-2.5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="block font-black text-red-800">Error al registrar gasto:</span>
                    <span className="block font-normal mt-0.5">{formError}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-1">Categoría del Gasto</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.map(c => {
                    const Icon = c.icon;
                    const isActive = expCategory === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setExpCategory(c.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-extrabold transition-all ${
                          isActive
                            ? 'bg-[#1b4332] text-vivero-mint shadow-md'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">Descripción Detallada</label>
                <input
                  type="text"
                  value={expDescription}
                  onChange={e => setExpDescription(e.target.value)}
                  placeholder="Ej. Combustible para camión o Jornal de siembra"
                  required
                  className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">Monto (S/)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={expAmount}
                  onChange={e => setExpAmount(e.target.value)}
                  placeholder="Ej. 150.00"
                  required
                  className="w-full px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-1">Método de Pago</label>
                <div className="flex items-center gap-1.5">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setExpPaymentMethod(m)}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold transition-all flex-1 ${
                        expPaymentMethod === m
                          ? 'bg-[#1b4332] text-vivero-mint shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-[#1b4332] text-vivero-mint font-extrabold text-xs rounded-xl shadow-lg active:scale-95 transition-all mt-1 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando en MySQL...</span>
                  </>
                ) : (
                  <span>Guardar Gasto</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
