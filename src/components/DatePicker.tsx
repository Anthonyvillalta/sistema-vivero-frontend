import React, { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  companion?: string;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const toLocalDate = (v?: string): Date | null => {
  if (!v) return null;
  const parts = v.split('-').map(Number);
  const [y, m, d] = parts;
  if (!y || !m || !d || parts.length !== 3) return null;
  return new Date(y, m - 1, d);
};

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Seleccionar',
  min,
  max,
  companion
}) => {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => toLocalDate(value) || new Date());

  const today = new Date();
  const todayStr = fmt(today);
  const minDate = toLocalDate(min);
  const maxDate = toLocalDate(max);
  const companionDate = toLocalDate(companion);

  const openPicker = () => {
    setViewDate(toLocalDate(value) || new Date());
    setOpen(true);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const prevMonth = () => {
    const nd = new Date(year, month - 1, 1);
    if (minDate && nd < new Date(minDate.getFullYear(), minDate.getMonth(), 1)) return;
    setViewDate(nd);
  };

  const nextMonth = () => {
    const nd = new Date(year, month + 1, 1);
    if (maxDate && nd > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) return;
    setViewDate(nd);
  };

  const isDisabled = (d: Date) => !!(minDate && d < minDate) || !!(maxDate && d > maxDate);

  const inRange = (d: Date) => {
    if (!companionDate || !value) return false;
    const base = toLocalDate(value)!;
    const [a, b] = base < companionDate ? [base, companionDate] : [companionDate, base];
    return d > a && d < b;
  };

  const display = value
    ? (() => {
        const d = toLocalDate(value)!;
        return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
      })()
    : '';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openPicker}
        className={`flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border ${
          open || value
            ? 'bg-white border-vivero-primary ring-2 ring-vivero-mint/20 text-slate-800 shadow-2xs'
            : 'bg-slate-100 border-slate-200/70 hover:border-slate-300 text-slate-800'
        }`}
      >
        <CalendarDays className={`w-3.5 h-3.5 ${value || open ? 'text-vivero-primary' : 'text-slate-400'}`} />
        <span className={value ? 'font-bold' : 'text-slate-400'}>{value ? display : placeholder}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:absolute sm:left-0 sm:right-auto sm:top-full sm:mt-1.5 sm:translate-x-0 sm:translate-y-0 z-50 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-3 animate-in zoom-in-95 fade-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-800">
                {MONTHS[month]} <span className="text-slate-400 font-extrabold">{year}</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors active:scale-90"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors active:scale-90"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map(w => (
                <span key={w} className="text-center text-[9px] font-extrabold text-slate-400 uppercase">{w}</span>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((d, i) => {
                if (!d) return <span key={`e${i}`} />;
                const s = fmt(d);
                const selected = s === value;
                const isToday = s === todayStr;
                const disabled = isDisabled(d);
                const range = inRange(d);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(s);
                      setOpen(false);
                    }}
                    className={`h-8 rounded-lg text-[11px] font-bold transition-all relative ${
                      selected
                        ? 'bg-[#1b4332] text-vivero-mint shadow-md font-black'
                        : disabled
                          ? 'text-slate-300 cursor-not-allowed'
                          : range
                            ? 'bg-vivero-soft/70 text-vivero-dark hover:bg-vivero-soft'
                            : 'text-slate-700 hover:bg-vivero-soft/50 hover:text-vivero-dark'
                    }`}
                  >
                    {isToday && !selected && (
                      <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-vivero-primary" />
                    )}
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
                className="text-[10px] font-extrabold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                Quitar fecha
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(todayStr);
                  setOpen(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-vivero-soft hover:bg-vivero-mint/40 text-vivero-dark text-[10px] font-extrabold transition-colors active:scale-95"
              >
                Hoy
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
