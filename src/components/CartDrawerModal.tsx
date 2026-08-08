import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2, ArrowLeft, Minus, Plus, CreditCard, CheckCircle2, User, Phone, MapPin, Truck, Store, ChevronDown, ChevronLeft, ChevronRight, Check, Calendar, Clock, Banknote, Smartphone, Landmark, Split, AlertCircle } from 'lucide-react';
import { PaymentMethod, Customer, Driver, DeliveryMethod } from '../types';
import { LocationPickerModal } from './LocationPickerModal';
import { CustomerSearchCombo } from './CustomerSearchCombo';
import { saleApi, driverApi, deliveryMethodApi } from '../services/api';

interface CartDrawerModalProps {
  onSuccessSale?: (saleData: any) => void;
}

const DEFAULT_DELIVERY_METHODS: DeliveryMethod[] = [
  {
    id: 1,
    name: 'Delivery a Domicilio Standard',
    type: 'DELIVERY',
    price: 15.00,
    estimatedTime: '24 a 48 horas',
    description: 'Envío seguro a domicilio con seguimiento',
    active: true
  },
  {
    id: 2,
    name: 'Recojo en Tienda Vivero',
    type: 'STORE',
    price: 0.00,
    estimatedTime: 'Retiro inmediato',
    description: 'Atención presencial en sede principal',
    active: true
  }
];

const DEFAULT_DRIVERS: Driver[] = [
  {
    id: 1,
    fullName: 'Carlos Delivery',
    phone: '+51 987654323',
    vehicleInfo: 'Camión Isuzu 3.5T',
    active: true
  },
  {
    id: 2,
    fullName: 'Miguel Transporte',
    phone: '+51 981122334',
    vehicleInfo: 'Furgón Toyota HiAce',
    active: true
  }
];

const MIXED_PAYMENT_TOLERANCE = 0.01;

export const CartDrawerModal: React.FC<CartDrawerModalProps> = ({ onSuccessSale }) => {
  const {
    items,
    removeFromCart,
    updateQuantity,
    subtotal,
    deliveryFee,
    setDeliveryFee,
    total,
    paymentMethod,
    setPaymentMethod,
    isCartOpen,
    setIsCartOpen,
    clearCart
  } = useCart();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isOccasional, setIsOccasional] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  // True mientras el usuario edita la cantidad en móvil: oculta el footer (subtotal) y centra el input sobre la vista
  const [qtyInputFocused, setQtyInputFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Auto-dismiss alert messages after 3 seconds
  useEffect(() => {
    if (!addressError) return;
    const timer = setTimeout(() => {
      setAddressError('');
    }, 3000);
    return () => clearTimeout(timer);
  }, [addressError]);
  const [registeredDeliveryMethods, setRegisteredDeliveryMethods] = useState<DeliveryMethod[]>(DEFAULT_DELIVERY_METHODS);
  const [selectedDeliveryMethodId, setSelectedDeliveryMethodId] = useState<number | null>(null);
  const [isDeliveryComboOpen, setIsDeliveryComboOpen] = useState(false);

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isLocationValidated, setIsLocationValidated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Delivery Date, Time Slot & Driver Selection
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [deliveryDate, setDeliveryDate] = useState<string>(defaultDateStr);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState<string>('10:00 AM - 02:00 PM (Tarde)');
  const [isTimeSlotComboOpen, setIsTimeSlotComboOpen] = useState(false);
  const [driversList, setDriversList] = useState<Driver[]>(DEFAULT_DRIVERS);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [isDriverComboOpen, setIsDriverComboOpen] = useState(false);

  const TIME_SLOT_OPTIONS = [
    { id: '09:00 AM - 01:00 PM (Mañana)', time: '09:00 AM - 01:00 PM', shift: 'Mañana 🌅', badgeBg: 'bg-emerald-100 text-emerald-800' },
    { id: '10:00 AM - 02:00 PM (Tarde)', time: '10:00 AM - 02:00 PM', shift: 'Tarde ☀️', badgeBg: 'bg-amber-100 text-amber-800' },
    { id: '02:00 PM - 06:00 PM (Tarde)', time: '02:00 PM - 06:00 PM', shift: 'Tarde ☀️', badgeBg: 'bg-amber-100 text-amber-800' },
    { id: '06:00 PM - 09:00 PM (Noche)', time: '06:00 PM - 09:00 PM', shift: 'Noche 🌙', badgeBg: 'bg-indigo-100 text-indigo-800' }
  ];

  const currentTimeSlotOpt = TIME_SLOT_OPTIONS.find(s => s.id === deliveryTimeSlot) || TIME_SLOT_OPTIONS[1];

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };
  const getInTwoDaysStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return 'Seleccionar fecha';
    if (dateStr === getTodayStr()) return 'Hoy (Mismo día)';
    if (dateStr === getTomorrowStr()) return 'Mañana';
    try {
      const [y, m, dayNum] = dateStr.split('-').map(Number);
      const d = new Date(y, m - 1, dayNum);
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const getFormattedDeliveryDateFull = (dateStr: string) => {
    if (!dateStr) return 'Seleccionar fecha';
    const todayStr = getTodayStr();
    const tomorrowStr = getTomorrowStr();

    try {
      const [y, m, dayNum] = dateStr.split('-').map(Number);
      const d = new Date(y, m - 1, dayNum);
      const daysEs = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const monthsEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      const dayName = daysEs[d.getDay()];
      const monthName = monthsEs[d.getMonth()];

      if (dateStr === todayStr) return `Hoy (${dayName} ${d.getDate()} ${monthName})`;
      if (dateStr === tomorrowStr) return `Mañana (${dayName} ${d.getDate()} ${monthName})`;
      return `${dayName}, ${d.getDate()} ${monthName} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const monthNamesEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Mixed Payment (Pago Mixto) State
  const [isMixedPayment, setIsMixedPayment] = useState<boolean>(false);
  const [mixedMethod1, setMixedMethod1] = useState<PaymentMethod>('EFECTIVO');
  const [mixedAmount1, setMixedAmount1] = useState<string>('');
  const [mixedMethod2, setMixedMethod2] = useState<PaymentMethod>('YAPE');
  const [mixedAmount2, setMixedAmount2] = useState<string>('');
  const [isMixedCombo1Open, setIsMixedCombo1Open] = useState<boolean>(false);
  const [isMixedCombo2Open, setIsMixedCombo2Open] = useState<boolean>(false);

  const MIXED_PAYMENT_OPTIONS = [
    { key: 'EFECTIVO' as PaymentMethod, label: 'Efectivo', icon: Banknote, badgeBg: 'bg-emerald-100 text-emerald-800' },
    { key: 'YAPE' as PaymentMethod, label: 'Yape', icon: Smartphone, badgeBg: 'bg-purple-100 text-purple-800' },
    { key: 'PLIN' as PaymentMethod, label: 'Plin', icon: Smartphone, badgeBg: 'bg-blue-100 text-blue-800' },
    { key: 'TRANSFERENCIA' as PaymentMethod, label: 'Transferencia', icon: Landmark, badgeBg: 'bg-slate-100 text-slate-800' },
    { key: 'TARJETA' as PaymentMethod, label: 'Tarjeta / POS', icon: CreditCard, badgeBg: 'bg-indigo-100 text-indigo-800' }
  ];

  const mixedOpt1 = MIXED_PAYMENT_OPTIONS.find(o => o.key === mixedMethod1) || MIXED_PAYMENT_OPTIONS[0];
  const mixedOpt2 = MIXED_PAYMENT_OPTIONS.find(o => o.key === mixedMethod2) || MIXED_PAYMENT_OPTIONS[1];

  // Cash Change Calculator State
  const [cashReceived, setCashReceived] = useState<string>('');

  useEffect(() => {
    if (!isCartOpen) return;

    const fetchData = async () => {
      try {
        const [mRes, dRes] = await Promise.all([
          deliveryMethodApi.getActive().catch(() => null),
          driverApi.getAllDrivers().catch(() => null)
        ]);

        if (mRes?.data) {
          const activeOnly = mRes.data.filter((m: DeliveryMethod) => m.active !== false);
          setRegisteredDeliveryMethods(activeOnly);
        } else {
          setRegisteredDeliveryMethods(DEFAULT_DELIVERY_METHODS.filter(m => m.active !== false));
        }

        if (dRes?.data && dRes.data.length > 0) {
          setDriversList(dRes.data);
        } else {
          setDriversList(DEFAULT_DRIVERS);
        }
      } catch (err) {
        console.error('Error al cargar datos para el carrito:', err);
        setRegisteredDeliveryMethods(DEFAULT_DELIVERY_METHODS.filter(m => m.active !== false));
        setDriversList(DEFAULT_DRIVERS);
      }
    };

    fetchData();
  }, [isCartOpen]);

  // Auto-sync delivery fee with selected delivery method
  useEffect(() => {
    if (!selectedDeliveryMethodId) {
      setDeliveryFee(0);
      return;
    }
    const activeMethod = registeredDeliveryMethods.find(
      m => m.id === selectedDeliveryMethodId && m.active !== false
    );
    if (!activeMethod) {
      setSelectedDeliveryMethodId(null);
      setDeliveryFee(0);
    } else if (activeMethod.type === 'DELIVERY') {
      setDeliveryFee(activeMethod.price || 0);
    } else {
      setDeliveryFee(0);
    }
  }, [registeredDeliveryMethods, selectedDeliveryMethodId, setDeliveryFee]);

  // Auto-rebalance mixed payment amounts whenever the total changes
  // (e.g. quantity or delivery fee adjusted) so the sum always equals the total.
  useEffect(() => {
    if (!isMixedPayment || total <= 0) return;
    const amt1 = parseFloat(mixedAmount1) || 0;
    const amt2 = parseFloat(mixedAmount2) || 0;
    if (Math.abs(amt1 + amt2 - total) <= MIXED_PAYMENT_TOLERANCE) return;
    if (amt1 > 0) {
      setMixedAmount2(Math.max(0, total - amt1).toFixed(2));
    } else {
      const half = (total / 2).toFixed(2);
      setMixedAmount1(half);
      setMixedAmount2((total - parseFloat(half)).toFixed(2));
    }
  }, [isMixedPayment, total, mixedAmount1, mixedAmount2]);

  const resetPosState = () => {
    setSelectedCustomer(null);
    setIsOccasional(false);
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setIsLocationValidated(false);
    setSelectedDeliveryMethodId(null);
    setDeliveryFee(0);
    setSelectedDriverId(null);
    setDeliveryDate(getTomorrowStr());
    setDeliveryTimeSlot('10:00 AM - 02:00 PM (Tarde)');
    setIsMixedPayment(false);
    setMixedMethod1('EFECTIVO');
    setMixedMethod2('YAPE');
    setMixedAmount1('');
    setMixedAmount2('');
    setCashReceived('');
    setAddressError('');
  };

  const handleSelectCustomerCombo = (cust: Customer | null, customName?: string) => {
    if (cust) {
      setSelectedCustomer(cust);
      setIsOccasional(false);
      setCustomerName(cust.fullName);
      setCustomerPhone(cust.phone);
      setDeliveryAddress(cust.address || '');
      setIsLocationValidated(false);
    } else {
      setSelectedCustomer(null);
      setIsOccasional(true);
      setCustomerName(customName || 'Público General');
      setCustomerPhone('');
      setDeliveryAddress('');
      setIsLocationValidated(false);
    }
  };

  const activeDeliveryMethods = registeredDeliveryMethods.filter(m => m.active !== false);
  const hasNoActiveDeliveryMethods = activeDeliveryMethods.length === 0;

  const selectedDeliveryObj = registeredDeliveryMethods.find(m => m.id === selectedDeliveryMethodId && m.active !== false);
  const isDelivery = selectedDeliveryObj ? selectedDeliveryObj.type === 'DELIVERY' : false;
  const selectedDriverObj = driversList.find(d => d.id === selectedDriverId);

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    if (items.length === 0) return;

    // Validation 1: Customer Selection
    if (!selectedCustomer && !isOccasional && !customerName.trim()) {
      setAddressError('Por favor busque un Cliente o seleccione "Cliente Ocasional / Público General" antes de continuar.');
      return;
    }

    // Validation 2: Delivery Method Selection (Optional; strictly verify active status if chosen)
    if (selectedDeliveryMethodId) {
      const chosenMethod = registeredDeliveryMethods.find(m => m.id === selectedDeliveryMethodId);
      if (!chosenMethod || chosenMethod.active === false) {
        setAddressError('El método de entrega seleccionado está desactivado. No es posible seleccionarlo ni registrar la venta con este método.');
        setSelectedDeliveryMethodId(null);
        setDeliveryFee(0);
        return;
      }
    }

    // Validation 2b: Delivery Address if method is Delivery
    if (isDelivery && !deliveryAddress.trim()) {
      setAddressError('La dirección de entrega es obligatoria cuando selecciona un método de Delivery.');
      return;
    }

    // Validation 2c: zero-quantity items should never reach the server
    const zeroQtyItem = items.find(item => !item.quantity || item.quantity <= 0);
    if (zeroQtyItem) {
      setAddressError(`El producto "${zeroQtyItem.product.name}" tiene cantidad 0. Ajusta la cantidad o quítalo del carrito antes de continuar.`);
      return;
    }

    // Validation 2d: client-side stock pre-check for immediate feedback
    const stockExceededItem = items.find(item => {
      const maxStock = item.product.availableStock !== undefined && item.product.availableStock !== null
        ? item.product.availableStock
        : item.product.stock;
      return maxStock >= 0 && item.quantity > maxStock;
    });
    if (stockExceededItem) {
      const maxStock = stockExceededItem.product.availableStock !== undefined && stockExceededItem.product.availableStock !== null
        ? stockExceededItem.product.availableStock
        : stockExceededItem.product.stock;
      setAddressError(`Stock insuficiente para "${stockExceededItem.product.name}". Disponible: ${maxStock} ${stockExceededItem.product.unitType === 'M2' ? 'm²' : 'und'}.`);
      return;
    }

    // Validation 3 & 4: Payment Method Checks
    let finalPaymentMethodStr = paymentMethod as string;

    if (isMixedPayment) {
      const amt1 = parseFloat(mixedAmount1) || 0;
      const amt2 = parseFloat(mixedAmount2) || 0;
      const combinedSum = amt1 + amt2;

      if (amt1 <= 0 || amt2 <= 0) {
        setAddressError('En Pago Mixto, ambos montos deben ser mayores a S/ 0.00.');
        return;
      }

      if (combinedSum > total + MIXED_PAYMENT_TOLERANCE) {
        setAddressError(`En Pago Mixto, la suma combinada (S/ ${combinedSum.toFixed(2)}) es MAYOR al total a pagar (S/ ${total.toFixed(2)}).`);
        return;
      }

      if (Math.abs(combinedSum - total) > MIXED_PAYMENT_TOLERANCE) {
        setAddressError(`En Pago Mixto, la suma de montos (S/ ${combinedSum.toFixed(2)}) debe coincidir exactamente con el total a pagar (S/ ${total.toFixed(2)}).`);
        return;
      }

      finalPaymentMethodStr = `MIXTO: ${mixedMethod1} (S/ ${amt1.toFixed(2)}) + ${mixedMethod2} (S/ ${amt2.toFixed(2)})`;

    } else if (paymentMethod === 'EFECTIVO') {
      const cashVal = parseFloat(cashReceived) || 0;
      if (!cashReceived.trim() || cashVal <= 0) {
        setAddressError('Por favor ingrese el monto recibido en efectivo del cliente.');
        return;
      }

      if (cashVal < total) {
        setAddressError(`El monto recibido en efectivo (S/ ${cashVal.toFixed(2)}) es MENOR al total a pagar (S/ ${total.toFixed(2)}).`);
        return;
      }

      const changeVal = Math.max(0, cashVal - total);
      finalPaymentMethodStr = `EFECTIVO (Recibido: S/ ${cashVal.toFixed(2)}, Vuelto: S/ ${changeVal.toFixed(2)})`;
    }

    setAddressError('');
    setIsProcessing(true);

    try {
      const itemsPayload = items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }));

      const selectedDriver = driversList.find(d => d.id === selectedDriverId);
      const timeSlotFullStr = `${deliveryTimeSlot}${selectedDriver ? ' - Repartidor: ' + selectedDriver.fullName : ''}`;

      const res = await saleApi.createSale({
        customerId: selectedCustomer?.id,
        customerName: customerName || 'Cliente General',
        customerPhone: customerPhone || 'N/A',
        items: itemsPayload,
        deliveryFee: isDelivery ? deliveryFee : 0,
        paymentMethod: finalPaymentMethodStr,
        createOrderForDelivery: isDelivery,
        deliveryAddress: isDelivery ? deliveryAddress : undefined,
        deliveryTimeSlot: isDelivery ? timeSlotFullStr : undefined,
        deliveryDate: isDelivery ? deliveryDate : undefined
      });

      const createdSale = res?.data || null;

      window.dispatchEvent(new CustomEvent('vivero_products_updated'));

      const saleObj = {
        id: createdSale?.id,
        receiptNumber: createdSale?.receiptNumber || 'VNT-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000)),
        customerName,
        customerPhone,
        deliveryAddress: isDelivery ? deliveryAddress : 'Recojo en Tienda',
        items: createdSale?.items && createdSale.items.length > 0 ? createdSale.items : items,
        subtotal: createdSale?.subtotal !== undefined ? Number(createdSale.subtotal) : subtotal,
        deliveryFee: createdSale?.deliveryFee !== undefined ? Number(createdSale.deliveryFee) : (isDelivery ? deliveryFee : 0),
        discount: createdSale?.discount !== undefined ? Number(createdSale.discount) : 0,
        total: createdSale?.total !== undefined ? Number(createdSale.total) : (subtotal + (isDelivery ? deliveryFee : 0)),
        paymentMethod: finalPaymentMethodStr,
        paymentStatus: createdSale?.paymentStatus || 'PAGADO',
        saleDate: createdSale?.saleDate || new Date().toISOString()
      };

      if (onSuccessSale) onSuccessSale(saleObj);
      clearCart();
      resetPosState();
      setIsCartOpen(false);
    } catch (err: any) {
      console.error('Error al procesar venta del carrito en MySQL:', err);
      let msg = 'No se pudo procesar la venta en la base de datos MySQL.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = err.message;
      }

      if (msg.includes('Stock insuficiente') || msg.includes('Disponible:')) {
        msg = msg.replace('Stock insuficiente para:', 'Stock insuficiente para el producto');
        msg = msg.replace('Disponible:', '• Stock disponible en vivero:');
      }

      setAddressError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-md h-[100dvh] min-h-0 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <button
            onClick={() => setIsCartOpen(false)}
            className="flex items-center gap-2 text-slate-700 hover:text-vivero-dark font-extrabold text-base"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Carrito de Compras</span>
          </button>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700">El carrito está vacío</h3>
              <p className="text-xs text-slate-400">Agrega productos del catálogo para realizar una venta.</p>
            </div>
          ) : (
            <>
              {/* Customer Info Box with Modern Combo */}
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-vivero-primary" />
                    Búsqueda de Cliente
                  </h4>
                  <span className="text-[9px] font-extrabold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md">
                    {!isOccasional ? 'Datos Protegidos 🔒' : 'Ocasional / Libre'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Modern Customer Search Combo */}
                  <CustomerSearchCombo
                    selectedCustomer={selectedCustomer}
                    isOccasional={isOccasional}
                    onSelectCustomer={handleSelectCustomerCombo}
                  />

                  {/* Read-Only Customer Personal Fields when registered customer selected */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Nombre Completo</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        readOnly={!isOccasional}
                        disabled={!isOccasional}
                        placeholder="Nombre del Cliente"
                        className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-bold ${
                          !isOccasional
                            ? 'bg-slate-100 text-slate-600 border-slate-200/80 cursor-not-allowed'
                            : 'bg-white text-slate-800 border-slate-200 focus:outline-none focus:border-vivero-primary'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Teléfono / WhatsApp</label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        readOnly={!isOccasional}
                        disabled={!isOccasional}
                        placeholder="Teléfono / WhatsApp"
                        className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-bold ${
                          !isOccasional
                            ? 'bg-slate-100 text-slate-600 border-slate-200/80 cursor-not-allowed'
                            : 'bg-white text-slate-800 border-slate-200 focus:outline-none focus:border-vivero-primary'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Modern Interactive Delivery Combo Selector */}
                  <div className="relative">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Método de Entrega
                    </label>

                    <button
                      type="button"
                      disabled={hasNoActiveDeliveryMethods}
                      onClick={() => setIsDeliveryComboOpen(!isDeliveryComboOpen)}
                      className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all focus:outline-none ${
                        hasNoActiveDeliveryMethods
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-white border-slate-200 hover:border-vivero-primary text-slate-800 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {selectedDeliveryObj ? (
                          selectedDeliveryObj.type === 'DELIVERY' ? (
                            <div className="w-5 h-5 rounded-lg bg-vivero-primary text-vivero-mint flex items-center justify-center shadow-xs flex-shrink-0">
                              <Truck className="w-3 h-3" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                              <Store className="w-3 h-3" />
                            </div>
                          )
                        ) : (
                          <div className="w-5 h-5 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shadow-xs flex-shrink-0">
                            <Truck className="w-3 h-3" />
                          </div>
                        )}

                        <span className={`truncate font-extrabold ${selectedDeliveryObj ? 'text-slate-800' : 'text-slate-500 font-semibold'}`}>
                          {hasNoActiveDeliveryMethods
                            ? 'Métodos de entrega desactivados'
                            : selectedDeliveryObj
                            ? selectedDeliveryObj.name
                            : 'Sin método de entrega (Opcional)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {selectedDeliveryObj && (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                            selectedDeliveryObj.price > 0 ? 'bg-vivero-soft text-vivero-dark border border-vivero-primary/20' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {selectedDeliveryObj.price > 0 ? `+S/ ${selectedDeliveryObj.price.toFixed(2)}` : 'GRATIS'}
                          </span>
                        )}
                        {!hasNoActiveDeliveryMethods && (
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDeliveryComboOpen ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </button>

                    {/* Popover Unfolded Dropdown List */}
                    {isDeliveryComboOpen && !hasNoActiveDeliveryMethods && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setIsDeliveryComboOpen(false)}
                        />
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 p-1.5 space-y-1 max-h-64 overflow-y-auto">
                          
                          <div className="px-2 py-1 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                            <span>Opciones de Entrega</span>
                            <span>{activeDeliveryMethods.length} activas</span>
                          </div>

                          {/* Option 1: Sin método de entrega */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDeliveryMethodId(null);
                              setDeliveryFee(0);
                              setAddressError('');
                              setIsDeliveryComboOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-left flex items-start justify-between transition-all border ${
                              selectedDeliveryMethodId === null
                                ? 'bg-slate-100 border-slate-300 text-slate-900 font-extrabold shadow-2xs'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-2 rounded-xl bg-slate-100 text-slate-500 flex-shrink-0">
                                <Store className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-xs text-slate-800 truncate">Sin método de entrega</span>
                                  {selectedDeliveryMethodId === null && <Check className="w-3.5 h-3.5 text-vivero-primary stroke-[3] flex-shrink-0" />}
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium">Venta directa / Recojo en local (Sin delivery)</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 flex-shrink-0">
                              S/ 0.00
                            </span>
                          </button>

                          {activeDeliveryMethods.map(method => {
                            const isSelected = selectedDeliveryMethodId === method.id;
                            const isDelivType = method.type === 'DELIVERY';

                            return (
                              <button
                                key={method.id}
                                type="button"
                                onClick={() => {
                                  setSelectedDeliveryMethodId(method.id);
                                  setDeliveryFee(method.type === 'DELIVERY' ? method.price : 0);
                                  if (!isDelivType) setAddressError('');
                                  setIsDeliveryComboOpen(false);
                                }}
                                className={`w-full p-2.5 rounded-xl text-left flex items-start justify-between transition-all border ${
                                  isSelected
                                    ? isDelivType
                                      ? 'bg-vivero-soft/80 border-vivero-primary/40 text-vivero-dark shadow-2xs'
                                      : 'bg-emerald-50 border-emerald-300/80 text-emerald-950 shadow-2xs'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-transparent'
                                }`}
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <div className={`p-2 rounded-xl mt-0.5 flex-shrink-0 ${
                                    isSelected
                                      ? isDelivType ? 'bg-vivero-primary text-vivero-mint' : 'bg-emerald-700 text-white'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {isDelivType ? <Truck className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-extrabold text-xs text-slate-800 truncate">{method.name}</span>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-vivero-primary stroke-[3] flex-shrink-0" />}
                                    </div>

                                    {method.description && (
                                      <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                                        {method.description}
                                      </p>
                                    )}

                                    {method.estimatedTime && (
                                      <span className="inline-block mt-0.5 text-[9px] font-extrabold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                        ⏱️ {method.estimatedTime}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <span className={`text-[11px] font-black px-2 py-0.5 rounded-md border shadow-2xs flex-shrink-0 ${
                                  method.price > 0
                                    ? 'bg-white text-vivero-dark border-slate-200'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}>
                                  {method.price > 0 ? `+S/ ${method.price.toFixed(2)}` : 'GRATIS'}
                                </span>
                              </button>
                            );
                          })}

                        </div>
                      </>
                    )}
                  </div>

                  {isDelivery && (
                    <div className="space-y-2 pt-1 border-t border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Dirección de Envío
                        </label>
                        <span className="text-[8px] font-bold text-slate-400">Modificable para este pedido</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <MapPin className="w-3.5 h-3.5 text-vivero-primary absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={deliveryAddress}
                            onChange={e => {
                              setDeliveryAddress(e.target.value);
                              if (e.target.value.trim()) setAddressError('');
                              setIsLocationValidated(false);
                            }}
                            placeholder="Dirección de entrega (modificable)"
                            className={`w-full pl-7 pr-2.5 py-1.5 bg-white rounded-xl border text-[11px] font-bold text-slate-800 focus:outline-none ${
                              addressError ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-vivero-primary'
                            }`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsMapModalOpen(true)}
                          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-extrabold flex items-center gap-1 transition-all shadow-2xs whitespace-nowrap ${
                            isLocationValidated
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-vivero-soft hover:bg-vivero-primary hover:text-white border-vivero-primary/30 text-vivero-dark'
                          }`}
                          title="Validar o cambiar punto de entrega en el mapa"
                        >
                          <MapPin className="w-3.5 h-3.5 text-vivero-primary" />
                          <span>{isLocationValidated ? 'Validado ✓' : 'Ver mapa'}</span>
                        </button>
                      </div>

                      {/* Fecha y Rango Horario de Entrega - Compacto */}
                      <div className="space-y-1.5 pt-0.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Custom Interactive Calendar Date Picker */}
                          <div className="relative">
                            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-vivero-primary" />
                                Fecha Entrega
                              </span>
                            </label>

                            <button
                              type="button"
                              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                              className={`w-full px-2.5 py-1.5 bg-slate-50 hover:bg-white rounded-xl border transition-all text-[11px] font-bold text-slate-800 flex items-center justify-between shadow-2xs ${
                                isCalendarOpen
                                  ? 'border-vivero-primary ring-2 ring-vivero-mint/40 bg-white shadow-sm'
                                  : 'border-slate-200/80 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-5 h-5 rounded-md bg-vivero-primary text-vivero-mint flex items-center justify-center font-bold flex-shrink-0">
                                  <Calendar className="w-3 h-3" />
                                </div>
                                <div className="text-left min-w-0">
                                  <p className="truncate font-extrabold text-[11px] text-slate-800 leading-tight">
                                    {getFormattedDeliveryDateFull(deliveryDate)}
                                  </p>
                                  <span className="text-[8px] text-slate-400 font-semibold block">
                                    Abrir calendario
                                  </span>
                                </div>
                              </div>

                              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-0.5 ${isCalendarOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Quick Presets Pills */}
                            <div className="flex items-center gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setDeliveryDate(getTodayStr());
                                  setIsCalendarOpen(false);
                                }}
                                className={`px-1.5 py-0.2 rounded-md text-[8px] font-extrabold transition-all ${
                                  deliveryDate === getTodayStr()
                                    ? 'bg-[#1b4332] text-vivero-mint shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                Hoy
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeliveryDate(getTomorrowStr());
                                  setIsCalendarOpen(false);
                                }}
                                className={`px-1.5 py-0.2 rounded-md text-[8px] font-extrabold transition-all ${
                                  deliveryDate === getTomorrowStr()
                                    ? 'bg-[#1b4332] text-vivero-mint shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                Mañana
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeliveryDate(getInTwoDaysStr());
                                  setIsCalendarOpen(false);
                                }}
                                className={`px-1.5 py-0.2 rounded-md text-[8px] font-extrabold transition-all ${
                                  deliveryDate === getInTwoDaysStr()
                                    ? 'bg-[#1b4332] text-vivero-mint shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                +2 días
                              </button>
                            </div>

                            {/* Interactive Mini Calendar Popover */}
                            {isCalendarOpen && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setIsCalendarOpen(false)} />
                                <div className="absolute left-0 right-0 sm:w-60 top-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl z-40 p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                                  {/* Calendar Month & Year Header */}
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const y = calendarViewDate.getFullYear();
                                        const m = calendarViewDate.getMonth();
                                        setCalendarViewDate(new Date(y, m - 1, 1));
                                      }}
                                      className="p-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                    >
                                      <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>

                                    <span className="font-extrabold text-[11px] text-slate-800">
                                      {monthNamesEs[calendarViewDate.getMonth()]} {calendarViewDate.getFullYear()}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const y = calendarViewDate.getFullYear();
                                        const m = calendarViewDate.getMonth();
                                        setCalendarViewDate(new Date(y, m + 1, 1));
                                      }}
                                      className="p-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                    >
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Days of Week Header */}
                                  <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-slate-400 uppercase">
                                    <span>Do</span>
                                    <span>Lu</span>
                                    <span>Ma</span>
                                    <span>Mi</span>
                                    <span>Ju</span>
                                    <span>Vi</span>
                                    <span>Sá</span>
                                  </div>

                                  {/* Calendar Month Grid */}
                                  <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
                                    {/* Padding slots before start day */}
                                    {Array.from({ length: getFirstDayOfMonth(calendarViewDate.getFullYear(), calendarViewDate.getMonth()) }).map((_, i) => (
                                      <div key={`pad-${i}`} />
                                    ))}

                                    {/* Month Days */}
                                    {Array.from({ length: getDaysInMonth(calendarViewDate.getFullYear(), calendarViewDate.getMonth()) }, (_, i) => i + 1).map(day => {
                                      const year = calendarViewDate.getFullYear();
                                      const month = calendarViewDate.getMonth();
                                      
                                      const dateObj = new Date(year, month, day);
                                      dateObj.setHours(0, 0, 0, 0);

                                      const todayObj = new Date();
                                      todayObj.setHours(0, 0, 0, 0);

                                      const isPast = dateObj < todayObj;

                                      const dateStrVal = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                      const isSelected = deliveryDate === dateStrVal;
                                      const isToday = dateObj.getTime() === todayObj.getTime();

                                      return (
                                        <button
                                          key={`day-${day}`}
                                          type="button"
                                          disabled={isPast}
                                          onClick={() => {
                                            if (!isPast) {
                                              setDeliveryDate(dateStrVal);
                                              setIsCalendarOpen(false);
                                            }
                                          }}
                                          className={`h-6 h-6 mx-auto rounded-lg flex items-center justify-center font-bold text-[10px] transition-all ${
                                            isPast
                                              ? 'text-slate-300 cursor-not-allowed'
                                              : isSelected
                                              ? 'bg-[#1b4332] text-vivero-mint font-black shadow-md scale-105'
                                              : isToday
                                              ? 'bg-vivero-soft text-vivero-dark font-extrabold border border-vivero-primary/40'
                                              : 'hover:bg-slate-100 text-slate-700'
                                          }`}
                                        >
                                          {day}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Custom Modern Time Slot Combo Selector */}
                          <div className="relative">
                            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-vivero-primary" />
                              <span>Rango Horario</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => setIsTimeSlotComboOpen(!isTimeSlotComboOpen)}
                              className={`w-full px-2.5 py-1.5 bg-slate-50 hover:bg-white rounded-xl border transition-all text-[11px] font-bold text-slate-800 flex items-center justify-between shadow-2xs ${
                                isTimeSlotComboOpen
                                  ? 'border-vivero-primary ring-2 ring-vivero-mint/40 bg-white shadow-sm'
                                  : 'border-slate-200/80 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-5 h-5 rounded-md bg-vivero-soft text-vivero-dark flex items-center justify-center font-bold flex-shrink-0">
                                  <Clock className="w-3 h-3 text-vivero-primary" />
                                </div>
                                <div className="text-left min-w-0">
                                  <p className="truncate font-extrabold text-[11px] text-slate-800 leading-tight">
                                    {currentTimeSlotOpt ? currentTimeSlotOpt.time : deliveryTimeSlot}
                                  </p>
                                  {currentTimeSlotOpt && (
                                    <span className="text-[8px] text-slate-400 font-semibold block">
                                      {currentTimeSlotOpt.shift}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-0.5 ${isTimeSlotComboOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Popover Unfolded Time Slots Dropdown */}
                            {isTimeSlotComboOpen && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setIsTimeSlotComboOpen(false)} />
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 p-1 space-y-0.5">
                                  <div className="px-2 py-1 border-b border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400">
                                    <span>Horarios Disponibles</span>
                                    <span>4 turnos</span>
                                  </div>

                                  {TIME_SLOT_OPTIONS.map(slot => {
                                    const isSelected = deliveryTimeSlot === slot.id;
                                    return (
                                      <button
                                        key={slot.id}
                                        type="button"
                                        onClick={() => {
                                          setDeliveryTimeSlot(slot.id);
                                          setIsTimeSlotComboOpen(false);
                                        }}
                                        className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all border ${
                                          isSelected
                                            ? 'bg-vivero-soft/80 border-vivero-primary/40 text-vivero-dark font-extrabold shadow-2xs'
                                            : 'bg-white hover:bg-slate-50 text-slate-700 border-transparent'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <div className={`p-1 rounded-md flex-shrink-0 ${
                                            isSelected ? 'bg-vivero-primary text-vivero-mint' : 'bg-slate-100 text-slate-500'
                                          }`}>
                                            <Clock className="w-3 h-3" />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="font-extrabold text-[11px] text-slate-800 truncate">{slot.time}</p>
                                            <p className="text-[8px] text-slate-400 font-medium">Turno recomendado</p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${slot.badgeBg}`}>
                                            {slot.shift}
                                          </span>
                                          {isSelected && <Check className="w-3.5 h-3.5 text-vivero-primary stroke-[3]" />}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Selection of Driver - Custom Compact Combo */}
                      {driversList.length > 0 && (
                        <div className="relative pt-0.5">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                            <Truck className="w-3 h-3 text-vivero-primary" />
                            <span>Repartidor Asignado</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => setIsDriverComboOpen(!isDriverComboOpen)}
                            className={`w-full px-2.5 py-1.5 bg-slate-50 hover:bg-white rounded-xl border transition-all text-[11px] font-bold text-slate-800 flex items-center justify-between shadow-2xs ${
                              isDriverComboOpen
                                ? 'border-vivero-primary ring-2 ring-vivero-mint/40 bg-white shadow-sm'
                                : 'border-slate-200/80 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] flex-shrink-0 ${
                                selectedDriverObj ? 'bg-vivero-soft text-vivero-dark border border-vivero-primary/30' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {selectedDriverObj ? selectedDriverObj.fullName.charAt(0) : <Truck className="w-3 h-3 text-slate-400" />}
                              </div>
                              <div className="text-left min-w-0">
                                <p className={`truncate leading-tight ${selectedDriverObj ? 'font-extrabold text-slate-800' : 'text-slate-400 font-semibold'}`}>
                                  {selectedDriverObj ? selectedDriverObj.fullName : 'Asignar Repartidor (Opcional)'}
                                </p>
                                {selectedDriverObj?.vehicleInfo && (
                                  <p className="text-[8px] text-slate-400 font-medium truncate">
                                    {selectedDriverObj.vehicleInfo} {selectedDriverObj.phone ? `• ${selectedDriverObj.phone}` : ''}
                                  </p>
                                )}
                              </div>
                            </div>

                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-0.5 ${isDriverComboOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Popover Unfolded Drivers Dropdown */}
                          {isDriverComboOpen && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setIsDriverComboOpen(false)} />
                              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 p-1 space-y-0.5 max-h-52 overflow-y-auto">
                                <div className="px-2 py-0.5 border-b border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400">
                                  <span>Flota de Repartidores</span>
                                  <span>{driversList.length} registrados</span>
                                </div>

                                {/* Option: Sin repartidor asignado */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDriverId(null);
                                    setIsDriverComboOpen(false);
                                  }}
                                  className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all border ${
                                    selectedDriverId === null
                                      ? 'bg-slate-100 border-slate-300 text-slate-900 font-extrabold shadow-2xs'
                                      : 'bg-white hover:bg-slate-50 text-slate-700 border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-5 h-5 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0">
                                      <Truck className="w-3 h-3" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-extrabold text-[11px] text-slate-700 truncate">Por programar en Logística</p>
                                      <p className="text-[8px] text-slate-400 font-medium">Sin asignación al momento de venta</p>
                                    </div>
                                  </div>
                                  {selectedDriverId === null && <Check className="w-3.5 h-3.5 text-vivero-primary stroke-[3] flex-shrink-0" />}
                                </button>

                                {/* Drivers List */}
                                {driversList.map(driver => {
                                  const isSelected = selectedDriverId === driver.id;
                                  return (
                                    <button
                                      key={driver.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedDriverId(driver.id);
                                        setIsDriverComboOpen(false);
                                      }}
                                      className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all border ${
                                        isSelected
                                          ? 'bg-vivero-soft/80 border-vivero-primary/40 text-vivero-dark font-extrabold shadow-2xs'
                                          : 'bg-white hover:bg-slate-50 text-slate-700 border-transparent'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] flex-shrink-0 ${
                                          isSelected ? 'bg-vivero-primary text-vivero-mint' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                          {driver.fullName.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1">
                                            <p className="font-extrabold text-[11px] text-slate-800 truncate">{driver.fullName}</p>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-vivero-primary stroke-[3] flex-shrink-0" />}
                                          </div>
                                          {(driver.vehicleInfo || driver.phone) && (
                                            <p className="text-[8px] text-slate-400 font-semibold truncate">
                                              {driver.vehicleInfo || 'Vehículo vivero'} {driver.phone ? `• Tel: ${driver.phone}` : ''}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {addressError && (
                        <p className="text-[11px] font-bold text-red-500 mt-1">
                          ⚠️ {addressError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Items List - Compact Version */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Productos Seleccionados ({items.length})
                </h4>
                {items.map(item => {
                  const maxStock = item.product.availableStock !== undefined && item.product.availableStock !== null
                    ? item.product.availableStock
                    : item.product.stock;

                  const numPrice = Number(item.unitPrice) || Number(item.product.price) || 0;
                  const numOriginalPrice = Number(item.product.originalPrice) || 0;
                  const numDiscountPercentage = Number(item.product.discountPercentage) || 0;

                  const hasDiscount = Boolean(
                    numDiscountPercentage > 0 || (numOriginalPrice > 0 && numOriginalPrice > numPrice)
                  );

                  const discountPercent = numDiscountPercentage > 0 ? numDiscountPercentage : (
                    numOriginalPrice > numPrice
                      ? Math.round(((numOriginalPrice - numPrice) / numOriginalPrice) * 100)
                      : 0
                  );

                  const displayOriginalPrice = numOriginalPrice > numPrice ? numOriginalPrice : (
                    discountPercent > 0
                      ? numPrice / (1 - discountPercent / 100)
                      : numPrice
                  );

                  return (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-2.5 p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs"
                    >
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-100 flex-shrink-0 border border-slate-200/60"
                      />
                      <div className="flex-1 min-w-0">
                        {item.product.brand && (
                          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block mb-0.5">
                            {item.product.brand}
                          </span>
                        )}
                        <h5 className="font-extrabold text-slate-800 text-xs break-words leading-snug">
                          {item.product.name}
                        </h5>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {hasDiscount && (
                            <span className="bg-[#e11d48] text-white font-black text-[9px] px-1.5 py-0.2 rounded shadow-2xs">
                              -{discountPercent}%
                            </span>
                          )}
                          <span className="text-[11px] text-vivero-primary font-extrabold">
                            S/ {numPrice.toFixed(2)} /{item.product.unitType === 'M2' ? 'm²' : 'und'}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] font-bold text-slate-400 line-through">
                              S/ {displayOriginalPrice.toFixed(2)}
                            </span>
                          )}
                          <span className="text-[8px] font-extrabold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            Stock: {maxStock} {item.product.unitType === 'M2' ? 'm²' : 'und'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const step = item.product.unitType === 'M2' ? 5 : 1;
                              const newQty = Math.max(1, item.quantity - step);
                              setAddressError('');
                              updateQuantity(item.product.id, newQty);
                            }}
                            className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 transition-colors flex-shrink-0"
                            title="Reducir cantidad"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <div
                            id={`cart-qty-${item.product.id}`}
                            className="flex items-center bg-slate-50 rounded-md px-1.5 py-0.5 border border-slate-200 focus-within:border-vivero-primary focus-within:bg-white transition-all"
                          >
                            <input
                              type="number"
                              min="1"
                              value={item.quantity === 0 ? '' : item.quantity}
                              onFocus={() => {
                                if (!isMobile) return;
                                setQtyInputFocused(true);
                                setTimeout(() => {
                                  document
                                    .getElementById(`cart-qty-${item.product.id}`)
                                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 350);
                              }}
                              onBlur={() => {
                                setQtyInputFocused(false);
                                if (!item.quantity || item.quantity <= 0) {
                                  updateQuantity(item.product.id, 1);
                                }
                              }}
                              onChange={e => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                const num = parseInt(raw, 10);
                                if (isNaN(num)) {
                                  updateQuantity(item.product.id, 0);
                                } else if (maxStock > 0 && num > maxStock) {
                                  updateQuantity(item.product.id, maxStock);
                                  setAddressError(`No es posible ingresar una cantidad superior al stock disponible. Se ajustó a la cantidad máxima permitida (${maxStock} ${item.product.unitType === 'M2' ? 'm²' : 'und'}).`);
                                } else {
                                  setAddressError('');
                                  updateQuantity(item.product.id, num);
                                }
                              }}
                              className="w-10 text-center text-[11px] font-black text-slate-800 bg-transparent focus:outline-none p-0"
                            />
                            <span className="text-[9px] font-extrabold text-slate-400 pl-0.5 select-none">
                              {item.product.unitType === 'M2' ? 'm²' : 'und'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const step = item.product.unitType === 'M2' ? 5 : 1;
                              const targetQty = item.quantity + step;
                              if (maxStock > 0 && targetQty > maxStock) {
                                updateQuantity(item.product.id, maxStock);
                                setAddressError(`Alcanzaste el stock máximo disponible en vivero (${maxStock} ${item.product.unitType === 'M2' ? 'm²' : 'und'}).`);
                              } else {
                                setAddressError('');
                                updateQuantity(item.product.id, targetQty);
                              }
                            }}
                            className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 transition-colors flex-shrink-0"
                            title="Aumentar cantidad"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right flex flex-col justify-between items-end h-12 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-300 hover:text-red-500 p-0.5 transition-colors"
                          title="Quitar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="text-right">
                          {hasDiscount && (
                            <span className="text-[9px] font-bold text-slate-400 line-through block leading-none">
                              S/ {(displayOriginalPrice * item.quantity).toFixed(2)}
                            </span>
                          )}
                          <span className="font-black text-vivero-dark text-xs sm:text-sm block leading-tight">
                            S/ {item.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modern Payment Methods Section with Pago Mixto - Compact */}
              <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-vivero-primary" />
                    <span>Método de Pago</span>
                  </label>
                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase ${
                    isMixedPayment ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-vivero-soft text-vivero-dark border border-vivero-mint/30'
                  }`}>
                    {isMixedPayment ? '🔀 Pago Mixto' : 'Único'}
                  </span>
                </div>

                {/* Grid of Single Payment Methods + Pago Mixto Tile */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'EFECTIVO' as PaymentMethod, label: 'Efectivo', icon: Banknote, color: 'text-emerald-700' },
                    { key: 'YAPE' as PaymentMethod, label: 'Yape', icon: Smartphone, color: 'text-purple-600' },
                    { key: 'PLIN' as PaymentMethod, label: 'Plin', icon: Smartphone, color: 'text-blue-600' },
                    { key: 'TRANSFERENCIA' as PaymentMethod, label: 'Transf.', icon: Landmark, color: 'text-slate-700' },
                    { key: 'TARJETA' as PaymentMethod, label: 'Tarjeta', icon: CreditCard, color: 'text-indigo-600' },
                    { key: 'MIXTO' as PaymentMethod, label: 'Mixto 🔀', icon: Split, color: 'text-amber-700' },
                  ].map(m => {
                    const isSelected = isMixedPayment ? m.key === 'MIXTO' : paymentMethod === m.key;
                    const IconComp = m.icon;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => {
                          if (m.key === 'MIXTO') {
                            setIsMixedPayment(true);
                            setMixedMethod1('EFECTIVO');
                            setMixedMethod2('YAPE');
                            const half = (total / 2).toFixed(2);
                            setMixedAmount1(half);
                            setMixedAmount2((total - parseFloat(half)).toFixed(2));
                            setTimeout(() => {
                              document
                                .getElementById('cart-pay-mixed-config')
                                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 150);
                          } else {
                            setIsMixedPayment(false);
                            setPaymentMethod(m.key);
                            if (m.key === 'EFECTIVO') {
                              setTimeout(() => {
                                document
                                  .getElementById('cart-pay-cash-config')
                                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }, 150);
                            }
                          }
                        }}
                        className={`py-1.5 px-1.5 rounded-xl border text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-[#1b4332] text-vivero-mint border-[#1b4332] shadow-2xs font-black'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/80'
                        }`}
                      >
                        <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-vivero-mint' : m.color}`} />
                        <span className="text-[10px] truncate">{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Cash Payment Change Calculator Sub-card - Compact */}
                {!isMixedPayment && paymentMethod === 'EFECTIVO' && (
                  <div
                    id="cart-pay-cash-config"
                    className="bg-white p-2.5 rounded-xl border border-emerald-200/80 shadow-2xs space-y-1.5 animate-in fade-in duration-150"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <span className="text-[10px] font-extrabold text-emerald-900 flex items-center gap-1">
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Cálculo de Vuelto (Efectivo)</span>
                      </span>
                      <span className="text-[10px] font-bold text-vivero-dark">
                        Total: <strong>S/ {total.toFixed(2)}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div>
                        <label className="text-[8px] font-extrabold text-slate-500 uppercase block mb-0.5">
                          Monto Recibido (S/)
                        </label>
                        <input
                          id="cart-pay-cash"
                          type="number"
                          step="0.5"
                          value={cashReceived}
                          onChange={e => setCashReceived(e.target.value)}
                          onFocus={() => {
                            if (!isMobile) return;
                            setTimeout(() => {
                              document
                                .getElementById('cart-pay-cash')
                                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 350);
                          }}
                          placeholder={`Ej. ${(Math.ceil(total / 10) * 10).toFixed(2)}`}
                          className="w-full px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-vivero-primary"
                        />
                      </div>

                      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/80 text-center">
                        <span className="text-[8px] font-extrabold text-slate-400 block uppercase">
                          Vuelto a Entregar
                        </span>
                        <span className={`text-xs font-black ${
                          (parseFloat(cashReceived) || 0) >= total ? 'text-emerald-700' : 'text-slate-400'
                        }`}>
                          S/ {Math.max(0, (parseFloat(cashReceived) || 0) - total).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Quick Preset Buttons for Fast Cash Entry */}
                    <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase">Billetes:</span>
                      {[10, 20, 50, 100, 200].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCashReceived(preset.toString())}
                          className="px-1.5 py-0.2 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 font-extrabold text-[9px] rounded transition-colors"
                        >
                          S/ {preset}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCashReceived(total.toFixed(2))}
                        className="px-1.5 py-0.2 bg-vivero-soft hover:bg-emerald-100 text-vivero-dark font-black text-[9px] rounded transition-colors border border-vivero-mint/40"
                        title="Ingresar el monto exacto del total"
                      >
                        Exacto ✓
                      </button>
                    </div>

                    {/* Live Validation Alert */}
                    {cashReceived.trim() !== '' && (parseFloat(cashReceived) || 0) < total && (
                      <p className="text-[9px] font-bold text-amber-600 flex items-center gap-1">
                        ⚠️ Monto recibido menor al total (Faltan S/ {(total - (parseFloat(cashReceived) || 0)).toFixed(2)})
                      </p>
                    )}

                    {cashReceived.trim() !== '' && (parseFloat(cashReceived) || 0) >= total && (
                      <p className="text-[9px] font-black text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Se le dio vuelto: <strong>S/ {((parseFloat(cashReceived) || 0) - total).toFixed(2)}</strong></span>
                      </p>
                    )}
                  </div>
                )}

                {/* Sub-card for Mixed Payment (Pago Mixto) Details - Custom Modern Combos */}
                {isMixedPayment && (
                  <div
                    id="cart-pay-mixed-config"
                    className="bg-white p-2.5 rounded-xl border border-purple-200/80 shadow-2xs space-y-2.5 animate-in fade-in duration-150"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <span className="text-[10px] font-black text-purple-900 flex items-center gap-1">
                        <Split className="w-3.5 h-3.5 text-purple-600" />
                        <span>Configuración de Pago Mixto</span>
                      </span>
                      <span className="text-[10px] font-bold text-vivero-dark">
                        Total: S/ {total.toFixed(2)}
                      </span>
                    </div>

                    {/* Method 1 Breakdown */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <label className="text-[8px] font-extrabold text-slate-400 uppercase block mb-0.5">Método 1</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMixedCombo1Open(!isMixedCombo1Open);
                            setIsMixedCombo2Open(false);
                          }}
                          className={`w-full px-2 py-1 bg-slate-50 hover:bg-white rounded-lg border transition-all text-[10px] font-bold text-slate-800 flex items-center justify-between shadow-2xs ${
                            isMixedCombo1Open
                              ? 'border-vivero-primary ring-2 ring-vivero-mint/40 bg-white'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className={`p-0.5 rounded flex items-center justify-center flex-shrink-0 ${mixedOpt1.badgeBg}`}>
                              <mixedOpt1.icon className="w-3 h-3" />
                            </div>
                            <span className="truncate">{mixedOpt1.label}</span>
                          </div>
                          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-0.5 ${isMixedCombo1Open ? 'rotate-180' : ''}`} />
                        </button>

                        {isMixedCombo1Open && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsMixedCombo1Open(false)} />
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-2xl z-40 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                              {MIXED_PAYMENT_OPTIONS.map(opt => {
                                const isSelected = mixedMethod1 === opt.key;
                                const IconComp = opt.icon;
                                return (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => {
                                      setMixedMethod1(opt.key);
                                      setIsMixedCombo1Open(false);
                                    }}
                                    className={`w-full p-1.5 rounded-lg text-left flex items-center justify-between transition-all ${
                                      isSelected
                                        ? 'bg-vivero-soft/80 border border-vivero-primary/40 text-vivero-dark font-black'
                                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <div className={`p-1 rounded flex items-center justify-center flex-shrink-0 ${opt.badgeBg}`}>
                                        <IconComp className="w-3 h-3" />
                                      </div>
                                      <span className="text-[10px] font-bold truncate">{opt.label}</span>
                                    </div>
                                    {isSelected && <Check className="w-3 h-3 text-vivero-primary stroke-[3]" />}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>

                      <div>
                        <label className="text-[8px] font-extrabold text-slate-400 uppercase block mb-0.5">Monto 1 (S/)</label>
                        <input
                          id="cart-pay-mixed1"
                          type="number"
                          step="0.5"
                          value={mixedAmount1}
                          onChange={e => {
                            const val = e.target.value;
                            setMixedAmount1(val);
                            const num1 = parseFloat(val) || 0;
                            setMixedAmount2(Math.max(0, total - num1).toFixed(2));
                          }}
                          onFocus={() => {
                            if (!isMobile) return;
                            setTimeout(() => {
                              document
                                .getElementById('cart-pay-mixed1')
                                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 350);
                          }}
                          placeholder="Monto 1"
                          className="w-full px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-800 focus:outline-none focus:border-vivero-primary"
                        />
                      </div>
                    </div>

                    {/* Method 2 Breakdown */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <label className="text-[8px] font-extrabold text-slate-400 uppercase block mb-0.5">Método 2</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMixedCombo2Open(!isMixedCombo2Open);
                            setIsMixedCombo1Open(false);
                          }}
                          className={`w-full px-2 py-1 bg-slate-50 hover:bg-white rounded-lg border transition-all text-[10px] font-bold text-slate-800 flex items-center justify-between shadow-2xs ${
                            isMixedCombo2Open
                              ? 'border-vivero-primary ring-2 ring-vivero-mint/40 bg-white'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className={`p-0.5 rounded flex items-center justify-center flex-shrink-0 ${mixedOpt2.badgeBg}`}>
                              <mixedOpt2.icon className="w-3 h-3" />
                            </div>
                            <span className="truncate">{mixedOpt2.label}</span>
                          </div>
                          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-0.5 ${isMixedCombo2Open ? 'rotate-180' : ''}`} />
                        </button>

                        {isMixedCombo2Open && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsMixedCombo2Open(false)} />
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-2xl z-40 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                              {MIXED_PAYMENT_OPTIONS.map(opt => {
                                const isSelected = mixedMethod2 === opt.key;
                                const IconComp = opt.icon;
                                return (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => {
                                      setMixedMethod2(opt.key);
                                      setIsMixedCombo2Open(false);
                                    }}
                                    className={`w-full p-1.5 rounded-lg text-left flex items-center justify-between transition-all ${
                                      isSelected
                                        ? 'bg-vivero-soft/80 border border-vivero-primary/40 text-vivero-dark font-black'
                                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <div className={`p-1 rounded flex items-center justify-center flex-shrink-0 ${opt.badgeBg}`}>
                                        <IconComp className="w-3 h-3" />
                                      </div>
                                      <span className="text-[10px] font-bold truncate">{opt.label}</span>
                                    </div>
                                    {isSelected && <Check className="w-3 h-3 text-vivero-primary stroke-[3]" />}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>

                      <div>
                        <label className="text-[8px] font-extrabold text-slate-400 uppercase block mb-0.5">Monto 2 (S/)</label>
                        <input
                          id="cart-pay-mixed2"
                          type="number"
                          step="0.5"
                          value={mixedAmount2}
                          onChange={e => setMixedAmount2(e.target.value)}
                          onFocus={() => {
                            if (!isMobile) return;
                            setTimeout(() => {
                              document
                                .getElementById('cart-pay-mixed2')
                                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 350);
                          }}
                          placeholder="Monto 2"
                          className="w-full px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-800 focus:outline-none focus:border-vivero-primary"
                        />
                      </div>
                    </div>

                    {/* Sum Validation Indicator */}
                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-500">Suma combinada:</span>
                      <span className={`font-black ${
                        Math.abs(((parseFloat(mixedAmount1) || 0) + (parseFloat(mixedAmount2) || 0)) - total) <= MIXED_PAYMENT_TOLERANCE
                          ? 'text-emerald-700' : 'text-red-500 animate-pulse'
                      }`}>
                        S/ {((parseFloat(mixedAmount1) || 0) + (parseFloat(mixedAmount2) || 0)).toFixed(2)}
                        {Math.abs(((parseFloat(mixedAmount1) || 0) + (parseFloat(mixedAmount2) || 0)) - total) <= MIXED_PAYMENT_TOLERANCE ? ' ✓' : ' ⚠️'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {items.length > 0 && (() => {
          const currentChange = (!isMixedPayment && paymentMethod === 'EFECTIVO' && cashReceived.trim() !== '')
            ? Math.max(0, (parseFloat(cashReceived) || 0) - total)
            : 0;

          return (
            <div className={`p-4 sm:p-4.5 border-t border-slate-100 bg-slate-50/80 space-y-2.5 flex-shrink-0 transition-all duration-300 ${
              qtyInputFocused && isMobile ? 'max-h-0 overflow-hidden opacity-0 border-t-0 p-0' : ''
            }`}>
              {/* Customized Error Alert Banner */}
              {addressError && (
                <div className="p-2.5 bg-rose-50 border-2 border-rose-200 rounded-2xl text-rose-900 text-xs font-bold flex items-start gap-2 animate-in fade-in zoom-in-95 duration-150 shadow-xs">
                  <div className="p-1 rounded-lg bg-rose-100 text-rose-700 flex-shrink-0 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block font-black text-rose-900 text-[11px] uppercase tracking-wider">
                      ⚠️ Alerta de Inventario / Venta
                    </span>
                    <span className="block font-bold text-rose-800 text-[10px] leading-relaxed mt-0.5">
                      {addressError}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1 text-xs font-bold text-slate-600">
                <div className="flex justify-between text-[11px]">
                  <span>Subtotal</span>
                  <span>S/ {subtotal.toFixed(2)}</span>
                </div>

                {isDelivery && deliveryFee > 0 && (
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Delivery</span>
                    <span>S/ {deliveryFee.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total a Pagar</span>
                  <span className="text-[#1b4332]">S/ {total.toFixed(2)}</span>
                </div>

                {currentChange > 0 && (
                  <div className="flex justify-between text-emerald-800 font-black bg-emerald-100/90 px-2.5 py-1 rounded-xl border border-emerald-300/80 mt-1 text-xs">
                    <span>💵 Vuelto a Entregar</span>
                    <span>S/ {currentChange.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full py-3 sm:py-3.5 rounded-xl bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint font-extrabold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-vivero-mint border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finalizar Compra • S/ {total.toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>
          );
        })()}
      </div>

      {/* Interactive Location Validation Map Modal */}
      <LocationPickerModal
        isOpen={isMapModalOpen}
        address={deliveryAddress}
        onClose={() => setIsMapModalOpen(false)}
        onConfirmLocation={(confirmedAddress) => {
          setDeliveryAddress(confirmedAddress);
          setIsLocationValidated(true);
          setAddressError('');
        }}
      />
    </div>
  );
};
