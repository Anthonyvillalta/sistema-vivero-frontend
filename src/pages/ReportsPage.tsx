import React, { useState, useEffect } from 'react';
import {
  TrendingUp, DollarSign, ShoppingCart, Package, Users,
  FileText, Download, RefreshCw, ChevronDown,
  CheckCircle, AlertTriangle, Calendar, TrendingDown,
  Search, Info, X, BarChart3
} from 'lucide-react';
import { reportsApi } from '../services/api';
import {
  SalesSummary, ProductSales, ExpenseSummary, PurchaseSummary,
  ProfitMargin, InventoryValuation, TopCustomer,
  InventoryValuationDetail
} from '../types';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell
} from 'recharts';

type DateRange = '7' | '30' | '90' | 'all' | 'custom';
type ActiveView = 'sales' | 'expenses' | 'purchases' | 'profit' | 'inventory' | 'customers';
const COLORS = ['#2d6a4f', '#52b788', '#1b4332', '#e9c46a', '#8d5b4c', '#40916c', '#3b82f6', '#ef4444'];

const formatCurrencies = (amount: number | null | undefined): string => {
  const num = Number(amount) || 0;
  return num.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const formatCompact = (num: number | null | undefined): string => {
  const n = Number(num) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toLocaleString('es-PE');
};
const formatPercent = (val: number | null | undefined): string => {
  const n = Number(val) || 0;
  return (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
};

const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={'bg-slate-100/50 rounded-2xl animate-pulse ' + (className || '')}>
    <div className="p-5 space-y-3">
      <div className="flex items-center justify-between"><div className="w-11 h-11 bg-slate-200 rounded-xl" /><div className="h-3 w-12 bg-slate-200 rounded" /></div>
      <div className="h-3 w-full bg-slate-200 rounded" />
      <div className="h-6 w-3/4 bg-slate-200 rounded" />
    </div>
  </div>
);

const StatCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  tooltip?: string;
}> = ({ title, value, subtitle, icon, iconBg, trend = 'neutral', trendValue, tooltip }) => (
  <div
    className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
    style={{ animationDelay: '0ms', animation: 'fadeInUp 0.5s ease-out forwards' }}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={'w-11 h-11 rounded-xl flex items-center justify-center ' + iconBg + ' group-hover:scale-110 transition-transform duration-300'}>{icon}</div>
      {trend !== 'neutral' && (
        <span className={'text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ' +
          (trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trendValue}
        </span>
      )}
    </div>
    <p className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
      {title}
      {tooltip && (
        <Info className="w-3 h-3 text-slate-400 cursor-help opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </p>
    <p className="text-2xl font-black text-slate-800">{value}</p>
    {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    {tooltip && (
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 px-2 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        {tooltip}
      </div>
    )}
  </div>
);

const RowSkeleton: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse" />
        <div className="flex-1 space-y-1"><div className="h-3 w-3/4 bg-slate-200 rounded animate-pulse" /><div className="h-2 w-1/2 bg-slate-200 rounded animate-pulse" /></div>
        <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
      </div>
    ))}
  </div>
);

const TableSearch: React.FC<{ placeholder: string; value: string; onChange: (v: string) => void }> =
  ({ placeholder, value, onChange }) => (
    <div className="relative mb-3">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-vivero-mint focus:border-transparent transition-all"
      />
      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
    </div>
  );

export const ReportsPage: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('sales');
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [productSales, setProductSales] = useState<ProductSales[]>([]);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary | null>(null);
  const [purchaseSummary, setPurchaseSummary] = useState<PurchaseSummary | null>(null);
  const [profitMargin, setProfitMargin] = useState<ProfitMargin | null>(null);
  const [inventoryValuation, setInventoryValuation] = useState<InventoryValuation | null>(null);
  const [inventoryDetail, setInventoryDetail] = useState<InventoryValuationDetail | null>(null);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);

  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [lowStockSearch, setLowStockSearch] = useState('');

  const getDateRange = () => {
    const end = new Date();
    let start: Date;
    switch (dateRange) {
      case '7': start = new Date(); start.setDate(end.getDate() - 7); break;
      case '30': start = new Date(); start.setDate(end.getDate() - 30); break;
      case '90': start = new Date(); start.setDate(end.getDate() - 90); break;
      case 'all': start = new Date(); start.setFullYear(end.getFullYear(), 0, 1); break;
      case 'custom':
        start = customStartDate ? new Date(customStartDate) : new Date(end.getFullYear(), end.getMonth(), 1);
        end.setTime(customEndDate ? new Date(customEndDate).getTime() : end.getTime());
        break;
      default: start = new Date(); start.setDate(end.getDate() - 30); break;
    }
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  };

  const fetchAllData = async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange();
    const params = { startDate, endDate };
    try {
      const [salesRes, productRes, expenseRes, purchaseRes, profitRes, inventoryRes, inventoryDetailRes, customersRes] = await Promise.all([
        reportsApi.getSalesSummary(params),
        reportsApi.getProductSalesRanking({ ...params, limit: 20 }),
        reportsApi.getExpenseSummary(params),
        reportsApi.getPurchaseSummary(params),
        reportsApi.getProfitMargin(params),
        reportsApi.getInventoryValuation(),
        reportsApi.getInventoryValuationDetail(),
        reportsApi.getTopCustomers({ ...params, limit: 20 })
      ]);
      setSalesSummary(salesRes?.data || null);
      setProductSales(productRes?.data || []);
      setExpenseSummary(expenseRes?.data || null);
      setPurchaseSummary(purchaseRes?.data || null);
      setProfitMargin(profitRes?.data || null);
      setInventoryValuation(inventoryRes?.data || null);
      setInventoryDetail(inventoryDetailRes?.data || null);
      setTopCustomers(customersRes?.data || []);
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, [dateRange, customStartDate, customEndDate]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData().finally(() => setRefreshing(false));
  };

  const formatRangeLabel = () => {
    switch (dateRange) {
      case '7': return 'Últimos 7 días';
      case '30': return 'Últimos 30 días';
      case '90': return 'Últimos 90 días';
      case 'all': return 'Todo el año';
      case 'custom': return 'Personalizado';
      default: return '';
    }
  };

  const clearCustomRange = () => {
    setCustomStartDate('');
    setCustomEndDate('');
    setDateRange('30');
  };

  const pieChartData = (expenseSummary?.byCategory || [])
    .slice(0, 6)
    .map((item, i) => ({ name: item.category, value: item.amount, color: COLORS[i % COLORS.length] }))
    .filter(d => d.value > 0);

  const profitChartData = (salesSummary?.dailyTrend || []).map(d => ({
    date: d.date,
    ingresos: d.amount,
    gastos: (expenseSummary?.dailyTrend || []).find(e => e.date === d.date)?.amount || 0,
    utilidad: d.amount - ((expenseSummary?.dailyTrend || []).find(e => e.date === d.date)?.amount || 0)
  }));

  const pieInventoryData = (inventoryDetail?.valuationByCategory || [])
    .slice(0, 6)
    .map((item, i) => ({ name: item.categoryName, value: Number(item.totalCostValue), color: COLORS[i % COLORS.length] }))
    .filter(d => d.value > 0);

  const categoryComparisonData = (inventoryDetail?.valuationByCategory || []).map(item => ({
    name: item.categoryName,
    costo: Number(item.totalCostValue),
    potencial: Number(item.totalPotentialRevenue),
    ganancia: Number(item.totalPotentialProfit)
  }));

  const filteredProducts = (productSearch
    ? productSales.filter(p =>
        p.productName?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.categoryName?.toLowerCase().includes(productSearch.toLowerCase()))
    : productSales
  ).slice(0, 15);

  const filteredCustomers = (customerSearch
    ? topCustomers.filter(c =>
        c.fullName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone?.toLowerCase().includes(customerSearch.toLowerCase()))
    : topCustomers
  ).slice(0, 15);

  const filteredLowStock = (lowStockSearch
    ? (inventoryValuation?.lowStockProducts || []).filter(p =>
        p.productName?.toLowerCase().includes(lowStockSearch.toLowerCase()) ||
        p.categoryName?.toLowerCase().includes(lowStockSearch.toLowerCase()))
    : inventoryValuation?.lowStockProducts || []
  ).slice(0, 15);

  const generateExecutiveSummary = (): string => {
    const parts: string[] = [];
    const rev = Number(profitMargin?.totalRevenue) || 0;
    const exp = Number(expenseSummary?.totalExpenses) || 0;
    const netProfit = Number(profitMargin?.netProfit) || 0;
    const salesGrowth = salesSummary?.growthPercentage || 0;
    const lowStock = Number(inventoryValuation?.lowStockCount) || 0;

    if (rev > 0) {
      parts.push(`En el período se generaron S/ ${formatCurrencies(rev)} en ingresos.`);
    }
    if (salesGrowth > 0) {
      parts.push(`Las ventas presentan un crecimiento del ${formatPercent(salesGrowth)} respecto al período anterior.`);
    } else if (salesGrowth < 0) {
      parts.push(`Las ventas muestran una disminución del ${formatPercent(salesGrowth)} comparecido con el período anterior.`);
    }
    if (netProfit > 0) {
      parts.push(`La utilidad neta alcanzó S/ ${formatCurrencies(netProfit)} con un margen del ${formatPercent(profitMargin?.netProfitMargin)}.`);
    } else {
      parts.push(`La utilidad neta es negativa, lo que indica que los gastos superan los ingresos.`);
    }
    if (exp > 0) {
      parts.push(`Los gastos del período ascienden a S/ ${formatCurrencies(exp)}.`);
    }
    if (lowStock > 5) {
      parts.push(`Existen ${lowStock} productos con stock crítico. Se recomienda reabastecer pronto.`);
    } else if (lowStock > 0) {
      parts.push(`Hay ${lowStock} productos con stock por debajo del mínimo.`);
    }

    if (parts.length === 0) {
      return 'No hay datos suficientes para generar un resumen ejecutivo en este momento.';
    }
    return parts.join(' ');
  };

  const viewTabs = [
    { id: 'sales' as ActiveView, label: 'Ventas', icon: TrendingUp },
    { id: 'expenses' as ActiveView, label: 'Gastos', icon: FileText },
    { id: 'purchases' as ActiveView, label: 'Compras', icon: ShoppingCart },
    { id: 'profit' as ActiveView, label: 'Rentabilidad', icon: DollarSign },
    { id: 'inventory' as ActiveView, label: 'Inventario', icon: Package },
    { id: 'customers' as ActiveView, label: 'Clientes', icon: Users }
  ];

  const handleExportCSV = () => {
    if (!salesSummary) return;
    const rows: string[][] = [
      ['Reporte Gerencial - Villa Verde ERP'],
      ['Fecha: ' + new Date().toLocaleDateString('es-PE')],
      ['Rango: ' + formatRangeLabel()],
      [''],
      ['=== KPIs de Ventas ==='],
      ['Métrica', 'Valor'],
      ['Ventas Totales', formatCurrencies(salesSummary.totalSales)],
      ['Transacciones', salesSummary.totalTransactions.toString()],
      ['Ticket Promedio', formatCurrencies(salesSummary.averageTicket)],
      ['Crecimiento %', formatPercent(salesSummary.growthPercentage)],
      [''],
      ['=== Ventas por Categoría ==='],
      ['Categoría', 'Monto', 'Cantidad'],
      ...(salesSummary.salesByCategory || []).map(c => [c.categoryName, formatCurrencies(c.totalAmount), c.totalQuantity.toString()]),
      [''],
      ['=== Top Productos ==='],
      ['Producto', 'Categoría', 'Cantidad', 'Ingresos'],
      ...productSales.map(p => [p.productName, p.categoryName, formatCompact(p.quantitySold), formatCurrencies(p.totalRevenue)]),
      [''],
      ['=== Gastos por Categoría ==='],
      ['Categoría', 'Monto', 'Transacciones'],
      ...(expenseSummary?.byCategory || []).map(e => [e.category, formatCurrencies(e.amount), e.count.toString()]),
      [''],
      ['=== KPIs de Inventario ==='],
      ['Métrica', 'Valor'],
      ['Valor Stock', formatCurrencies(inventoryValuation?.totalStockValue)],
      ['Productos', (inventoryValuation?.totalProducts || 0).toString()],
      ['Stock Bajo', (inventoryValuation?.lowStockCount || 0).toString()],
      ['Sin Stock', (inventoryValuation?.outOfStockCount || 0).toString()],
      ['Especies', (inventoryDetail?.totalSpecies || 0).toString()],
      ['Stock Disponible', formatCompact(inventoryDetail?.totalAvailableStock)],
      [''],
      ['=== KPIs Financieros ==='],
      ['Ingresos', formatCurrencies(profitMargin?.totalRevenue)],
      ['Costo de Ventas', formatCurrencies(profitMargin?.totalCostOfGoods)],
      ['Ganancia Bruta', formatCurrencies(profitMargin?.grossProfit)],
      ['Utilidad Neta', formatCurrencies(profitMargin?.netProfit)],
      ['Margen Neto', formatPercent(profitMargin?.netProfitMargin)]
    ];
    const csv = rows.map(r => r.map(c => '"' + c + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte-gerencial-' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-10">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Reportes Gerenciales</h1>
          <p className="text-sm text-slate-500 mt-1">Análisis financiero, de inventario y de ventas para la toma de decisiones</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <div className="relative">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as DateRange)}
              className="appearance-none pl-3.5 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-vivero-mint focus:border-transparent transition-all"
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
              <option value="all">Todo el año</option>
              <option value="custom">Rango personalizado</option>
            </select>
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="border-none outline-none text-sm text-slate-700 w-32"
              />
              <span className="text-slate-300">–</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="border-none outline-none text-sm text-slate-700 w-32"
              />
              <button onClick={clearCustomRange} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <button
            onClick={handleExportCSV}
            disabled={loading || !salesSummary}
            className="flex items-center gap-2 px-4 py-2 bg-vivero-primary text-white rounded-xl font-bold text-sm hover:bg-vivero-emerald transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100/60 rounded-2xl border border-slate-200/50">
        {viewTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-vivero-primary shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SALES VIEW */}
      {activeView === 'sales' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
              </>
            ) : (
              <>
                <StatCard
                  title="Ventas Totales"
                  value={formatCurrencies(salesSummary?.totalSales)}
                  trend={(salesSummary?.growthPercentage || 0) >= 0 ? 'up' : 'down'}
                  trendValue={formatPercent(salesSummary?.growthPercentage || 0)}
                  icon={<DollarSign className="w-5 h-5 text-emerald-700" />}
                  iconBg="bg-emerald-50"
                  subtitle={(salesSummary?.totalTransactions || 0) + ' transacciones'}
                  tooltip="Suma total de todas las ventas en el período seleccionado"
                />
                <StatCard
                  title="Ticket Promedio"
                  value={formatCurrencies(salesSummary?.averageTicket)}
                  icon={<FileText className="w-5 h-5 text-blue-700" />}
                  iconBg="bg-blue-50"
                  tooltip="Monto promedio por transacción de venta"
                />
                <StatCard
                  title="Ventas Ayer"
                  value={formatCurrencies(salesSummary?.yesterdaySales)}
                  icon={<Calendar className="w-5 h-5 text-purple-700" />}
                  iconBg="bg-purple-50"
                  tooltip="Ingresos generados en la fecha de ayer"
                />
                <StatCard
                  title="Crecimiento"
                  value={formatPercent(salesSummary?.growthPercentage || 0)}
                  icon={<TrendingUp className="w-5 h-5 text-vivero-primary" />}
                  iconBg="bg-vivero-soft"
                  tooltip="Variación porcentual de ventas vs período anterior"
                />
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800">Tendencia de Ventas</h3>
              <span className="text-xs font-medium text-slate-500">{formatRangeLabel()}</span>
            </div>
            {loading ? (
              <SkeletonCard className="h-[240px]" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={salesSummary?.dailyTrend || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2d6a4f" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2d6a4f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={50} tickFormatter={(val) => 'S/ ' + val} />
                  <Tooltip formatter={(val: any) => [formatCurrencies(val), 'Ventas']} contentStyle={{ backgroundColor: '#1b4332', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="amount" stroke="#2d6a4f" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
              <h3 className="font-extrabold text-slate-800 mb-4">Ventas por Categoría</h3>
              {loading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-slate-200 animate-pulse" />
                    <div className="flex-1 h-3 bg-slate-200 rounded animate-pulse" />
                    <div className="w-12 h-3 bg-slate-200 rounded animate-pulse" />
                  </div>
                ))}</div>
              ) : (
                <div className="space-y-3">
                  {(salesSummary?.salesByCategory || []).map((cat, i) => (
                    <div key={cat.categoryId || i} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 text-sm truncate">{cat.categoryName}</p>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div className="h-full rounded-full transition-all" style={{ backgroundColor: COLORS[i % COLORS.length], width: Math.min(100, (cat.totalAmount / (salesSummary?.totalSales || 1)) * 100) + '%' }} />
                        </div>
                      </div>
                      <span className="text-sm font-black text-slate-700">{formatCurrencies(cat.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
              <h3 className="font-extrabold text-slate-800 mb-4">Métodos de Pago</h3>
              {loading ? (
                <SkeletonCard className="h-[160px]" />
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={salesSummary?.paymentBreakdown || []} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="method" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={50} tickFormatter={(val) => 'S/ ' + val} />
                    <Tooltip formatter={(val: any) => [formatCurrencies(val), 'Ingresos']} />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]} fill="#2d6a4f" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      {/* EXPENSES VIEW */}
      {activeView === 'expenses' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
              </>
            ) : (
              <>
                <StatCard title="Gastos Totales" value={formatCurrencies(expenseSummary?.totalExpenses)} icon={<FileText className="w-5 h-5 text-orange-700" />} iconBg="bg-orange-50" subtitle={(expenseSummary?.totalTransactions || 0) + ' transacciones'} tooltip="Suma de todos los gastos registrados en el período" />
                <StatCard title="Promedio por Gasto" value={formatCurrencies(expenseSummary?.averageExpense)} icon={<DollarSign className="w-5 h-5 text-red-700" />} iconBg="bg-red-50" tooltip="Monto promedio por transacción de gasto" />
                <StatCard title="Ventas del Período" value={formatCurrencies(salesSummary?.totalSales)} icon={<TrendingUp className="w-5 h-5 text-emerald-700" />} iconBg="bg-emerald-50" tooltip="Ingresos totales del período para comparar con gastos" />
                <StatCard title="Utilidad Neta" value={formatCurrencies((salesSummary?.totalSales || 0) - (expenseSummary?.totalExpenses || 0))} icon={<DollarSign className="w-5 h-5 text-vivero-primary" />} iconBg="bg-vivero-soft" tooltip="Diferencia entre ingresos y gastos del período" />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
              <h3 className="font-extrabold text-slate-800 mb-4">Gastos por Categoría</h3>
              {loading ? (
                <SkeletonCard className="h-[200px]" />
              ) : pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieChartData} cx="50%" cy="45%" innerRadius={40} outerRadius={75} fill="#8884d8" dataKey="value" stroke="white" strokeWidth={2}>
                      {pieChartData.map((_, i) => <Cell key={'cell-' + i} fill={pieChartData[i].color} />)}
                    </Pie>
                    <Tooltip formatter={(val: any) => formatCurrencies(val)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-slate-400">Sin datos de gastos</div>
              )}
              {!loading && pieChartData.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {pieChartData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-slate-600">{item.name}</span>
                      <span className="text-xs font-bold text-slate-800 ml-auto">{formatCurrencies(item.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
              <h3 className="font-extrabold text-slate-800 mb-4">Tendencia de Gastos</h3>
              {loading ? (
                <SkeletonCard className="h-[200px]" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={expenseSummary?.dailyTrend || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={50} tickFormatter={(val) => 'S/ ' + val} />
                    <Tooltip formatter={(val: any) => [formatCurrencies(val), 'Gasto']} />
                    <Area type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#expenseGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      {/* PURCHASES VIEW */}
      {activeView === 'purchases' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
              </>
            ) : (
              <>
                <StatCard title="Compras Totales" value={formatCurrencies(purchaseSummary?.totalPurchases)} icon={<ShoppingCart className="w-5 h-5 text-cyan-700" />} iconBg="bg-cyan-50" subtitle={(purchaseSummary?.totalTransactions || 0) + ' transacciones'} tooltip="Suma total de todas las compras en el período" />
                <StatCard title="Promedio por Compra" value={formatCurrencies(purchaseSummary?.averagePurchase)} icon={<DollarSign className="w-5 h-5 text-blue-700" />} iconBg="bg-blue-50" tooltip="Monto promedio por transacción de compra" />
                <StatCard title="Ventas del Período" value={formatCurrencies(salesSummary?.totalSales)} icon={<TrendingUp className="w-5 h-5 text-emerald-700" />} iconBg="bg-emerald-50" tooltip="Ingresos totales del período para comparar con compras" />
                <StatCard title="Margen C/V" value={formatPercent(((salesSummary?.totalSales || 0) - (purchaseSummary?.totalPurchases || 0)) > 0 ? (((salesSummary?.totalSales || 0) - (purchaseSummary?.totalPurchases || 0)) / (purchaseSummary?.totalPurchases || 1)) * 100 : 0)} icon={<Package className="w-5 h-5 text-vivero-primary" />} iconBg="bg-vivero-soft" tooltip="Margen entre ventas y costo de compras" />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
              <h3 className="font-extrabold text-slate-800 mb-4">Top Proveedores</h3>
              {loading ? (<RowSkeleton />) : (
                <div className="space-y-3">
                  {(purchaseSummary?.topSuppliers || []).slice(0, 5).map((supplier, i) => (
                    <div key={supplier.supplierId || i} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl transition-all duration-200 hover:bg-slate-100">
                      <div className="w-8 h-8 bg-vivero-soft rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-black text-vivero-primary">#{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 text-sm truncate">{supplier.supplierName}</p>
                        <p className="text-xs text-slate-500">{supplier.purchaseCount} compras</p>
                      </div>
                      <span className="text-sm font-black text-slate-700">{formatCurrencies(supplier.amount)}</span>
                    </div>
                  ))}
                  {(purchaseSummary?.topSuppliers || []).length === 0 && !loading && (
                    <div className="text-center py-6 text-slate-400"><FileText className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Sin datos de proveedores</p></div>
                  )}
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
              <h3 className="font-extrabold text-slate-800 mb-4">Tendencia de Compras</h3>
              {loading ? (<SkeletonCard className="h-[200px]" />) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={purchaseSummary?.dailyTrend || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="purchaseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0891b8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0891b8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={50} tickFormatter={(val) => 'S/ ' + val} />
                    <Tooltip formatter={(val: any) => [formatCurrencies(val), 'Compra']} />
                    <Area type="monotone" dataKey="amount" stroke="#0891b8" strokeWidth={2} fillOpacity={1} fill="url(#purchaseGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      {/* PROFIT VIEW */}
      {activeView === 'profit' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
              </>
            ) : (
              <>
                <StatCard title="Ingresos" value={formatCurrencies(profitMargin?.totalRevenue)} icon={<DollarSign className="w-5 h-5 text-blue-700" />} iconBg="bg-blue-50" tooltip="Ingresos totales de ventas en el período" />
                <StatCard title="Costo de Ventas" value={formatCurrencies(profitMargin?.totalCostOfGoods)} icon={<TrendingDown className="w-5 h-5 text-red-700" />} iconBg="bg-red-50" tooltip="Costo directo de los productos vendidos" />
                <StatCard title="Ganancia Bruta" value={formatCurrencies(profitMargin?.grossProfit)} icon={<DollarSign className="w-5 h-5 text-emerald-700" />} iconBg="bg-emerald-50" subtitle={'Margen: ' + formatPercent(profitMargin?.grossProfitMargin)} tooltip="Ingresos menos costo de ventas" />
                <StatCard title="Utilidad Neta" value={formatCurrencies(profitMargin?.netProfit)} icon={<DollarSign className="w-5 h-5 text-vivero-primary" />} iconBg="bg-vivero-soft" subtitle={'Margen: ' + formatPercent(profitMargin?.netProfitMargin)} tooltip="Utilidad después de deducir todos los gastos" />
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800">Ingresos vs Gastos</h3>
              <span className="text-xs font-medium text-slate-500">{formatRangeLabel()}</span>
            </div>
            {loading ? (<SkeletonCard className="h-[240px]" />) : profitChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={profitChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={50} tickFormatter={(val) => 'S/ ' + val} />
                  <Tooltip formatter={(val: any, name: any) => [formatCurrencies(val), name === 'ingresos' ? 'Ingresos' : name === 'gastos' ? 'Gastos' : 'Utilidad']} />
                  <Bar dataKey="ingresos" fill="#2d6a4f" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-slate-400">Sin datos de rentabilidad</div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
            <h3 className="font-extrabold text-slate-800 mb-4">Productos por Margen de Ganancia</h3>
            {loading ? (<RowSkeleton />) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/80">
                      <th className="text-left py-2 font-bold text-slate-700">Producto</th>
                      <th className="text-right py-2 font-bold text-slate-700">Ingresos</th>
                      <th className="text-right py-2 font-bold text-slate-700">Costo</th>
                      <th className="text-right py-2 font-bold text-slate-700">Ganancia</th>
                      <th className="text-right py-2 font-bold text-slate-700">Margen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productSales.slice(0, 10).map((product, i) => (
                      <tr key={product.productId || i} className="border-b border-slate-100/80 last:border-0 transition-colors">
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-vivero-primary w-5 h-5 flex items-center justify-center bg-vivero-soft rounded">{i + 1}</span>
                            <span className="font-bold text-slate-800">{product.productName}</span>
                            <span className="text-xs text-slate-500">({product.categoryName})</span>
                          </div>
                        </td>
                        <td className="text-right py-2 font-medium text-slate-700">{formatCurrencies(product.totalRevenue)}</td>
                        <td className="text-right py-2 font-medium text-slate-700">{formatCurrencies(product.totalCost)}</td>
                        <td className="text-right py-2 font-medium text-emerald-700">{formatCurrencies(product.grossProfit)}</td>
                        <td className="text-right py-2"><span className={product.profitMargin >= 0 ? 'font-black text-emerald-700' : 'font-black text-red-700'}>{formatPercent(product.profitMargin)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* INVENTORY VIEW */}
      {activeView === 'inventory' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
              </>
            ) : (
              <>
                <StatCard
                  title="Valor Total Stock"
                  value={formatCurrencies(inventoryValuation?.totalStockValue)}
                  icon={<Package className="w-5 h-5 text-vivero-primary" />}
                  iconBg="bg-vivero-soft"
                  subtitle={(inventoryValuation?.totalProducts || 0) + ' productos'}
                  tooltip="Valor monetario total del stock actual (costo)"
                />
                <StatCard
                  title="Plantas Totales"
                  value={formatCompact(inventoryDetail?.totalProducts)}
                  icon={<Package className="w-5 h-5 text-emerald-700" />}
                  iconBg="bg-emerald-50"
                  subtitle={(inventoryDetail?.totalSpecies || 0) + ' especies'}
                  tooltip="Total de plantas/productos con stock disponible"
                />
                <StatCard
                  title="Stock Disponible"
                  value={formatCompact(inventoryDetail?.totalAvailableStock)}
                  icon={<Package className="w-5 h-5 text-blue-700" />}
                  iconBg="bg-blue-50"
                  subtitle="Unidades disponibles (stock - reservado)"
                  tooltip="Total de unidades disponibles para venta (stock menos reservado)"
                />
                <StatCard
                  title="Valor Potencial"
                  value={formatCurrencies(inventoryDetail?.totalPotentialRevenue)}
                  icon={<DollarSign className="w-5 h-5 text-purple-700" />}
                  iconBg="bg-purple-50"
                  subtitle={'Ganancia: ' + formatCurrencies(inventoryDetail?.totalPotentialProfit)}
                  tooltip="Ingreso que generaría vender todo el stock disponible al precio de venta"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
              </>
            ) : (
              <>
                <StatCard title="Stock Bajo" value={(inventoryValuation?.lowStockCount || 0).toString()} icon={<AlertTriangle className="w-5 h-5 text-amber-700" />} iconBg="bg-amber-50" subtitle={(inventoryValuation?.outOfStockCount || 0) + ' sin stock'} tooltip="Productos que están por debajo del stock mínimo" />
                <StatCard title="Categorías" value={(inventoryValuation?.valuationByCategory || []).length.toString()} icon={<BarChart3 className="w-5 h-5 text-cyan-700" />} iconBg="bg-cyan-50" tooltip="Número de categorías con productos en stock" />
                <StatCard title="Valor por Categoría" value={(inventoryValuation?.valuationByCategory || []).length.toString() + ' categorías'} icon={<FileText className="w-5 h-5 text-indigo-700" />} iconBg="bg-indigo-50" tooltip="Distribución de valor por categoría" />
                <StatCard title="Alertas Críticas" value={(inventoryDetail?.lowStockAlerts || []).length.toString()} icon={<AlertTriangle className="w-5 h-5 text-red-700" />} iconBg="bg-red-50" subtitle="Productos con stock crítico" tooltip="Productos que requieren reabastecimiento urgente" />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
              <h3 className="font-extrabold text-slate-800 mb-4">Valor por Categoría</h3>
              {loading ? (<SkeletonCard className="h-[240px]" />) : pieInventoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieInventoryData} cx="50%" cy="45%" innerRadius={50} outerRadius={90} fill="#8884d8" dataKey="value" stroke="white" strokeWidth={2}>
                      {pieInventoryData.map((_, i) => <Cell key={'inv-cell-' + i} fill={pieInventoryData[i].color} />)}
                    </Pie>
                    <Tooltip formatter={(val: any) => [formatCurrencies(val), 'Valor']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-slate-400">Sin datos de inventario</div>
              )}
              {!loading && pieInventoryData.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {pieInventoryData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-slate-600">{item.name}</span>
                      <span className="text-xs font-bold text-slate-800 ml-auto">{formatCurrencies(item.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
              <h3 className="font-extrabold text-slate-800 mb-4">Comparativa Costo vs Potencial</h3>
              {loading ? (<SkeletonCard className="h-[240px]" />) : categoryComparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={categoryComparisonData} layout="vertical" margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => 'S/ ' + val} />
                    <YAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip formatter={(val: any, name: any) => [formatCurrencies(val), name === 'costo' ? 'Costo' : name === 'potencial' ? 'Potencial' : 'Ganancia']} />
                    <Bar dataKey="costo" fill="#2d6a4f" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="potencial" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-slate-400">Sin datos</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 mb-2">
                Productos Críticos
                <span className="ml-2 text-sm font-medium text-slate-500">({(inventoryValuation?.lowStockProducts || []).length})</span>
              </h3>
              <input
                type="text"
                placeholder="Buscar producto..."
                value={lowStockSearch}
                onChange={(e) => setLowStockSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-vivero-mint focus:border-transparent transition-all w-48"
              />
            </div>
            {loading ? (<RowSkeleton />) :
             filteredLowStock.length > 0 ? (
              <div className="space-y-3 overflow-y-auto max-h-[280px]">
                {filteredLowStock.map((product) => (
                  <div key={product.productId} className="flex items-center gap-3 p-3 bg-amber-50/30 rounded-xl border border-amber-100 transition-all duration-200 hover:bg-amber-50/50">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-amber-900 text-sm truncate">{product.productName}</p>
                      <p className="text-xs text-amber-700">{product.categoryName} · {product.unitType}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-amber-800 text-sm">{product.stock.toFixed(0)} / {product.minStock.toFixed(0)}</p>
                      <p className="text-xs text-amber-600">stock mín</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Todo el stock está por encima del mínimo</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* CUSTOMERS VIEW */}
      {activeView === 'customers' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
              </>
            ) : (
              <>
                <StatCard title="Top Clientes" value={formatCompact(topCustomers.length)} icon={<Users className="w-5 h-5 text-violet-700" />} iconBg="bg-violet-50" subtitle="Últimos registros" tooltip="Número de clientes destacados en el período" />
                <StatCard title="Venta Promedio" value={formatCurrencies(topCustomers.reduce((sum: number, c: TopCustomer) => sum + (c.totalPurchases || 0), 0) / (topCustomers.length || 1))} icon={<DollarSign className="w-5 h-5 text-emerald-700" />} iconBg="bg-emerald-50" tooltip="Monto promedio gastado por cliente destacado" />
                <StatCard title="Mejor Cliente" value={topCustomers[0]?.fullName || 'N/A'} icon={<Users className="w-5 h-5 text-blue-700" />} iconBg="bg-blue-50" subtitle={formatCurrencies(topCustomers[0]?.totalPurchases)} tooltip="Cliente con mayor valor de compra" />
                <StatCard title="Ingresos Totales" value={formatCurrencies(salesSummary?.totalSales)} icon={<DollarSign className="w-5 h-5 text-vivero-primary" />} iconBg="bg-vivero-soft" tooltip="Ingresos totales del período (todos los clientes)" />
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800">Top Clientes por Valor de Compra</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-vivero-mint focus:border-transparent transition-all w-48"
                />
                <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            {loading ? (<RowSkeleton />) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/80">
                      <th className="text-left py-2 font-bold text-slate-700">Cliente</th>
                      <th className="text-left py-2 font-bold text-slate-700">Teléfono</th>
                      <th className="text-right py-2 font-bold text-slate-700">Compras</th>
                      <th className="text-right py-2 font-bold text-slate-700">Total</th>
                      <th className="text-right py-2 font-bold text-slate-700">Ticket Prom.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer, i) => (
                      <tr key={customer.customerId || i} className="border-b border-slate-100/80 last:border-0 transition-colors hover:bg-slate-50">
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-vivero-primary w-5 h-5 flex items-center justify-center bg-vivero-soft rounded">{i + 1}</span>
                            <span className="font-bold text-slate-800">{customer.fullName}</span>
                          </div>
                        </td>
                        <td className="py-2 text-sm text-slate-600">{customer.phone}</td>
                        <td className="text-right py-2 text-slate-700">{customer.purchaseCount}</td>
                        <td className="text-right py-2 font-medium text-slate-800">{formatCurrencies(customer.totalPurchases)}</td>
                        <td className="text-right py-2 text-slate-600">{formatCurrencies(customer.customerLifetimeValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {topCustomers.length === 0 && !loading && (
                  <div className="text-center py-8 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No hay clientes registrados</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Executive Summary */}
      <div className="bg-gradient-to-br from-vivero-emerald to-vivero-primary rounded-2xl p-6 border border-slate-200/80 shadow-card text-white mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-extrablack">Resumen Ejecutivo</h3>
        </div>
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
          </div>
        ) : (
          <p className="text-sm leading-relaxed opacity-90">
            {generateExecutiveSummary()}
          </p>
        )}
      </div>

      {/* Error State */}
      {!loading && !salesSummary && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 shadow-card">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No se pudieron cargar los datos de reporte</p>
        </div>
      )}
    </div>
  );
};
