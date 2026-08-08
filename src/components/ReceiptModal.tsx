import React from 'react';
import { X, Printer, Share2, CheckCircle2, Leaf, FileText } from 'lucide-react';
import { useCompanySettings } from '../context/CompanyContext';

interface ReceiptModalProps {
  sale: any;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { companyName } = useCompanySettings();
  if (!sale) return null;

  const handleWhatsApp = () => {
    const phone = (sale.customerPhone || '').replace(/[^0-9]/g, '');
    const formattedPhone = phone.length === 9 ? '51' + phone : phone;

    let msg = `Hola ${sale.customerName || 'Cliente'} 👋\nGracias por tu compra en ${companyName.toUpperCase()} 🌱\n\n`;
    msg += `Comprobante N°: ${sale.receiptNumber || 'VNT-2026'}\n`;
    msg += `Total Pagado: S/ ${(Number(sale.total) || 0).toFixed(2)}\n`;
    msg += `Método de Pago: ${sale.paymentMethod || 'EFECTIVO'}\n\n`;
    msg += `¡Agradecemos tu preferencia!`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const saleTotal = Number(sale.total) || 0;
  const saleSubtotal = Number(sale.subtotal) || (saleTotal - (Number(sale.deliveryFee) || 0));
  const saleDeliveryFee = Number(sale.deliveryFee) || 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-5 space-y-3.5 animate-in zoom-in-95 duration-200 border border-slate-200/80 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1b4332] text-vivero-mint flex items-center justify-center shadow-xs">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-xs text-[#1b4332] tracking-tight truncate max-w-[180px]">{companyName.toUpperCase()}</h3>
              <p className="text-[9px] text-slate-400 font-extrabold uppercase">Comprobante Digital / POS</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Voucher Title Pill */}
        <div className="text-center py-2 bg-vivero-soft/80 rounded-2xl border border-vivero-mint/40 space-y-0.5">
          <CheckCircle2 className="w-6 h-6 text-vivero-primary mx-auto" />
          <p className="text-[10px] font-black text-vivero-dark uppercase tracking-wider">¡Boleta / Comprobante Emitido!</p>
          <p className="text-xs font-black text-slate-800">{sale.receiptNumber || 'VNT-2026-001'}</p>
        </div>

        {/* Customer & Sale Metadata */}
        <div className="space-y-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
          <div className="flex justify-between">
            <span className="text-slate-400">Cliente:</span>
            <span className="font-extrabold text-slate-800">{sale.customerName || 'Cliente General'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Teléfono:</span>
            <span className="font-bold text-slate-700">{sale.customerPhone || 'N/A'}</span>
          </div>
          {sale.deliveryAddress && (
            <div className="flex justify-between">
              <span className="text-slate-400">Dirección:</span>
              <span className="font-bold text-slate-700 truncate max-w-[180px]">{sale.deliveryAddress}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">Fecha / Hora:</span>
            <span className="font-bold text-slate-700">
              {sale.saleDate || sale.createdAt ? new Date(sale.saleDate || sale.createdAt).toLocaleString('es-PE') : 'Reciente'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Método Pago:</span>
            <span className="font-extrabold text-vivero-primary">{sale.paymentMethod || 'EFECTIVO'}</span>
          </div>
        </div>

        {/* Itemized Detail Table if available */}
        {sale.items && sale.items.length > 0 && (
          <div className="space-y-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
              Detalle de Productos ({sale.items.length}):
            </span>
            <div className="divide-y divide-slate-200/60 max-h-36 overflow-y-auto pr-1">
              {sale.items.map((item: any, idx: number) => (
                <div key={idx} className="py-1 flex items-center justify-between text-[10px] font-semibold">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-bold text-slate-800 truncate">{item.productName || item.product?.name || 'Producto'}</p>
                    <p className="text-[9px] text-slate-400">{item.quantity} x S/ {(Number(item.unitPrice) || 0).toFixed(2)}</p>
                  </div>
                  <span className="font-extrabold text-slate-900 whitespace-nowrap">
                    S/ {(Number(item.totalPrice) || (item.quantity * item.unitPrice) || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Breakdown */}
        <div className="space-y-1 text-xs font-semibold text-slate-600 bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Subtotal:</span>
            <span>S/ {saleSubtotal.toFixed(2)}</span>
          </div>
          {saleDeliveryFee > 0 && (
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Delivery:</span>
              <span>S/ {saleDeliveryFee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs sm:text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
            <span>Total Pagado:</span>
            <span className="text-[#1b4332]">S/ {saleTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 px-3 rounded-xl bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
