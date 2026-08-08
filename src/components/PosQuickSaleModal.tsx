import React, { useState, useEffect } from 'react';
import { saleApi, productApi, deliveryMethodApi } from '../services/api';
import { Product, Customer, PaymentMethod, DeliveryMethod, getProductPricing } from '../types';
import { useCart } from '../context/CartContext';
import { LocationPickerModal } from './LocationPickerModal';
import { CustomerSearchCombo } from './CustomerSearchCombo';
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  DollarSign,
  CheckCircle2,
  Receipt,
  ShoppingBag,
  Sprout,
  Flower2,
  Trees,
  Package,
  Calculator,
  Truck,
  Store,
  ChevronDown,
  Check,
  MapPin,
  Banknote,
  Smartphone,
  Landmark,
  Split,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface PosQuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessSale: (saleData: any) => void;
}

export const PosQuickSaleModal: React.FC<PosQuickSaleModalProps> = ({
  isOpen,
  onClose,
  onSuccessSale
}) => {
  if (!isOpen) return null;

  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [registeredDeliveryMethods, setRegisteredDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [selectedDeliveryMethodId, setSelectedDeliveryMethodId] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [posItems, setPosItems] = useState<
    { product: Product; quantity: number; unitPrice: number; totalPrice: number }[]
  >([]);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isOccasional, setIsOccasional] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [addressError, setAddressError] = useState('');

  // Auto-dismiss alert messages after 3 seconds
  useEffect(() => {
    if (!addressError) return;
    const timer = setTimeout(() => {
      setAddressError('');
    }, 3000);
    return () => clearTimeout(timer);
  }, [addressError]);
  const [isDeliveryDropdownOpen, setIsDeliveryDropdownOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isLocationValidated, setIsLocationValidated] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('YAPE');
  const [amountReceived, setAmountReceived] = useState<string>('500');
  const [isProcessing, setIsProcessing] = useState(false);

  // Pago Mixto State
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

  useEffect(() => {
    if (!isOpen) return;

    const fetchPosData = async () => {
      try {
        const [prodRes, mRes] = await Promise.all([
          productApi.getAllProducts().catch(() => null),
          deliveryMethodApi.getActive().catch(() => null)
        ]);

        if (prodRes?.data && prodRes.data.length > 0) {
          setDbProducts(prodRes.data);
          // Set initial demo POS items from real products
          if (posItems.length === 0) {
            const firstP = prodRes.data[0];
            if (firstP) {
              setPosItems([{
                product: firstP,
                quantity: firstP.unitType === 'M2' ? 10 : 1,
                unitPrice: firstP.price,
                totalPrice: (firstP.unitType === 'M2' ? 10 : 1) * firstP.price
              }]);
            }
          }
        } else {
          setDbProducts([]);
        }

        if (mRes?.data && mRes.data.length > 0) {
          const activeOnly = mRes.data.filter((m: DeliveryMethod) => m.active !== false);
          setRegisteredDeliveryMethods(activeOnly);
        }
      } catch (err) {
        console.error('Error al cargar datos POS desde MySQL:', err);
        setDbProducts([]);
      }
    };

    fetchPosData();
  }, [isOpen]);

  const activeDeliveryMethods = registeredDeliveryMethods.filter(m => m.active !== false);
  const selectedDeliveryObj = activeDeliveryMethods.find(m => m.id === selectedDeliveryMethodId);
  const isDelivery = selectedDeliveryObj ? selectedDeliveryObj.type === 'DELIVERY' : false;
  const currentDeliveryFee = isDelivery && selectedDeliveryObj ? selectedDeliveryObj.price : 0;

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

  const categories = [
    { name: 'Todos', icon: Sprout },
    { name: 'Grass', icon: Sprout },
    { name: 'Plantas', icon: Flower2 },
    { name: 'Árboles', icon: Trees },
    { name: 'Accesorios', icon: Package },
  ];

  // Add Product to POS Ticket with Real-Time Stock Validation
  const handleAddProduct = (product: Product) => {
    const step = product.unitType === 'M2' ? 5 : 1;
    const maxStock = product.availableStock !== undefined && product.availableStock !== null
      ? product.availableStock
      : product.stock;

    if (maxStock <= 0) {
      setAddressError(`El producto ${product.name} no cuenta con stock disponible en vivero.`);
      return;
    }

    setPosItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const targetQty = existing.quantity + step;
        if (maxStock > 0 && targetQty > maxStock) {
          setAddressError(`No es posible ingresar una cantidad superior al stock disponible para ${product.name}. Se fijó en la cantidad máxima permitida (${maxStock} ${product.unitType === 'M2' ? 'm²' : 'und'}).`);
          return prev.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: maxStock, totalPrice: maxStock * item.unitPrice }
              : item
          );
        }
        setAddressError('');
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: targetQty, totalPrice: targetQty * item.unitPrice }
            : item
        );
      }
      setAddressError('');
      const sellingPrice = getProductPricing(product).sellingPrice;
      const initialQty = Math.min(step, maxStock);
      return [
        ...prev,
        {
          product,
          quantity: initialQty,
          unitPrice: sellingPrice,
          totalPrice: initialQty * sellingPrice
        }
      ];
    });
  };

  const handleSetExactQuantity = (productId: number, targetQty: number) => {
    setPosItems(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const maxStock = item.product.availableStock !== undefined && item.product.availableStock !== null
            ? item.product.availableStock
            : item.product.stock;

          let validQty = targetQty;
          if (maxStock > 0 && validQty > maxStock) {
            validQty = maxStock;
            setAddressError(`No es posible ingresar una cantidad superior al stock disponible. Se ajustó a la cantidad máxima permitida (${maxStock} ${item.product.unitType === 'M2' ? 'm²' : 'und'}).`);
          } else {
            setAddressError('');
          }

          return {
            ...item,
            quantity: Math.max(0, validQty),
            totalPrice: Math.max(0, validQty) * item.unitPrice
          };
        }
        return item;
      })
    );
  };

  const handleUpdateQuantity = (productId: number, delta: number) => {
    const item = posItems.find(i => i.product.id === productId);
    if (!item) return;
    const targetQty = item.quantity + delta;
    if (targetQty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    handleSetExactQuantity(productId, targetQty);
  };

  const handleRemoveItem = (productId: number) => {
    setPosItems(prev => prev.filter(item => item.product.id !== productId));
  };

  // Filter Catalog Products from DB or Mock
  const productsToDisplay = dbProducts;

  const filteredProducts = productsToDisplay.filter(p => {
    const query = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(query) || p.categoryName.toLowerCase().includes(query) || p.code.toLowerCase().includes(query);
    const matchesCat = selectedCategory === 'Todos' || p.categoryName.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCat;
  });

  const subtotal = posItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal + currentDeliveryFee;
  const numAmountReceived = parseFloat(amountReceived) || 0;
  const changeDue = Math.max(0, numAmountReceived - total);

  const handleCheckoutSale = async () => {
    if (posItems.length === 0) return;

    if (isDelivery && !deliveryAddress.trim()) {
      setAddressError('La dirección de entrega es obligatoria cuando selecciona Delivery.');
      return;
    }

    let finalPaymentMethodStr = paymentMethod as string;

    if (isMixedPayment) {
      const amt1 = parseFloat(mixedAmount1) || 0;
      const amt2 = parseFloat(mixedAmount2) || 0;
      const combinedSum = amt1 + amt2;

      if (amt1 <= 0 || amt2 <= 0) {
        setAddressError('En Pago Mixto, ambos montos deben ser mayores a S/ 0.00.');
        return;
      }

      if (Math.abs(combinedSum - total) > 0.05) {
        setAddressError(`En Pago Mixto, la suma de montos (S/ ${combinedSum.toFixed(2)}) debe coincidir con el total (S/ ${total.toFixed(2)}).`);
        return;
      }

      finalPaymentMethodStr = `MIXTO: ${mixedMethod1} (S/ ${amt1.toFixed(2)}) + ${mixedMethod2} (S/ ${amt2.toFixed(2)})`;
    } else if (paymentMethod === 'EFECTIVO') {
      if (numAmountReceived < total) {
        setAddressError(`El monto recibido (S/ ${numAmountReceived.toFixed(2)}) es menor al total a cobrar (S/ ${total.toFixed(2)}).`);
        return;
      }
      finalPaymentMethodStr = `EFECTIVO (Recibido: S/ ${numAmountReceived.toFixed(2)}, Vuelto: S/ ${changeDue.toFixed(2)})`;
    }

    setAddressError('');
    setIsProcessing(true);

    try {
      const itemsPayload = posItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }));

      await saleApi.createSale({
        customerId: selectedCustomer?.id,
        customerName: customerName || 'Cliente General',
        customerPhone: customerPhone || 'N/A',
        items: itemsPayload,
        deliveryFee: currentDeliveryFee,
        paymentMethod: finalPaymentMethodStr,
        createOrderForDelivery: isDelivery,
        deliveryAddress: isDelivery ? deliveryAddress : undefined,
        deliveryTimeSlot: isDelivery ? '10:00 AM - 02:00 PM (Tarde)' : undefined
      });

      window.dispatchEvent(new CustomEvent('vivero_products_updated'));

      const saleObj = {
        receiptNumber: 'VNT-2026-' + Math.floor(1000 + Math.random() * 9000),
        customerName,
        customerPhone,
        deliveryAddress: isDelivery ? deliveryAddress : 'Recojo en Vivero / Local',
        items: posItems,
        subtotal,
        deliveryFee: currentDeliveryFee,
        total,
        paymentMethod: finalPaymentMethodStr,
        saleDate: new Date().toISOString()
      };

      onSuccessSale(saleObj);
      onClose();
    } catch (err: any) {
      console.error('Error al procesar la venta en MySQL:', err);
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
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-5xl h-[100vh] sm:h-[90vh] rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1b4332] text-vivero-mint flex items-center justify-center font-bold shadow-md">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                Punto de Venta POS • Venta Rápida
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Selecciona productos del catálogo y emite el comprobante en caja.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Layout: Split Catalog (Left) + Cart Ticket (Right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Product Catalog Grid (7 cols) */}
          <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-slate-100 p-4 flex flex-col gap-3 overflow-y-auto bg-slate-50/50">
            {/* Search Input & Categories */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar grass, planta o producto..."
                  className="w-full pl-8 pr-4 py-2 bg-white rounded-xl text-xs font-semibold text-slate-800 border border-slate-200/80 focus:outline-none focus:border-vivero-primary"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const isActive = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap flex items-center gap-1 transition-all ${
                        isActive
                          ? 'bg-[#1b4332] text-vivero-mint shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Catalog Grid Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto pr-1 flex-1">
              {filteredProducts.map(product => {
                const isM2 = product.unitType === 'M2';
                const pricing = getProductPricing(product);

                return (
                  <div
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-card hover:shadow-soft transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="relative h-20 w-full rounded-xl overflow-hidden bg-slate-100">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      {product.brand && (
                        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
                          {product.brand}
                        </span>
                      )}
                      <h4 className="font-extrabold text-slate-800 text-xs break-words leading-snug">
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold">
                        Stock: {product.availableStock} {isM2 ? 'm²' : 'und'}
                      </p>
                    </div>

                    <div className="flex items-end justify-between pt-2 mt-1 border-t border-slate-100">
                      <div className="space-y-0.5">
                        {pricing.hasDiscount && (
                          <span className="bg-[#e11d48] text-white font-black text-[9px] px-1.5 py-0.2 rounded-md inline-block">
                            -{pricing.discountPercentage}%
                          </span>
                        )}
                        <span className="text-xs font-black text-slate-900 block leading-tight">
                          S/ {pricing.sellingPrice.toFixed(2)}
                        </span>
                        {pricing.hasDiscount && (
                          <span className="text-[10px] font-bold text-slate-400 line-through block leading-none">
                            S/ {pricing.basePrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button
                        className="w-6 h-6 rounded-lg bg-vivero-soft text-vivero-dark flex items-center justify-center font-bold hover:bg-[#1b4332] hover:text-vivero-mint transition-colors"
                        title="Añadir a la Venta"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Sale Ticket & Checkout (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between space-y-3 overflow-y-auto bg-white">
            
            {/* Customer & Delivery Toggle Bar */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
              {/* Modern Customer Search Combo */}
              <CustomerSearchCombo
                selectedCustomer={selectedCustomer}
                isOccasional={isOccasional}
                onSelectCustomer={handleSelectCustomerCombo}
              />

              {/* Read-Only Customer Personal Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${
                  !isOccasional ? 'bg-slate-100 text-slate-600 border-slate-200/80 cursor-not-allowed' : 'bg-white text-slate-800 border-slate-200'
                }`}>
                  <User className="w-3.5 h-3.5 text-vivero-primary flex-shrink-0" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    readOnly={!isOccasional}
                    disabled={!isOccasional}
                    placeholder="Nombre Cliente"
                    className="w-full text-xs font-bold bg-transparent focus:outline-none"
                  />
                </div>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  readOnly={!isOccasional}
                  disabled={!isOccasional}
                  placeholder="WhatsApp / Celular"
                  className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${
                    !isOccasional ? 'bg-slate-100 text-slate-600 border-slate-200/80 cursor-not-allowed' : 'bg-white text-slate-800 border-slate-200'
                  }`}
                />
              </div>

              {/* Modern Delivery Combo Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDeliveryDropdownOpen(!isDeliveryDropdownOpen)}
                  className="w-full px-2.5 py-1.5 bg-white rounded-xl border border-slate-200 hover:border-vivero-primary text-xs font-bold text-slate-800 flex items-center justify-between shadow-xs transition-all focus:outline-none"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isDelivery ? (
                      <div className="w-5 h-5 rounded-md bg-vivero-primary text-vivero-mint flex items-center justify-center flex-shrink-0">
                        <Truck className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center flex-shrink-0">
                        <Store className="w-3 h-3" />
                      </div>
                    )}
                    <span className="font-extrabold text-slate-800 text-xs truncate">
                      {selectedDeliveryObj ? selectedDeliveryObj.name : 'Venta Directa / En Vivero (Sin delivery)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      currentDeliveryFee > 0 ? 'bg-vivero-soft text-vivero-dark border border-vivero-primary/20' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {currentDeliveryFee > 0 ? `+S/ ${currentDeliveryFee.toFixed(2)}` : 'GRATIS'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDeliveryDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Floating Dropdown Menu */}
                {isDeliveryDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setIsDeliveryDropdownOpen(false)} 
                    />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 p-1.5 space-y-1 max-h-56 overflow-y-auto">
                      
                      {/* Option: Venta Directa en Vivero / Local */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDeliveryMethodId(null);
                          setAddressError('');
                          setIsDeliveryDropdownOpen(false);
                        }}
                        className={`w-full p-2 rounded-xl text-left flex items-start justify-between transition-all ${
                          !isDelivery
                            ? 'bg-emerald-50 border border-emerald-300/60 text-emerald-950 font-extrabold shadow-2xs'
                            : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <div className={`p-1.5 rounded-lg mt-0.5 flex-shrink-0 ${
                            !isDelivery ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <Store className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-extrabold text-xs text-slate-800 truncate">Venta Directa / En Vivero</span>
                              {!isDelivery && <Check className="w-3 h-3 text-emerald-600 stroke-[3] flex-shrink-0" />}
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium truncate">Atención presencial en local sin costo de despacho</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 flex-shrink-0">
                          S/ 0.00
                        </span>
                      </button>

                      {/* Active Registered Delivery Methods */}
                      {activeDeliveryMethods.map(m => {
                        const isSelected = selectedDeliveryMethodId === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setSelectedDeliveryMethodId(m.id);
                              setAddressError('');
                              setIsDeliveryDropdownOpen(false);
                            }}
                            className={`w-full p-2 rounded-xl text-left flex items-start justify-between transition-all ${
                              isSelected
                                ? 'bg-vivero-soft/70 border border-vivero-primary/30 text-vivero-dark font-extrabold shadow-2xs'
                                : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                            }`}
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <div className={`p-1.5 rounded-lg mt-0.5 flex-shrink-0 ${
                                isSelected ? 'bg-vivero-primary text-vivero-mint' : 'bg-slate-100 text-slate-500'
                              }`}>
                                <Truck className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="font-extrabold text-xs text-slate-800 truncate">{m.name}</span>
                                  {isSelected && <Check className="w-3 h-3 text-vivero-primary stroke-[3] flex-shrink-0" />}
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium truncate">{m.description || 'Envío de pedido'}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-black text-vivero-dark bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex-shrink-0">
                              +S/ {m.price.toFixed(2)}
                            </span>
                          </button>
                        );
                      })}

                    </div>
                  </>
                )}
              </div>

              {isDelivery && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={e => {
                          setDeliveryAddress(e.target.value);
                          if (e.target.value.trim()) setAddressError('');
                          setIsLocationValidated(false);
                        }}
                        placeholder="Dirección de entrega (obligatoria)"
                        className={`w-full px-2.5 py-1.5 bg-white rounded-xl text-xs font-semibold text-slate-800 border focus:outline-none ${
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
                      title="Validar punto de entrega en el mapa"
                    >
                      <MapPin className="w-3 h-3 text-vivero-primary" />
                      <span>{isLocationValidated ? 'Validado ✓' : 'Ver Mapa'}</span>
                    </button>
                  </div>
                  {addressError && (
                    <p className="text-[10px] font-bold text-red-500 mt-0.5">
                      ⚠️ {addressError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Added Ticket Items List */}
            <div className="flex-1 space-y-2 overflow-y-auto pr-1 max-h-[220px]">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Detalle del Ticket ({posItems.length})
              </span>

              {posItems.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-1">
                  <ShoppingBag className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-xs font-bold">Ticket vacío</p>
                  <p className="text-[10px]">Toca productos del catálogo para agregarlos.</p>
                </div>
              ) : (
                posItems.map(item => {
                  const isM2 = item.product.unitType === 'M2';
                  const step = isM2 ? 5 : 1;
                  return (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        {item.product.brand && (
                          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
                            {item.product.brand}
                          </span>
                        )}
                        <h5 className="font-extrabold text-slate-800 text-xs break-words leading-snug">
                          {item.product.name}
                        </h5>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-vivero-primary font-bold">
                            S/ {item.unitPrice.toFixed(2)} /{isM2 ? 'm²' : 'und'}
                          </span>
                          <span className="text-[8px] font-extrabold text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                            Stock: {item.product.availableStock !== undefined && item.product.availableStock !== null ? item.product.availableStock : item.product.stock} {isM2 ? 'm²' : 'und'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.product.id, -step)}
                          className="w-5 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 flex-shrink-0"
                          title="Reducir"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <div className="flex items-center bg-white rounded-md px-1 py-0.5 border border-slate-200 focus-within:border-vivero-primary transition-all">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity === 0 ? '' : item.quantity}
                            onChange={e => {
                              const raw = e.target.value.replace(/[^0-9]/g, '');
                              const num = parseInt(raw, 10);
                              handleSetExactQuantity(item.product.id, isNaN(num) ? 0 : num);
                            }}
                            onBlur={() => {
                              if (!item.quantity || item.quantity <= 0) {
                                handleSetExactQuantity(item.product.id, 1);
                              }
                            }}
                            className="w-9 text-center text-[11px] font-black text-slate-800 bg-transparent focus:outline-none p-0"
                          />
                          <span className="text-[9px] font-extrabold text-slate-400 pl-0.5 select-none">
                            {isM2 ? 'm²' : 'u'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.product.id, step)}
                          className="w-5 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 flex-shrink-0"
                          title="Aumentar"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right pl-3 min-w-[65px]">
                        <span className="font-black text-slate-900 block text-xs">
                          S/ {item.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Payment Method Selector, Cash Calculator & Mixed Payment */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">
                  Método de Pago POS
                </span>
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase ${
                  isMixedPayment ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-vivero-soft text-vivero-dark border border-vivero-mint/30'
                }`}>
                  {isMixedPayment ? '🔀 Pago Mixto' : 'Único'}
                </span>
              </div>

              {/* Grid of Payment Methods */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
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
                        } else {
                          setIsMixedPayment(false);
                          setPaymentMethod(m.key);
                        }
                      }}
                      className={`py-1.5 px-1 rounded-xl border text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-[#1b4332] text-vivero-mint border-[#1b4332] shadow-2xs font-black'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                      }`}
                    >
                      <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-vivero-mint' : m.color}`} />
                      <span className="text-[10px] truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Cash Change Calculator */}
              {!isMixedPayment && paymentMethod === 'EFECTIVO' && (
                <div className="bg-emerald-50/90 p-2 sm:p-2.5 rounded-xl border border-emerald-200/80 shadow-2xs space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="text-[11px] font-black">Monto Recibido S/:</span>
                      <input
                        type="number"
                        step="0.5"
                        value={amountReceived}
                        onChange={e => setAmountReceived(e.target.value)}
                        placeholder={`Ej. ${(Math.ceil(total / 10) * 10).toFixed(2)}`}
                        className="w-16 px-2 py-0.5 bg-white rounded-lg border border-emerald-300 text-xs font-black text-slate-800 focus:outline-none focus:border-vivero-primary"
                      />
                    </div>
                    <span className="text-[11px] font-bold">Vuelto: <strong className="text-xs sm:text-sm font-black text-emerald-800">S/ {changeDue.toFixed(2)}</strong></span>
                  </div>

                  {/* Bill Presets */}
                  <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase">Billetes:</span>
                    {[10, 20, 50, 100, 200].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmountReceived(preset.toString())}
                        className="px-1.5 py-0.2 bg-white hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 font-extrabold text-[9px] rounded border border-emerald-200/60 transition-colors"
                      >
                        S/ {preset}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAmountReceived(total.toFixed(2))}
                      className="px-1.5 py-0.2 bg-emerald-200 text-emerald-900 font-black text-[9px] rounded transition-colors"
                    >
                      Exacto
                    </button>
                  </div>
                </div>
              )}

              {/* Mixed Payment Configuration Sub-card - Custom Modern Combos */}
              {isMixedPayment && (
                <div className="bg-white p-2.5 rounded-xl border border-purple-200 shadow-2xs space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1 text-[11px] font-black text-purple-900">
                    <span className="flex items-center gap-1">
                      <Split className="w-3.5 h-3.5 text-purple-600" />
                      <span>Pago Mixto</span>
                    </span>
                    <span>Total: S/ {total.toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="relative">
                      <label className="font-extrabold text-slate-400 uppercase block mb-0.5">Método 1</label>
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
                      <label className="font-extrabold text-slate-400 uppercase block mb-0.5">Monto 1 (S/)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={mixedAmount1}
                        onChange={e => {
                          const val = e.target.value;
                          setMixedAmount1(val);
                          const num1 = parseFloat(val) || 0;
                          setMixedAmount2(Math.max(0, total - num1).toFixed(2));
                        }}
                        className="w-full px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 font-bold text-slate-800 focus:outline-none focus:border-vivero-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="relative">
                      <label className="font-extrabold text-slate-400 uppercase block mb-0.5">Método 2</label>
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
                      <label className="font-extrabold text-slate-400 uppercase block mb-0.5">Monto 2 (S/)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={mixedAmount2}
                        onChange={e => setMixedAmount2(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 font-bold text-slate-800 focus:outline-none focus:border-vivero-primary"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Totals & Submit Payment */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {/* Customized Error Alert Banner */}
              {addressError && (
                <div className="p-3 bg-rose-50 border-2 border-rose-200 rounded-2xl text-rose-900 text-xs font-bold flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-150 shadow-xs">
                  <div className="p-1 rounded-lg bg-rose-100 text-rose-700 flex-shrink-0 mt-0.5">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block font-black text-rose-900 text-xs uppercase tracking-wider mb-0.5">
                      ⚠️ Alerta de Inventario / Venta
                    </span>
                    <span className="block font-bold text-rose-800 text-[11px] leading-relaxed">
                      {addressError}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1 text-xs font-bold text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>S/ {currentDeliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total a Cobrar</span>
                  <span className="text-[#1b4332]">S/ {total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckoutSale}
                disabled={isProcessing || posItems.length === 0}
                className={`w-full py-3.5 rounded-2xl font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  posItems.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint'
                }`}
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-vivero-mint border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Cobrar e Imprimir Comprobante • S/ {total.toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
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
