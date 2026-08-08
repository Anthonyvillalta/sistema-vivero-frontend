import React from 'react';
import { BarChart3, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
        <h3 className="font-extrabold text-slate-800 text-lg">Flujo de Caja y Ganancia Neta</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" /> Ingresos por Ventas
            </span>
            <p className="text-2xl font-black text-emerald-900 mt-1">S/ 18,540.00</p>
          </div>

          <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
            <span className="text-xs font-bold text-red-800 uppercase flex items-center gap-1">
              <ArrowDownRight className="w-4 h-4 text-red-600" /> Egresos (Compras + Gastos)
            </span>
            <p className="text-2xl font-black text-red-900 mt-1">S/ 3,780.00</p>
          </div>

          <div className="p-4 bg-vivero-soft rounded-2xl border border-vivero-soft">
            <span className="text-xs font-bold text-vivero-dark uppercase flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-vivero-primary" /> Ganancia Neta Estimada
            </span>
            <p className="text-2xl font-black text-vivero-dark mt-1">S/ 14,760.00</p>
          </div>
        </div>
      </div>
    </div>
  );
};
