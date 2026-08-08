import React, { useState, useRef, useEffect } from 'react';
import { Customer } from '../types';
import { customerApi } from '../services/api';
import { User, Search, ChevronDown, Check, UserPlus, X, ShieldAlert } from 'lucide-react';

interface CustomerSearchComboProps {
  selectedCustomer: Customer | null;
  isOccasional: boolean;
  onSelectCustomer: (customer: Customer | null, customName?: string) => void;
}

export const CustomerSearchCombo: React.FC<CustomerSearchComboProps> = ({
  selectedCustomer,
  isOccasional,
  onSelectCustomer
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dbCustomers, setDbCustomers] = useState<Customer[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDbCustomers = async () => {
      try {
        const res = await customerApi.getAllCustomers();
        if (res.data) setDbCustomers(res.data);
      } catch (err) {
        console.error('Error al cargar clientes desde MySQL:', err);
      }
    };
    fetchDbCustomers();
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const query = searchTerm.trim().toLowerCase();

  // Filter registered customers by DNI, Name, Phone, or Document from MySQL DB
  const filteredCustomers = dbCustomers.filter(c => {
    if (!query) return true;
    const nameMatch = c.fullName.toLowerCase().includes(query);
    const docMatch = c.documentNumber ? c.documentNumber.includes(query) : false;
    const phoneMatch = c.phone ? c.phone.includes(query) : false;
    return nameMatch || docMatch || phoneMatch;
  });

  const handleSelect = (customer: Customer | null) => {
    onSelectCustomer(customer);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleSelectOccasional = () => {
    onSelectCustomer(null, searchTerm.trim() || 'Público General');
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
        Buscar Cliente (DNI, RUC o Nombre)
      </label>

      {/* Main Trigger / Search Combo Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 z-10" />
        <input
          type="text"
          value={isOpen ? searchTerm : isOccasional ? 'Público General / Cliente Ocasional' : selectedCustomer ? `${selectedCustomer.fullName} (${selectedCustomer.documentType} ${selectedCustomer.documentNumber})` : ''}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm('');
          }}
          onChange={e => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder="Escribe DNI, RUC o Nombre..."
          className={`w-full pl-8 pr-16 py-1.5 bg-white rounded-xl border text-[11px] font-bold text-slate-800 shadow-2xs focus:outline-none transition-all ${
            isOpen ? 'border-vivero-primary ring-2 ring-vivero-soft' : 'border-slate-200 hover:border-slate-300'
          }`}
        />

        {/* Action / Chevron Indicators */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
          {selectedCustomer && !isOpen && (
            <span className="text-[8px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded uppercase">
              Registrado
            </span>
          )}
          {isOccasional && !isOpen && (
            <span className="text-[8px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded uppercase">
              Ocasional
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Modern Popover Floating List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 max-h-64 overflow-y-auto p-1.5 space-y-1">
          
          <div className="px-2 py-1 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
            <span>Resultados de Clientes</span>
            <span>{filteredCustomers.length} encontrados</span>
          </div>

          {/* List of matching registered customers */}
          {filteredCustomers.map(cust => {
            const isSelected = selectedCustomer?.id === cust.id;
            return (
              <button
                key={cust.id}
                type="button"
                onClick={() => handleSelect(cust)}
                className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-vivero-soft/80 border border-vivero-primary/40 text-vivero-dark'
                    : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    isSelected ? 'bg-vivero-primary text-vivero-mint' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-slate-800 truncate">{cust.fullName}</span>
                      <span className="px-1.5 py-0.2 bg-slate-100 border border-slate-200 font-mono text-[9px] font-bold text-slate-600 rounded">
                        {cust.documentType} {cust.documentNumber}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{cust.address || 'Sin dirección registrada'}</p>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-vivero-primary flex-shrink-0 stroke-[3]" />
                )}
              </button>
            );
          })}

          {/* Fallback Option: Cliente Ocasional / Público General */}
          <button
            type="button"
            onClick={handleSelectOccasional}
            className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all border ${
              isOccasional
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-slate-800 block">
                  Cliente Ocasional / Público General
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  {searchTerm.trim() ? `Ingresar como: "${searchTerm.trim()}"` : 'Sin registro previo en base de datos'}
                </span>
              </div>
            </div>
            {isOccasional && (
              <Check className="w-4 h-4 text-amber-700 flex-shrink-0 stroke-[3]" />
            )}
          </button>

          {filteredCustomers.length === 0 && searchTerm.trim() && (
            <div className="p-2 text-center text-[11px] font-bold text-amber-700 bg-amber-50 rounded-xl flex items-center justify-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>No se encontró DNI o Nombre registrado. Puedes usarlo como Cliente Ocasional.</span>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
