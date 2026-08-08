import React from 'react';
import { LucideIcon, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  growth?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  growth,
  icon: Icon,
  iconBgColor = 'bg-vivero-dark text-vivero-mint',
  subtext
}) => {
  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-card hover:shadow-soft transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
            {title}
          </p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5 tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`p-2.5 rounded-xl ${iconBgColor} shadow-2xs flex-shrink-0`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-vivero-primary">
        {growth && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-vivero-soft text-vivero-dark font-extrabold text-[10px]">
            <TrendingUp className="w-3 h-3" />
            {growth}
          </span>
        )}
        <span className="text-slate-400 font-semibold text-[10px]">
          {subtext || 'vs periodo anterior'}
        </span>
      </div>
    </div>
  );
};
