import React, { useState, useEffect } from 'react';
import { LeavesLoader } from '../components/LeavesLoader';
import { ShoppingBag, CreditCard, Receipt, Search, Printer, X, RefreshCw, TrendingUp, FileText, Wallet, CalendarDays } from 'lucide-react';
import { saleApi } from '../services/api';
import { ReceiptModal } from '../components/ReceiptModal';
import { DatePicker } from '../components/DatePicker';

export const SalesHistoryPage: React.FC = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<any | null>(null);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const res = await saleApi.getRecentSales();
      if (res.data && res.data.length > 0) {
        setSales(res.data);
      } else {
        setSales([]);
      }
    } catch (err) {
      console.error('Error al cargar ventas recientes desde MySQL:', err);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
    const handleSaleCreated = () => fetchSalesData();
    const handleUpdate = () => fetchSalesData();
    window.addEventListener('vivero_sale_created', handleSaleCreated);
    window.addEventListener('vivero_products_updated', handleUpdate);
    window.addEventListener('vivero_backend_online', handleUpdate);
    return () => {
      window.removeEventListener('vivero_sale_created', handleSaleCreated);
      window.removeEventListener('vivero_products_updated', handleUpdate);
      window.removeEventListener('vivero_backend_online', handleUpdate);
    };
  }, []);

  const getSaleDate = (s: any): Date | null => {
    const raw = s.saleDate || s.createdAt;
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  const filteredSales = sales.filter(s => {
    const query = search.toLowerCase().trim();
    let matchesQuery = true;
    if (query) {
      const nameMatch = s.customerName ? s.customerName.toLowerCase().includes(query) : false;
      const rcptMatch = s.receiptNumber ? s.receiptNumber.toLowerCase().includes(query) : false;
      const methodMatch = s.paymentMethod ? s.paymentMethod.toLowerCase().includes(query) : false;
      matchesQuery = nameMatch || rcptMatch || methodMatch;
    }

    let matchesDate = true;
    if (dateFrom || dateTo) {
      const d = getSaleDate(s);
      if (d) {
        if (dateFrom && d < new Date(dateFrom + 'T00:00:00')) matchesDate = false;
        if (dateTo && d > new Date(dateTo + 'T23:59:59.999')) matchesDate = false;
      }
    }

    return matchesQuery && matchesDate;
  });

  const applyQuickRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    setDateFrom(fmtLocal(from));
    setDateTo(fmtLocal(to));
  };

  const fmtLocal = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
  };

  const isDateFilterActive = dateFrom !== '' || dateTo !== '';

  const totalCollected = filteredSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const totalItemsSold = filteredSales.reduce((sum, s) =>
    sum + (s.items ? s.items.reduce((acc: number, it: any) => acc + (Number(it.quantity) || 0), 0) : 0), 0);

  const getPaymentBadgeColor = (method: string) => {
    const m = (method || '').toUpperCase();
    if (m.includes('YAPE')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (m.includes('PLIN')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (m.includes('TRANSFERENCIA')) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (m.includes('TARJETA')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (m.includes('MIXTO')) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  return (
    <div className="space-y-3.5 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#1b4332] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-vivero-soft/20 border border-vivero-mint/30 flex-shrink-0">
            <Receipt className="w-5 h-5 text-vivero-mint" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black leading-tight">Historial de Ventas</h2>
            <p className="text-[11px] text-emerald-200 font-medium">
              Comprobantes emitidos, boletas, facturas y cobros registrados.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3.5">
          <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-center">
            <p className="text-[9px] font-extrabold text-emerald-200 uppercase tracking-wider flex items-center justify-center gap-1">
              <ShoppingBag className="w-3 h-3" /> Ventas
            </p>
            <p className="text-sm sm:text-base font-black text-vivero-mint">{filteredSales.length}</p>
          </div>
          <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-center">
            <p className="text-[9px] font-extrabold text-emerald-200 uppercase tracking-wider flex items-center justify-center gap-1">
              <Wallet className="w-3 h-3" /> Recaudado
            </p>
            <p className="text-sm sm:text-base font-black text-vivero-mint">S/ {totalCollected.toFixed(2)}</p>
          </div>
          <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-center">
            <p className="text-[9px] font-extrabold text-emerald-200 uppercase tracking-wider flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" /> Unidades
            </p>
            <p className="text-sm sm:text-base font-black text-vivero-mint">{totalItemsSold}</p>
          </div>
        </div>
      </div>

      {/* Sales Receipts History Panel */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-card p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-vivero-primary" />
            <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">
              Comprobantes Recientes
            </h3>
            <span className="text-[9px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {filteredSales.length} registros
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por comprobante, cliente o método..."
                className="w-full pl-7 pr-3 py-1 bg-slate-100 focus:bg-white text-[11px] font-semibold text-slate-800 rounded-xl border border-transparent focus:border-vivero-primary focus:outline-none transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              onClick={fetchSalesData}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
              title="Actualizar historial"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-1.5">
            <CalendarDays className={`w-3.5 h-3.5 ${isDateFilterActive ? 'text-vivero-primary' : 'text-slate-400'}`} />
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Filtrar por fecha:</span>
            <div className="flex items-center gap-1">
              {[
                { label: 'Hoy', days: 1 },
                { label: '7 días', days: 7 },
                { label: '30 días', days: 30 }
              ].map(opt => {
                const rangeFrom = fmtLocal(new Date(Date.now() - (opt.days - 1) * 86400000));
                const rangeTo = fmtLocal(new Date());
                const isActive = isDateFilterActive && dateFrom === rangeFrom && dateTo === rangeTo;
                return (
                  <button
                    key={opt.label}
                    onClick={() => applyQuickRange(opt.days)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-all active:scale-95 border ${
                      isActive
                        ? 'bg-[#1b4332] text-vivero-mint border-[#1b4332] shadow-2xs'
                        : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <DatePicker
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="Desde"
              max={dateTo || undefined}
              companion={dateTo}
            />
            <span className="text-[10px] font-black text-slate-400">—</span>
            <DatePicker
              value={dateTo}
              onChange={setDateTo}
              placeholder="Hasta"
              min={dateFrom || undefined}
              companion={dateFrom}
            />
            {isDateFilterActive && (
              <button
                onClick={clearDateFilter}
                className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all active:scale-90 flex items-center justify-center"
                title="Limpiar filtro de fecha"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sales List */}
        {loading ? (
          <LeavesLoader compact message="Cargando ventas recientes desde MySQL..." />
        ) : filteredSales.length === 0 ? (
          <div className="py-12 text-center space-y-1 bg-slate-50 rounded-2xl border border-slate-100 p-6">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-extrabold text-slate-700">No se encontraron ventas</p>
            <p className="text-[10px] text-slate-400">No existen registros que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSales.map(s => {
              const saleTotalNum = Number(s.total) || 0;
              const formattedDate = s.saleDate || s.createdAt ? new Date(s.saleDate || s.createdAt).toLocaleString('es-PE', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'Reciente';

              return (
                <div
                  key={s.id || s.receiptNumber}
                  className="p-3 bg-slate-50/80 hover:bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-card transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#1b4332] text-vivero-mint font-black text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <Receipt className="w-4 h-4" />
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-900 text-xs">{s.receiptNumber || 'VNT-2026-000'}</h4>
                        <span className={`px-2 py-0.2 rounded-md text-[9px] font-extrabold border ${getPaymentBadgeColor(s.paymentMethod)}`}>
                          {s.paymentMethod || 'EFECTIVO'}
                        </span>
                        {s.paymentStatus && (
                          <span className="px-2 py-0.2 rounded-md text-[9px] font-extrabold border bg-emerald-100 text-emerald-800 border-emerald-200 uppercase">
                            {s.paymentStatus === 'PAGADO' ? '✓ Pagado' : s.paymentStatus}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 font-bold truncate">
                        Cliente: <strong className="text-slate-800">{s.customerName || 'Cliente General'}</strong>
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        <CalendarDays className="w-3 h-3 inline -mt-0.5 mr-0.5" />
                        {formattedDate} {s.sellerUsername || s.seller ? `• Cajero: ${s.sellerUsername || s.seller}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    <div className="text-left sm:text-right">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Total Venta</span>
                      <span className="text-xs sm:text-sm font-black text-[#1b4332]">
                        S/ {saleTotalNum.toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedSaleForReceipt(s)}
                      className="py-1.5 px-3 bg-white hover:bg-vivero-soft text-[#1b4332] hover:text-vivero-primary font-extrabold text-[11px] rounded-xl border border-slate-200/80 shadow-2xs transition-all active:scale-95 flex items-center gap-1.5"
                      title="Ver e Imprimir Comprobante"
                    >
                      <Printer className="w-3.5 h-3.5 text-vivero-primary" />
                      <span>Comprobante</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Receipt Modal for Viewing and Printing Invoice/Voucher */}
      {selectedSaleForReceipt && (
        <ReceiptModal
          sale={selectedSaleForReceipt}
          onClose={() => setSelectedSaleForReceipt(null)}
        />
      )}
    </div>
  );
};
