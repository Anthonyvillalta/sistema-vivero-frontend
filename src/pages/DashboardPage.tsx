import React, { useState, useEffect } from 'react';
import { CustomSelect } from '../components/CustomSelect';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PackageCheck,
  AlertTriangle,
  Sprout,
  ShoppingBag,
  Users,
  Truck,
  ChevronRight,
  Clock,
  MapPin,
  Leaf,
  Boxes,
  Loader2,
  Crown,
  BarChart3,
  CalendarDays
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { LeavesLoader } from '../components/LeavesLoader';
import { dashboardApi, purchaseApi } from '../services/api';
import { useCompanySettings } from '../context/CompanyContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Product, Order, DashboardMetrics } from '../types';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
  onSelectProduct: (product: Product) => void;
  onSelectOrder: (order: Order) => void;
}

const isDueToday = (d?: string) => {
  if (!d) return false;
  const datePart = String(d).split('T')[0].split(' ')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return false;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return datePart === today;
};

// Extracts the END time of the delivery window from strings like
// "10:00 AM - 02:00 PM (Tarde)" / "09:00 AM" / "2026-08-08 (06:00 PM - 09:00 PM (Noche))"
const parseSlotEndTime = (slot?: string): Date | null => {
  if (!slot) return null;
  const matches = slot.match(/\b\d{1,2}:\d{2}\s?(?:AM|PM)\b/gi);
  if (!matches || matches.length === 0) return null;
  const m = matches[matches.length - 1].match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
  if (!m) return null;
  let hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  const meridiem = m[3].toUpperCase();
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
};

const isOverdue = (d?: string, timeSlot?: string, estimatedArrival?: string) => {
  const raw = String(d || '');
  const datePart = raw.split('T')[0].split(' ')[0];
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    // No usable date: fall back to the ETA timestamp if present
    if (estimatedArrival) {
      const eta = new Date(estimatedArrival);
      return !isNaN(eta.getTime()) && eta.getTime() < Date.now();
    }
    return false;
  }

  if (datePart < today) return true;
  if (datePart > today) return false;

  // Same day: if the end of the scheduled turn has already passed -> overdue
  const slotEnd = parseSlotEndTime(timeSlot);
  if (slotEnd) return slotEnd.getTime() < Date.now();

  // Fallback: ETA timestamp on the same day
  if (estimatedArrival) {
    const eta = new Date(estimatedArrival);
    if (!isNaN(eta.getTime())) {
      const etaDate = `${eta.getFullYear()}-${String(eta.getMonth() + 1).padStart(2, '0')}-${String(eta.getDate()).padStart(2, '0')}`;
      if (etaDate === datePart) return eta.getTime() < Date.now();
    }
  }
  return false;
};

// Preferred: the scheduled turn. Fallback: formatted ETA time.
const formatTimeLabel = (slot?: string, eta?: string): string | null => {
  if (slot && slot.trim()) {
    return slot
      .trim()
      .replace(/^\d{4}-\d{2}-\d{2}\s*\(/, '') // legacy "2026-08-08 (" prefix
      .replace(/\)\s*$/, '')
      .replace(/\s*-\s*Repartidor:.*$/i, '')   // "- Repartidor: X" suffix
      .trim() || null;
  }
  if (eta) {
    const d = new Date(eta);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
    }
  }
  return null;
};

const formatDateShort = (d?: string): string | null => {
  if (!d) return null;
  // Date-only strings (e.g. "2026-08-08") must be parsed as local midday to
  // avoid timezone shifts pushing the displayed day backwards.
  const iso = String(d).includes('T') ? d : `${d}T12:00:00`;
  const parsed = new Date(iso);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Resolves the real delivery date. Old orders stored it embedded in the time
// slot string ("2026-08-08 (10:00 AM - 02:00 PM (Tarde))") while their
// deliveryDate column is the wrong hardcoded "tomorrow", so trust the
// embedded date first and fall back to the column.
const getOrderDeliveryDate = (o: { deliveryDate?: string; deliveryTimeSlot?: string }): string | undefined => {
  const embedded = o.deliveryTimeSlot?.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (embedded) return embedded[0];
  const direct = o.deliveryDate ? String(o.deliveryDate) : '';
  const datePart = direct.split('T')[0].split(' ')[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : undefined;
};

const DeliveryRow: React.FC<{ order: Order }> = ({ order }) => {
  const orderDate = getOrderDeliveryDate(order);
  const dueToday = isDueToday(orderDate);
  const overdue = isOverdue(orderDate, order.deliveryTimeSlot, order.delivery?.estimatedArrival);
  const timeSlot = formatTimeLabel(order.deliveryTimeSlot, order.delivery?.estimatedArrival);
  return (
    <div className={`p-2 rounded-xl border ${
      overdue ? 'bg-amber-50 border-amber-300' : dueToday ? 'bg-sky-50 border-sky-300' : 'bg-slate-50 border-slate-100'
    }`}>
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
          overdue ? 'bg-amber-500 text-white' : dueToday ? 'bg-sky-500 text-white' : 'bg-vivero-dark text-vivero-mint'
        }`}>
          {order.customerName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className={`font-extrabold text-[11px] truncate ${overdue ? 'text-amber-900' : dueToday ? 'text-sky-900' : 'text-slate-800'}`}>
            {order.customerName}
            {overdue && (
              <span className="ml-1 px-1 py-0.5 bg-amber-500 text-white text-[7px] font-black rounded-md">ATRASADO</span>
            )}
            {!overdue && dueToday && (
              <span className="ml-1 px-1 py-0.5 bg-sky-500 text-white text-[7px] font-black rounded-md">HOY</span>
            )}
          </h4>
          <p className="text-[9px] text-slate-400 font-semibold truncate flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            {order.deliveryAddress}
          </p>
          <div className="mt-0.5 flex items-center gap-1 min-w-0">
            <CalendarDays className="w-2.5 h-2.5 flex-shrink-0 text-slate-400" />
            <span className="text-[8px] text-slate-500 font-semibold truncate">{formatDateShort(orderDate)}</span>
            {(timeSlot) && (
              <>
                <span className="text-slate-300">•</span>
                <Clock className="w-2.5 h-2.5 flex-shrink-0 text-slate-400" />
                <span className="text-[8px] text-slate-500 font-semibold truncate">{timeSlot}</span>
              </>
            )}
          </div>
          <p className={`text-[8px] font-black truncate mt-0.5 ${overdue ? 'text-amber-700' : dueToday ? 'text-sky-700' : 'text-slate-500'}`}>
            {order.orderNumber} • {order.productsSummary || 'Productos del pedido'}
          </p>
        </div>
      </div>
    </div>
  );
};

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 pb-24 lg:pb-8">
      {/* Mobile Greeting & Hero Card Skeleton */}
      <div className="lg:hidden space-y-3 pt-0.5">
        <div className="space-y-1">
          <div className="h-6 w-32 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-3 w-40 bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Hero Card Skeleton */}
        <div className="bg-gradient-to-r from-[#113320] via-[#1b4332] to-[#143d26] rounded-2xl p-4 text-white shadow-md flex items-center justify-between min-h-[110px]">
          <div className="space-y-2 w-1/2">
            <div className="h-3 w-20 bg-white/20 rounded animate-pulse" />
            <div className="h-6 w-32 bg-white/30 rounded-lg animate-pulse" />
            <div className="h-3 w-24 bg-white/20 rounded animate-pulse" />
          </div>
          <div className="w-16 h-16 bg-white/10 rounded-2xl animate-pulse" />
        </div>

        {/* Mobile Mini Stats 3x3 Grid Skeleton */}
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-lg bg-slate-200 animate-pulse" />
                <div className="h-2 w-10 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
              <div className="h-2 w-12 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Greeting Header Skeleton */}
      <div className="hidden lg:flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="h-7 w-48 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-4 w-64 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-28 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-10 w-36 bg-slate-200 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Desktop 4 Main KPI Cards Skeleton */}
      <div className="hidden lg:grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse" />
              <div className="h-4 w-12 bg-slate-200 rounded-full animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-7 w-32 bg-slate-200 rounded-lg animate-pulse" />
            </div>
            <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Sales Chart & Top Products Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sales Chart Card Skeleton */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-5 w-40 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-3 w-28 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="h-8 w-24 bg-slate-200 rounded-xl animate-pulse" />
          </div>
          {/* Chart placeholder */}
          <div className="h-[220px] w-full bg-slate-100/80 rounded-xl animate-pulse flex items-end p-4 gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-slate-200 rounded-t-lg animate-pulse"
                style={{ height: `${35 + (i * 14) % 60}%` }}
              />
            ))}
          </div>
        </div>

        {/* Top Selling Products List Skeleton */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-card space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="h-5 w-36 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-4 w-12 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-slate-50/80 rounded-xl">
                <div className="w-10 h-10 bg-slate-200 rounded-lg flex-shrink-0 animate-pulse" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="h-3.5 w-3/4 bg-slate-200 rounded animate-pulse" />
                  <div className="h-2.5 w-1/2 bg-slate-200 rounded animate-pulse" />
                </div>
                <div className="h-4 w-14 bg-slate-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deliveries / Pedidos & Critical Stock Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deliveries Skeleton */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-card space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="h-5 w-44 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-6 w-16 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-slate-200 rounded-full animate-pulse" />
                </div>
                <div className="h-3 w-3/4 bg-slate-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Critical Stock Skeleton */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-card space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="h-5 w-36 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-6 w-12 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-3.5 w-28 bg-slate-200 rounded animate-pulse" />
                    <div className="h-2.5 w-16 bg-slate-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-4 w-12 bg-slate-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  setActiveTab,
  onSelectProduct,
  onSelectOrder
}) => {
  const { companyName } = useCompanySettings();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [retrying, setRetrying] = useState(false);

  const fetchPurchasesTotal = async () => {
    try {
      const res = await purchaseApi.getRecentPurchases();
      if (res?.data) {
        setPurchasesTotal(res.data.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0));
      }
    } catch (err) {
      console.error('Error al cargar compras para el dashboard:', err);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await dashboardApi.getMetrics();
      if (res?.data) {
        setMetrics(res.data);
        setRetrying(false);
      }
    } catch (err) {
      console.error('Error al cargar métricas ejecutivas desde MySQL:', err);
      setRetrying(true);
    }
  };

  const refreshAll = () => {
    fetchMetrics();
    fetchPurchasesTotal();
  };

  useEffect(() => {
    refreshAll();

    const handleUpdate = () => {
      refreshAll();
    };

    window.addEventListener('vivero_sales_updated', handleUpdate);
    window.addEventListener('vivero_orders_updated', handleUpdate);
    window.addEventListener('vivero_products_updated', handleUpdate);
    window.addEventListener('vivero_backend_online', handleUpdate);
    window.addEventListener('online', handleUpdate);

    return () => {
      window.removeEventListener('vivero_sales_updated', handleUpdate);
      window.removeEventListener('vivero_orders_updated', handleUpdate);
      window.removeEventListener('vivero_products_updated', handleUpdate);
      window.removeEventListener('vivero_backend_online', handleUpdate);
      window.removeEventListener('online', handleUpdate);
    };
  }, []);

  const data = metrics;
  const numDailySales = Number(data?.dailySales) || 0;
  const numDailyGrowth = Number(data?.dailySalesGrowth) || 0;
  const numProfit = Number(data?.netProfit) || 0;
  const numMonthlySales = Number(data?.monthlySales) || 0;
  const numMonthlyExpenses = Number(data?.totalExpenses) || 0;
  const expensesOverSales = numMonthlyExpenses > numMonthlySales;
  const hasCriticalStock = (data?.criticalStockCount || 0) > 0;
  const isDelOrderOverdue = (o: { deliveryDate?: string; deliveryTimeSlot?: string; delivery?: { estimatedArrival?: string } }) =>
    isOverdue(getOrderDeliveryDate(o), o.deliveryTimeSlot, o.delivery?.estimatedArrival);
  const deliveryPriority = (o: { deliveryDate?: string; deliveryTimeSlot?: string; delivery?: { estimatedArrival?: string } }) =>
    isDelOrderOverdue(o) ? 0 : isDueToday(getOrderDeliveryDate(o)) ? 1 : 2;
  const upcomingDeliveries = [...(data?.upcomingDeliveries || [])].sort((a, b) => deliveryPriority(a) - deliveryPriority(b));
  const dueTodayCount = upcomingDeliveries.filter(o => isDueToday(getOrderDeliveryDate(o)) && !isDelOrderOverdue(o)).length;
  const overdueCount = upcomingDeliveries.filter(o => isDelOrderOverdue(o)).length;
  const deliveryAlertType = overdueCount > 0 ? 'overdue' : dueTodayCount > 0 ? 'today' : 'none';

  if (!data) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-4 pb-24 lg:pb-8">
      {/* Mobile Greeting Header & Hero Card */}
      <div className="lg:hidden space-y-3 pt-0.5">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Hola, Admin
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Resumen de tu negocio
          </p>
        </div>

        {/* Dark Green Hero Card */}
        <div className="relative pt-2">
          <div className="bg-gradient-to-r from-[#113320] via-[#1b4332] to-[#143d26] rounded-2xl sm:rounded-[24px] p-4 text-white shadow-md relative overflow-hidden flex items-center justify-between min-h-[110px]">
            {/* Organic Wave Lines Overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl opacity-20 overflow-hidden" fill="none">
              <path d="M -20 80 Q 80 120 180 60 T 340 90" stroke="#74c69d" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 0 100 Q 100 130 200 80 T 360 110" stroke="#52b788" strokeWidth="1.5" strokeLinecap="round" />
            </svg>

            {/* Left Card Info */}
            <div className="space-y-1 z-10 max-w-[65%]">
              <span className="text-[11px] text-emerald-200/90 font-medium block tracking-wide">
                Ventas del día
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                S/ {numDailySales.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-vivero-mint font-extrabold flex items-center gap-1 pt-0.5">
                <TrendingUp className="w-3 h-3" /> {numDailyGrowth >= 0 ? `↑ ${numDailyGrowth.toFixed(1)}%` : `↓ ${Math.abs(numDailyGrowth).toFixed(1)}%`} vs ayer
              </p>
            </div>

            {/* Integrated Potted Plant Image */}
            <div className="relative w-28 sm:w-32 h-24 sm:h-28 flex-shrink-0 flex items-center justify-end pointer-events-none z-10">
              <img
                src="/planta.png"
                alt={`Planta ${companyName}`}
                className="w-full h-full object-contain filter drop-shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Mobile Mini Stats 3x3 */}
        <div className="grid grid-cols-3 gap-1.5">
          {/* Ventas Hoy */}
          <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-2xs cursor-pointer active:scale-95 transition-transform">
            <div className="flex items-center gap-1 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-3 h-3" />
              </div>
              <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wide truncate">Hoy</span>
            </div>
            <p className="text-sm font-black text-slate-900 leading-none truncate">
              S/ {(Number(data.dailySales) || 0).toLocaleString('es-PE', { maximumFractionDigits: 0 })}
            </p>
            <p className={`text-[9px] font-bold mt-1 truncate ${numDailyGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {numDailyGrowth >= 0 ? '↑' : '↓'} {Math.abs(numDailyGrowth).toFixed(1)}%
            </p>
          </div>

          {/* Ventas Mes */}
          <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-1 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-3 h-3" />
              </div>
              <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wide truncate">Mes</span>
            </div>
            <p className="text-sm font-black text-slate-900 leading-none truncate">
              S/ {numMonthlySales.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
            </p>
            <p className={`text-[9px] font-bold mt-1 truncate ${(Number(data.monthlySalesGrowth) || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {(Number(data.monthlySalesGrowth) || 0) >= 0 ? '↑' : '↓'} {Math.abs(Number(data.monthlySalesGrowth) || 0).toFixed(1)}%
            </p>
          </div>

          {/* Ganancias */}
          <div
            className={`bg-white rounded-2xl p-2.5 border shadow-2xs transition-colors ${
              numProfit < 0
                ? 'border-red-300 bg-gradient-to-br from-red-50 via-rose-50 to-red-50 animate-alert-glow'
                : 'border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-1 mb-1.5">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  numProfit < 0
                    ? 'bg-red-600 text-white animate-alert-bg'
                    : 'bg-vivero-primary text-vivero-soft'
                }`}
              >
                {numProfit < 0 ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : (
                  <TrendingUp className="w-3 h-3" />
                )}
              </div>
              <span className={`text-[8px] font-extrabold uppercase tracking-wide truncate ${numProfit < 0 ? 'text-red-600 animate-alert-blink' : 'text-slate-500'}`}>
                {numProfit < 0 ? 'Alerta' : 'Ganancias'}
              </span>
            </div>
            <p className={`text-sm font-black leading-none truncate ${numProfit < 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {numProfit < 0 ? '- ' : ''}S/ {Math.abs(numProfit).toLocaleString('es-PE', { maximumFractionDigits: 0 })}
            </p>
            <p className={`text-[9px] font-bold mt-1 truncate ${numProfit < 0 ? 'text-red-600 font-black' : 'text-vivero-primary'}`}>
              {numProfit < 0 ? 'En pérdida' : `↑ ${Math.abs(Number(data.netProfitGrowth) || 0).toFixed(1)}%`}
            </p>
          </div>

          {/* Gastos */}
          <div
            className={`bg-white rounded-2xl p-2.5 border shadow-2xs cursor-pointer active:scale-95 transition-transform transition-colors ${
              expensesOverSales
                ? 'border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 animate-alert-glow-amber'
                : 'border-slate-200/80'
            }`}
            onClick={() => setActiveTab('expenses')}
          >
            <div className="flex items-center gap-1 mb-1.5">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  expensesOverSales
                    ? 'bg-amber-500 text-white animate-alert-bg-amber'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {expensesOverSales ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
              </div>
              <span className={`text-[8px] font-extrabold uppercase tracking-wide truncate ${expensesOverSales ? 'text-amber-600 animate-alert-blink' : 'text-slate-500'}`}>
                {expensesOverSales ? 'Alerta' : 'Gastos'}
              </span>
            </div>
            <p className={`text-sm font-black leading-none truncate ${expensesOverSales ? 'text-amber-700' : 'text-slate-900'}`}>
              S/ {numMonthlyExpenses.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
            </p>
            <p className={`text-[9px] font-bold mt-1 truncate ${expensesOverSales ? 'text-amber-700 font-black animate-alert-blink' : 'text-rose-500'}`}>
              {expensesOverSales ? '¡Controla gastos!' : 'Este mes'}
            </p>
          </div>

          {/* Compras */}
          <div
            className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-2xs cursor-pointer active:scale-95 transition-transform"
            onClick={() => setActiveTab('purchases')}
          >
            <div className="flex items-center gap-1 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-3 h-3" />
              </div>
              <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wide truncate">Compras</span>
            </div>
            <p className="text-sm font-black text-slate-900 leading-none truncate">
              S/ {purchasesTotal.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[9px] font-bold text-amber-600 mt-1 truncate">Recientes</p>
          </div>

          {/* Pedidos */}
          <div
            className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-2xs cursor-pointer active:scale-95 transition-transform"
            onClick={() => setActiveTab('orders')}
          >
            <div className="flex items-center gap-1 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                <PackageCheck className="w-3 h-3" />
              </div>
              <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wide truncate">Pedidos</span>
            </div>
            <p className="text-sm font-black text-slate-900 leading-none">{data.pendingOrdersCount || 0}</p>
            <p className="text-[9px] font-bold text-amber-600 mt-1 truncate">Pendientes</p>
          </div>
        </div>

        {/* Quick White Square Buttons Grid on Mobile */}
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {[
            { label: 'Productos', icon: Sprout, tab: 'products' },
            { label: 'Inventario', icon: Boxes, tab: 'inventory' },
            { label: 'Ventas', icon: ShoppingBag, tab: 'sales' },
            { label: 'Pedidos', icon: PackageCheck, tab: 'orders' },
            { label: 'Clientes', icon: Users, tab: 'customers' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.tab)}
                className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-card flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <div className="p-1 rounded-lg bg-slate-50 text-vivero-dark">
                  <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <span className="text-[9px] font-extrabold text-slate-700 truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Sales Chart (7 Days) */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-vivero-soft text-vivero-dark flex items-center justify-center">
                <TrendingUp className="w-3 h-3" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-xs">Ventas últimos 7 días</h3>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-vivero-dark font-extrabold text-[10px] rounded-xl flex items-center gap-1 transition-all active:scale-95 border border-slate-200/80"
            >
              <BarChart3 className="w-3.5 h-3.5 text-vivero-primary" />
              <span>Reportes</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
          <div className="h-32 w-full">
            {data && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.salesChart || []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="viveroColorMobile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1b4332" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1b4332" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#64748b' }} width={45} tickFormatter={(val) => `${val}`} />
                <Tooltip
                  formatter={(val: any) => [`S/ ${(Number(val) || 0).toFixed(2)}`, 'Ventas']}
                  contentStyle={{ backgroundColor: '#1b4332', borderRadius: '10px', color: '#fff', border: 'none', fontSize: '11px' }}
                  itemStyle={{ color: '#52b788', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#1b4332" strokeWidth={2} fillOpacity={1} fill="url(#viveroColorMobile)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        </div>

        {/* Mobile Top Products */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-card space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-xs">Productos más vendidos</h3>
            <button
              onClick={() => setActiveTab('products')}
              className="px-3 py-1.5 bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint font-extrabold text-[10px] rounded-xl flex items-center gap-1 shadow-md active:scale-95 transition-all"
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>Productos</span>
            </button>
          </div>
          {(data.topProducts || []).length === 0 ? (
            <div className="p-3 bg-slate-50 rounded-xl text-center text-[11px] font-bold text-slate-500">
              Sin ventas registradas aún
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5">
              {(data.topProducts || []).slice(0, 6).map((p, idx) => {
                const isTop = idx === 0;
                return (
                  <div
                    key={p.id || idx}
                    className={`flex-shrink-0 w-24 rounded-xl border p-2 text-center transition-all ${
                      isTop
                        ? 'bg-gradient-to-b from-amber-50 to-orange-50 border-amber-300 shadow-card'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="relative inline-block">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className={`w-14 h-14 rounded-xl object-cover bg-white ${isTop ? 'border-2 border-amber-300' : 'border border-slate-200/60'}`}
                      />
                      <span
                        className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${
                          isTop
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                            : 'bg-[#1b4332] text-vivero-mint text-[9px] font-black'
                        }`}
                      >
                        {isTop ? <Crown className="w-2.5 h-2.5" /> : idx + 1}
                      </span>
                    </div>
                    <p className={`text-[9px] font-extrabold truncate mt-1 ${isTop ? 'text-amber-800' : 'text-slate-700'}`}>
                      {p.name}
                    </p>
                    <p className="text-[8px] text-slate-400 font-semibold truncate">{p.variety}</p>
                    {isTop && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[7px] font-black rounded-md shadow-xs">
                        ★ TOP 1
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Stock Crítico */}
        <div
          className={`bg-white rounded-2xl p-3.5 border shadow-card space-y-2.5 transition-colors ${
            hasCriticalStock ? 'border-red-300 animate-alert-glow' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                  hasCriticalStock ? 'bg-red-600 text-white animate-alert-bg' : 'bg-red-100 text-red-600'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
              </div>
              <h3 className={`font-extrabold text-xs ${hasCriticalStock ? 'text-red-600 animate-alert-blink' : 'text-slate-800'}`}>
                {hasCriticalStock ? 'ALERTA: Stock crítico' : 'Stock crítico'}
              </h3>
              {(data.criticalStockProducts || []).length > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-black rounded-full animate-alert-blink">
                  {data.criticalStockProducts.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="px-3 py-1.5 bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint font-extrabold text-[10px] rounded-xl flex items-center gap-1 shadow-md active:scale-95 transition-all"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Inventario</span>
            </button>
          </div>

          {hasCriticalStock && (
            <p className="text-[10px] font-black text-red-600 uppercase tracking-wide animate-alert-blink flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              ¡Reabastece los productos en mínimo stock!
            </p>
          )}

          {(!data.criticalStockProducts || data.criticalStockProducts.length === 0) ? (
            <div className="p-3 bg-emerald-50 rounded-xl text-center text-[11px] font-bold text-emerald-800">
              ✅ Stock saludable en el vivero
            </div>
          ) : (
            <div className="space-y-2">
              {data.criticalStockProducts.slice(0, 3).map(prod => (
                <div key={prod.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-7 h-7 rounded-lg object-cover bg-white flex-shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-[11px] text-slate-800 truncate">{prod.name}</h4>
                      <p className="text-[9px] text-slate-400 font-semibold truncate">
                        Disponible: {prod.availableStock ?? prod.stock} {prod.unitType === 'M2' ? 'm²' : 'und'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-red-500 text-white font-black text-[8px] rounded-full uppercase flex-shrink-0">Crítico</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Próximas Entregas */}
        <div
          className={`bg-white rounded-2xl p-3.5 border shadow-card space-y-2.5 transition-colors ${
            deliveryAlertType === 'overdue'
              ? 'border-amber-300 animate-alert-glow-amber'
              : deliveryAlertType === 'today'
                ? 'border-sky-300 animate-alert-glow-blue'
                : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  deliveryAlertType === 'overdue'
                    ? 'bg-amber-500 text-white animate-alert-bg-amber'
                    : deliveryAlertType === 'today'
                      ? 'bg-sky-500 text-white animate-alert-bg-blue'
                      : 'bg-vivero-soft text-vivero-dark'
                }`}
              >
                <Truck className="w-3 h-3" />
              </div>
              <h3 className={`font-extrabold text-xs truncate ${
                deliveryAlertType === 'overdue'
                  ? 'text-amber-700 animate-alert-blink'
                  : deliveryAlertType === 'today'
                    ? 'text-sky-700 animate-alert-blink'
                    : 'text-slate-800'
              }`}>
                {deliveryAlertType === 'overdue'
                  ? 'ALERTA: Entregas atrasadas'
                  : deliveryAlertType === 'today'
                    ? 'ALERTA: Entregas de hoy'
                    : 'Próximas entregas'}
              </h3>
              {deliveryAlertType === 'overdue' && (
                <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-full animate-alert-blink flex-shrink-0">
                  {overdueCount}
                </span>
              )}
              {deliveryAlertType === 'today' && dueTodayCount > 0 && (
                <span className="px-1.5 py-0.5 bg-sky-500 text-white text-[8px] font-black rounded-full animate-alert-blink flex-shrink-0">
                  {dueTodayCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setActiveTab('delivery')}
              className="px-3 py-1.5 bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint font-extrabold text-[10px] rounded-xl flex items-center gap-1 shadow-md active:scale-95 transition-all flex-shrink-0"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Entregas</span>
            </button>
          </div>

          {deliveryAlertType === 'overdue' && (
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide animate-alert-blink flex items-center gap-1 min-w-0">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">¡Hay {overdueCount} entrega{overdueCount > 1 ? 's' : ''} atrasada{overdueCount > 1 ? 's' : ''} sin entregar!</span>
            </p>
          )}
          {deliveryAlertType === 'today' && (
            <p className="text-[10px] font-black text-sky-700 uppercase tracking-wide animate-alert-blink flex items-center gap-1 min-w-0">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">¡Hoy se debe entregar {dueTodayCount} pedido{dueTodayCount > 1 ? 's' : ''}!</span>
            </p>
          )}

          {(!upcomingDeliveries || upcomingDeliveries.length === 0) ? (
            <div className="p-3 bg-slate-50 rounded-xl text-center text-[11px] font-bold text-slate-500">
              Sin entregas programadas
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-0.5">
              {upcomingDeliveries.filter(o => isDueToday(getOrderDeliveryDate(o)) && !isOverdue(getOrderDeliveryDate(o), o.deliveryTimeSlot, o.delivery?.estimatedArrival)).length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-sky-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                    Entregas de hoy
                  </h4>
                  <div className="space-y-2">
                    {upcomingDeliveries
                      .filter(o => isDueToday(getOrderDeliveryDate(o)) && !isOverdue(getOrderDeliveryDate(o), o.deliveryTimeSlot, o.delivery?.estimatedArrival))
                      .map(order => <DeliveryRow key={order.id} order={order} />)}
                  </div>
                </div>
              )}
              {upcomingDeliveries.filter(o => isOverdue(getOrderDeliveryDate(o), o.deliveryTimeSlot, o.delivery?.estimatedArrival)).length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Entregas atrasadas
                  </h4>
                  <div className="space-y-2">
                    {upcomingDeliveries
                      .filter(o => isOverdue(getOrderDeliveryDate(o), o.deliveryTimeSlot, o.delivery?.estimatedArrival))
                      .map(order => <DeliveryRow key={order.id} order={order} />)}
                  </div>
                </div>
              )}
              {upcomingDeliveries.filter(o => !isDueToday(getOrderDeliveryDate(o)) && !isOverdue(getOrderDeliveryDate(o), o.deliveryTimeSlot, o.delivery?.estimatedArrival)).length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Próximas entregas
                  </h4>
                  <div className="space-y-2">
                    {upcomingDeliveries
                      .filter(o => !isDueToday(getOrderDeliveryDate(o)) && !isOverdue(getOrderDeliveryDate(o), o.deliveryTimeSlot, o.delivery?.estimatedArrival))
                      .map(order => <DeliveryRow key={order.id} order={order} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top Stat Cards (Desktop 4 Grid) */}
      <div className="hidden lg:grid grid-cols-4 gap-3">
        <StatCard
          title="Ventas del día"
          value={`S/ ${numDailySales.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          growth={numDailyGrowth >= 0 ? `↑ ${numDailyGrowth.toFixed(1)}%` : `↓ ${Math.abs(numDailyGrowth).toFixed(1)}%`}
          subtext="vs ayer"
          icon={ShoppingBag}
          iconBgColor="bg-vivero-dark text-vivero-mint"
        />
        <StatCard
          title="Ventas del mes"
          value={`S/ ${(Number(data.monthlySales) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          growth={(Number(data.monthlySalesGrowth) || 0) >= 0 ? `↑ ${(Number(data.monthlySalesGrowth) || 0).toFixed(1)}%` : `↓ ${Math.abs(Number(data.monthlySalesGrowth) || 0).toFixed(1)}%`}
          subtext="vs mes pasado"
          icon={DollarSign}
          iconBgColor="bg-emerald-600 text-white"
        />
        <StatCard
          title="Ganancias"
          value={`S/ ${(Number(data.netProfit) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          growth={(Number(data.netProfitGrowth) || 0) >= 0 ? `↑ ${(Number(data.netProfitGrowth) || 0).toFixed(1)}%` : `↓ ${Math.abs(Number(data.netProfitGrowth) || 0).toFixed(1)}%`}
          subtext="vs mes pasado"
          icon={TrendingUp}
          iconBgColor="bg-vivero-primary text-vivero-soft"
        />
        <StatCard
          title="Pedidos pendientes"
          value={(data.pendingOrdersCount || 0).toString()}
          subtext="Ver todos"
          icon={PackageCheck}
          iconBgColor="bg-amber-100 text-amber-800"
        />
      </div>

      {/* Desktop Gastos Banner */}
      <div className="hidden lg:flex items-center justify-between gap-4 bg-gradient-to-r from-red-900 to-red-700 rounded-2xl p-4 text-white shadow-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/10 text-red-100 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-red-200 uppercase tracking-wider">
              Gastos operativos del mes
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5 tracking-tight truncate">
              S/ {(Number(data.totalExpenses) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('expenses')}
          className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 transition-colors active:scale-95 flex-shrink-0"
        >
          Ver gastos
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Middle Desktop Charts & Top Products Row */}
      <div className="hidden lg:grid grid-cols-3 gap-4">
        {/* Sales Chart (7 Days) */}
        <div className="col-span-2 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">
                Ventas de los últimos 7 días
              </h3>
            </div>
            <CustomSelect
              value="Semana"
              onChange={() => {}}
              options={[
                { value: 'Semana', label: 'Semana' },
                { value: 'Mes', label: 'Mes' }
              ]}
              size="sm"
              className="w-28"
            />
          </div>

            <div className="h-48 sm:h-52 w-full">
              {data && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.salesChart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="viveroColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1b4332" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1b4332" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `S/ ${val}`} />
                <Tooltip
                  formatter={(val: any) => [`S/ ${(Number(val) || 0).toFixed(2)}`, 'Ventas']}
                  contentStyle={{ backgroundColor: '#1b4332', borderRadius: '10px', color: '#fff', border: 'none', fontSize: '11px' }}
                  itemStyle={{ color: '#52b788', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#1b4332" strokeWidth={2.5} fillOpacity={1} fill="url(#viveroColor)" />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Sold Products List */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm mb-3">
              Productos más vendidos
            </h3>

            <div className="space-y-2">
              {(data.topProducts || []).slice(0, 5).map((product, idx) => {
                const isTop = idx === 0;
                return (
                  <div
                    key={product.id || idx}
                    className={`flex items-center justify-between p-1.5 rounded-xl transition-colors ${
                      isTop ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className={`w-8 h-8 rounded-lg object-cover flex-shrink-0 ${isTop ? 'border-2 border-amber-300' : 'bg-slate-100 border border-slate-200/60'}`}
                      />
                      <div className="min-w-0">
                        <h4 className={`font-extrabold text-[11px] truncate ${isTop ? 'text-amber-900' : 'text-slate-800'}`}>
                          {product.name}
                        </h4>
                        <p className="text-[9px] text-slate-400 font-medium truncate">
                          {product.variety}
                          {isTop && <span className="text-amber-600 font-black ml-1">★ Más vendido</span>}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-full font-black text-[10px] flex items-center justify-center flex-shrink-0 ${
                        isTop
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xs'
                          : 'bg-vivero-soft text-vivero-dark'
                      }`}
                    >
                      {isTop ? <Crown className="w-2.5 h-2.5" /> : idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Desktop 3 Columns: Stock Crítico, Pedidos Pendientes, Próximas Entregas */}
      <div className="hidden lg:grid grid-cols-3 gap-4">
        {/* Stock Crítico Box */}
        <div
          className={`bg-white rounded-2xl p-4 border flex flex-col justify-between transition-colors ${
            hasCriticalStock ? 'border-red-300 animate-alert-glow shadow-card' : 'border-slate-200/80 shadow-card'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  hasCriticalStock ? 'bg-red-600 text-white animate-alert-bg' : 'bg-red-100 text-red-600'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <h3 className={`font-extrabold text-xs sm:text-sm ${hasCriticalStock ? 'text-red-600 animate-alert-blink' : 'text-slate-800'}`}>
                {hasCriticalStock ? 'ALERTA: Stock crítico' : 'Stock crítico'}
              </h3>
              {hasCriticalStock && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-black rounded-full animate-alert-blink">
                  {data.criticalStockCount}
                </span>
              )}
            </div>
            {hasCriticalStock && (
              <p className="text-[10px] font-black text-red-600 uppercase tracking-wide mb-2 animate-alert-blink flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                ¡Reabastece los productos en mínimo stock!
              </p>
            )}
            <div className="space-y-2">
              {(!data.criticalStockProducts || data.criticalStockProducts.length === 0) ? (
                <div className="p-3 bg-emerald-50 rounded-xl text-center text-xs font-bold text-emerald-800">
                  ✅ Stock saludable en el vivero
                </div>
              ) : (
                data.criticalStockProducts.slice(0, 3).map(prod => (
                  <div key={prod.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={prod.imageUrl} alt={prod.name} className="w-7 h-7 rounded-lg object-cover bg-white flex-shrink-0 border border-slate-200" />
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-[11px] text-slate-800 truncate">{prod.name}</h4>
                        <p className="text-[9px] text-slate-400 font-semibold truncate">Disponible: {prod.availableStock ?? prod.stock} {prod.unitType === 'M2' ? 'm²' : 'und'}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-red-500 text-white font-black text-[8px] rounded-full uppercase flex-shrink-0">Crítico</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <button
            onClick={() => setActiveTab('inventory')}
            className="w-full mt-2.5 py-2 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] hover:from-vivero-primary hover:to-[#1b4332] text-vivero-mint font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Ver Inventario</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pedidos Pendientes Box */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm mb-2.5">Pedidos pendientes</h3>
            <div className="space-y-2">
              {(!data.pendingOrders || data.pendingOrders.length === 0) ? (
                <div className="p-3 bg-slate-50 rounded-xl text-center text-xs font-bold text-slate-500">
                  Sin pedidos pendientes
                </div>
              ) : (
                data.pendingOrders.slice(0, 3).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                    <div className="min-w-0 pr-2">
                      <span className="font-extrabold text-[11px] text-slate-800 block truncate">{order.orderNumber}</span>
                      <p className="text-[10px] font-bold text-slate-600 truncate">{order.customerName}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[8px] font-black rounded-full uppercase flex-shrink-0">Pendiente</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <button onClick={() => setActiveTab('orders')} className="text-[11px] font-extrabold text-slate-500 hover:text-vivero-dark text-center mt-2.5 block w-full">
            Ver todos ➔
          </button>
        </div>

        {/* Próximas Entregas Box */}
        <div
          className={`bg-white rounded-2xl p-4 border flex flex-col justify-between transition-colors ${
            deliveryAlertType === 'overdue'
              ? 'border-amber-300 animate-alert-glow-amber shadow-card'
              : deliveryAlertType === 'today'
                ? 'border-sky-300 animate-alert-glow-blue shadow-card'
                : 'border-slate-200/80 shadow-card'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  deliveryAlertType === 'overdue'
                    ? 'bg-amber-500 text-white animate-alert-bg-amber'
                    : deliveryAlertType === 'today'
                      ? 'bg-sky-500 text-white animate-alert-bg-blue'
                      : 'bg-vivero-soft text-vivero-dark'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
              </div>
              <h3 className={`font-extrabold text-xs sm:text-sm ${
                deliveryAlertType === 'overdue'
                  ? 'text-amber-700 animate-alert-blink'
                  : deliveryAlertType === 'today'
                    ? 'text-sky-700 animate-alert-blink'
                    : 'text-slate-800'
              }`}>
                {deliveryAlertType === 'overdue'
                  ? 'ALERTA: Entregas atrasadas'
                  : deliveryAlertType === 'today'
                    ? 'ALERTA: Entregas de hoy'
                    : 'Próximas entregas'}
              </h3>
              {deliveryAlertType === 'overdue' && (
                <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-full animate-alert-blink">
                  {overdueCount}
                </span>
              )}
              {deliveryAlertType === 'today' && dueTodayCount > 0 && (
                <span className="px-1.5 py-0.5 bg-sky-500 text-white text-[8px] font-black rounded-full animate-alert-blink">
                  {dueTodayCount}
                </span>
              )}
            </div>
            {deliveryAlertType === 'overdue' && (
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide mb-2 animate-alert-blink flex items-center gap-1">
                <Clock className="w-3 h-3" />
                ¡Hay {overdueCount} entrega{overdueCount > 1 ? 's' : ''} atrasada{overdueCount > 1 ? 's' : ''} sin entregar!
              </p>
            )}
            {deliveryAlertType === 'today' && (
              <p className="text-[10px] font-black text-sky-700 uppercase tracking-wide mb-2 animate-alert-blink flex items-center gap-1">
                <Clock className="w-3 h-3" />
                ¡Hoy se debe entregar {dueTodayCount} pedido{dueTodayCount > 1 ? 's' : ''}!
              </p>
            )}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
              {(!upcomingDeliveries || upcomingDeliveries.length === 0) ? (
                <div className="p-3 bg-slate-50 rounded-xl text-center text-xs font-bold text-slate-500">
                  Sin entregas programadas
                </div>
              ) : (
                upcomingDeliveries.map(order => {
                  const orderDate = getOrderDeliveryDate(order);
                  const dueToday = isDueToday(orderDate);
                  const overdue = isDelOrderOverdue(order);
                  return (
                    <div
                      key={order.id}
                      className={`flex items-center gap-2 p-2 rounded-xl border min-w-0 ${
                        overdue
                          ? 'bg-amber-50 border-amber-300'
                          : dueToday
                            ? 'bg-sky-50 border-sky-300'
                            : 'bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                          overdue ? 'bg-amber-500 text-white' : dueToday ? 'bg-sky-500 text-white' : 'bg-vivero-dark text-vivero-mint'
                        }`}
                      >
                        {order.customerName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className={`font-extrabold text-[11px] truncate ${
                          overdue ? 'text-amber-900' : dueToday ? 'text-sky-900' : 'text-slate-800'
                        }`}>
                          {order.customerName}
                          {overdue && (
                            <span className="ml-1 px-1 py-0.5 bg-amber-500 text-white text-[7px] font-black rounded-md">ATRASADO</span>
                          )}
                          {!overdue && dueToday && (
                            <span className="ml-1 px-1 py-0.5 bg-sky-500 text-white text-[7px] font-black rounded-md">HOY</span>
                          )}
                        </h4>
                        <p className="text-[9px] text-slate-400 font-semibold truncate">{order.deliveryAddress}</p>
                        {(formatDateShort(orderDate) || formatTimeLabel(order.deliveryTimeSlot, order.delivery?.estimatedArrival)) && (
                          <p className="text-[8px] text-slate-500 font-semibold truncate">
                            {formatDateShort(orderDate)}
                            {formatDateShort(orderDate) && formatTimeLabel(order.deliveryTimeSlot, order.delivery?.estimatedArrival) ? ' • ' : ''}
                            {formatTimeLabel(order.deliveryTimeSlot, order.delivery?.estimatedArrival)}
                          </p>
                        )}
                        {(dueToday || overdue) && (
                          <p className={`text-[8px] font-bold truncate ${overdue ? 'text-amber-700' : 'text-sky-700'}`}>
                            {order.orderNumber} • {order.productsSummary || 'Productos del pedido'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <button
            onClick={() => setActiveTab('delivery')}
            className="w-full mt-2.5 py-2 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] hover:from-vivero-primary hover:to-[#1b4332] text-vivero-mint font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Ver Entregas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
