import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  className = '',
  disabled = false,
  icon,
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.value === value);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border rounded-xl font-bold text-slate-800 flex items-center justify-between transition-all focus:outline-none shadow-2xs ${
          size === 'sm' ? 'px-2.5 py-1.5 text-xs' : size === 'lg' ? 'px-4 py-3 text-sm' : 'px-3 py-2 text-xs sm:text-sm'
        } ${
          isOpen
            ? 'border-vivero-primary ring-2 ring-vivero-mint/30 shadow-md'
            : 'border-slate-200/80 hover:border-slate-300'
        } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {icon || selectedOpt?.icon}
          <span className="truncate">
            {selectedOpt ? selectedOpt.label : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
          {selectedOpt?.badge && (
            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${selectedOpt.badgeColor || 'bg-slate-100 text-slate-600'}`}>
              {selectedOpt.badge}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Floating Popover Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 p-1.5 space-y-1 max-h-60 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-vivero-soft/80 border border-vivero-primary/30 text-vivero-dark font-extrabold shadow-2xs'
                    : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {opt.icon && (
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${isSelected ? 'bg-vivero-primary text-vivero-mint' : 'bg-slate-100 text-slate-500'}`}>
                      {opt.icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{opt.label}</p>
                    {opt.description && (
                      <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{opt.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {opt.badge && (
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${opt.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && (
                    <Check className="w-4 h-4 text-vivero-primary stroke-[3]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
