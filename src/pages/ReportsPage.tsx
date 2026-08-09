import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Download,
  RefreshCw,
  ChevronDown,
  Loader2,
  FileText,
  CheckCircle
} from 'lucide-react';
import { dashboardApi } from '../services/api';
import { DashboardMetrics, Product, Order } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

type DateRange = '7' | '30' | '90' | '365';

interface StatCardProps {
  title: string;
  value: string;
  growth?: number;
  icon: React.ReactNode;
  iconBg: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, growth, icon, iconBg, loading }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card transition-all duration-200 hover:shadow-md">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      {loading ? (
        <div className="h-4 w-12 bg-slate-200 rounded animate-pulse" />
      ) : growth !== undefined ? (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          growth >= 0
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
        </span>
      ) : null}
    </div>
    <p className="text-xs font-bold text-slate-500 uppercase letter-spacing-sm mb-1">{title}</p>
    {loading ? (
      <div className="h-7 w-32 bg-slate-200 rounded animate-pulse mb-1" />
    ) : (
      <p className="text-2xl font-black text-slate-800">{value}</p>
    )}
  </div>
);

const ChartSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-slate-100/50 rounded-xl animate-pulse ${className}`}>
    <div className="h-full flex items-end gap-1 p-4 pb-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex-1 bg-slate-200 rounded-t-sm h-3/4" style={{ height: `${30 + i * 10}%` }} />
      ))}
    </div>
  </div>
);

const RowSkeleton: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse" />
        <div className="flex-1 space-y-1">
          <div className="h-3 w-3/4 bg-slate-200 rounded animate-pulse" />
          <div className="h-2 w-1/2 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
      </div>
    ))}
  </div>
);

const formatCurrency = (amount: number | null | undefined): string => {
  const num = Number(amount) || 0;
  return `S/ ${num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatNumber = (num: number | null | undefined): string => {
  const n = Number(num) || 0;
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();
};

export const ReportsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('7');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getMetrics();
      setMetrics(res?.data || null);
    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [dateRange]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMetrics();
  };

  const handleExport = () => {
    if (!metrics) return;

    const csvContent = [
      ['Reporte Gerencial - Villa Verde ERP'],
      [`Fecha: ${new Date().toLocaleDateString('es-PE')}`],
      [''],
      ['KPI', 'Valor'],
      ['Ventas Diarias', formatCurrency(metrics.dailySales)],
      ['Crecimiento Diario', `${metrics.dailySalesGrowth.toFixed(1)}%`],
      ['Ventas Mensuales', formatCurrency(metrics.monthlySales)],
      ['Crecimiento Mensual', `${metrics.monthlySalesGrowth.toFixed(1)}%`],
      ['Ganancia Neta', formatCurrency(metrics.netProfit)],
      ['Crecimiento Ganancia', `${metrics.netProfitGrowth.toFixed(1)}%`],
      ['Gastos Totales', formatCurrency(metrics.totalExpenses)],
      ['Órdenes Pendientes', metrics.pendingOrdersCount.toString()],
      ['Stock Crítico', metrics.criticalStockCount.toString()],
      [''],
      ['Ventas - Últimos 7 días'],
      ['Fecha', 'Monto'],
      ...metrics.salesChart.map(s => [s.date, formatCurrency(s.amount)]),
      [''],
      ['Top Productos'],
      ['Producto', 'Categoría', 'Cantidad', 'Imagen'],
      ...metrics.topProducts.map(p => [p.name, p.variety, p.quantitySold, p.imageUrl]),
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-gerencial-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const pieData = metrics ? [
    { name: 'Ventas', value: Number(metrics.monthlySales) || 0, color: '#2d6a4f' },
    { name: 'Gastos', value: Number(metrics.totalExpenses) || 0, color: '#e74c3c' },
    { name: 'Ganancia', value: Number(metrics.netProfit) || 0, color: '#52b788' }
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Reportes Gerenciales</h1>
          <p className="text-sm text-slate-500 mt-1">Análisis de desempeño financiero y operativo</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="appearance-none pl-3.5 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-vivero-mint focus:border-transparent transition-all"
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
              <option value="365">Este año</option>
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            disabled={!metrics}
            className="flex items-center gap-2 px-4 py-2 bg-vivero-primary text-white rounded-xl font-bold text-sm hover:bg-vivero-emerald transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-dim xl:grid-cols-6 gap-4">
        <StatCard
          title="Ventas del Día"
          value={formatCurrency(metrics?.dailySales)}
          growth={metrics?.dailySalesGrowth}
          icon={<DollarSign className="w-5 h-5 text-emerald-700" />}
          iconBg="bg-emerald-50"
          loading={loading}
        />
        <StatCard
          title="Ventas del Mes"
          value={formatCurrency(metrics?.monthlySales)}
          growth={metrics?.monthlySalesGrowth}
          icon={<TrendingUp className="w-5 h-5 text-blue-700" />}
          iconBg="bg-blue-50"
          loading={loading}
        />
        <StatCard
          title="Ganancia Neta"
          value={formatCurrency(metrics?.netProfit)}
          growth={metrics?.netProfitGrowth}
          icon={<DollarSign className="w-5 h-5 text-vivero-primary" />}
          iconBg="bg-vivero-soft"
          loading={loading}
        />
        <StatCard
          title="Gastos del Mes"
          value={formatCurrency(metrics?.totalExpenses)}
          icon={<FileText className="w-5 h-5 text-orange-700" />}
          iconBg="bg-orange-50"
          loading={loading}
        />
        <StatCard
          title="Órdenes Pendientes"
          value={formatNumber(metrics?.pendingOrdersCount)}
          icon={<ShoppingCart className="w-5 h-5 text-purple-700" />}
          iconBg="bg-purple-50"
          loading={loading}
        />
        <StatCard
          title="Stock Crítico"
          value={formatNumber(metrics?.criticalStockCount)}
          icon={<Package className="w-5 h-5 text-amber-700" />}
          iconBg="bg-amber-50"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-800">Tendencia de Ventas</h3>
            <span className="text-xs font-medium text-slate-500">Últimos 7 días</span>
          </div>
          {loading ? (
            <ChartSkeleton className="h-[220px]" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={metrics?.salesChart || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2d6a4f" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2d6a4f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={45} tickFormatter={(val) => `S/ ${val}`} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(val), 'Ventas']}
                  contentStyle={{ backgroundColor: '#1b4332', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#2d6a4f" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Profit Distribution Pie */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <h3 className="font-extrabold text-slate-800 mb-4">Distribución Financiera</h3>
          {loading ? (
            <div className="h-[180px] flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-vivero-primary" />
            </div>
          ) : pieData.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">
              Sin datos financieros
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={45}
                  outerRadius={75}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="white"
                  strokeWidth={2}
                >
                  {pieData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={pieData[i].color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => formatCurrency(val)} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {pieData.length > 0 && !loading && (
            <div className="space-y-2 mt-4">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-medium text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Top Products + Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-800">Top Productos</h3>
            <span className="text-xs font-medium text-slate-500">Por unidades vendidas</span>
          </div>
          {loading ? (
            <RowSkeleton />
          ) : (
            <div className="space-y-3">
              {metrics?.topProducts?.slice(0, 5).map((product, idx) => (
                <div key={product.id} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-xl overflow-hidden border border-slate-200/50">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{product.name}</p>
                    <p className="text-xs text-slate-500 truncate">{product.variety}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-vivero-primary text-sm">{formatNumber(product.quantitySold)}</p>
                    <span className="text-xs text-slate-400">uds</span>
                  </div>
                </div>
              ))}
              {(!metrics?.topProducts || metrics.topProducts.length === 0) && !loading && (
                <div className="text-center py-8 text-slate-400">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay productos vendidos aún</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-800">Órdenes Pendientes</h3>
            <span className="text-xs font-medium text-slate-500">{metrics?.pendingOrdersCount || 0} ordenes</span>
          </div>
          {loading ? (
            <RowSkeleton />
          ) : (
            <div className="space-y-3">
              {metrics?.pendingOrders?.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl">
                  <div className="w-8 h-8 bg-vivero-soft rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-4 h-4 text-vivero-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-slate-500 truncate">{order.customerName}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    order.status === 'PENDIENTE'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              ))}
              {(!metrics?.pendingOrders || metrics.pendingOrders.length === 0) && !loading && (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay órdenes pendientes</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Critical Stock Alert */}
      {metrics?.criticalStockProducts && metrics.criticalStockProducts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/80 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-amber-800">
              Stock Crítico ({metrics.criticalStockCount})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {metrics.criticalStockProducts.slice(0, 8).map((product) => (
              <div key={product.id} className="bg-white rounded-xl p-3 border border-amber-100">
                <p className="font-black text-amber-800 text-sm truncate">{product.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Stock: <span className="font-bold text-amber-600">{product.stock}</span>
                  {' '}(mín: {product.minStock})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
