import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, PaymentMethod, Customer, getProductPricing } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, origin?: { x: number; y: number }) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  deliveryFee: number;
  setDeliveryFee: (fee: number) => void;
  total: number;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cartBump: number;
}

interface FlyItem {
  id: number;
  src: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('vivero_cart_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error al cargar el carrito desde localStorage:', e);
    }
    return [];
  });

  const [flyItem, setFlyItem] = useState<FlyItem | null>(null);
  const [cartBump, setCartBump] = useState<number>(0);

  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('YAPE');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('vivero_cart_items', JSON.stringify(items));
    } catch (e) {
      console.error('Error al guardar el carrito en localStorage:', e);
    }
  }, [items]);

  useEffect(() => {
    const handlePricesUpdated = (e: Event) => {
      const updated = (e as CustomEvent).detail?.product as Product | undefined;
      if (!updated) return;
      setItems(prev =>
        prev.map(item => {
          if (item.product.id !== updated.id) return item;
          const pricing = getProductPricing(updated);
          return {
            ...item,
            product: updated,
            unitPrice: pricing.sellingPrice,
            totalPrice: item.quantity * pricing.sellingPrice
          };
        })
      );
    };
    window.addEventListener('vivero_cart_prices_updated', handlePricesUpdated);
    return () => window.removeEventListener('vivero_cart_prices_updated', handlePricesUpdated);
  }, []);

  const flyToCart = (src: string, fromX: number, fromY: number): boolean => {
    const trigger = document.querySelector('[data-cart-trigger]');
    if (!trigger) return false;
    const rect = trigger.getBoundingClientRect();
    const id = Date.now();
    setFlyItem({
      id,
      src,
      fromX,
      fromY,
      toX: rect.left + rect.width / 2,
      toY: rect.top + rect.height / 2
    });
    setTimeout(() => {
      setFlyItem(cur => (cur?.id === id ? null : cur));
      setCartBump(b => b + 1);
    }, 500);
    return true;
  };

  const addToCart = (product: Product, quantity = 1, origin?: { x: number; y: number }) => {
    const available = product.availableStock !== undefined && product.availableStock !== null
      ? product.availableStock
      : product.stock;

    if (available <= 0) {
      console.warn(`No se puede agregar al carrito: "${product.name}" está agotado.`);
      return;
    }

    if (origin && product.imageUrl) {
      const flew = flyToCart(product.imageUrl, origin.x, origin.y);
      if (!flew) {
        setTimeout(() => setCartBump(b => b + 1), 200);
      }
    } else {
      setTimeout(() => setCartBump(b => b + 1), 200);
    }

    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const targetQty = Math.min(existing.quantity + quantity, available);
        return prev.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: targetQty,
                totalPrice: targetQty * item.unitPrice
              }
            : item
        );
      }
      const pricing = getProductPricing(product);
      const sellingPrice = pricing.sellingPrice;
      const initialQty = Math.min(quantity, available);
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

  const removeFromCart = (productId: number) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const validQty = Math.max(0, quantity);
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: validQty, totalPrice: validQty * item.unitPrice }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem('vivero_cart_items');
    } catch (e) {
      console.error('Error al limpiar el carrito en localStorage:', e);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        deliveryFee,
        setDeliveryFee,
        total,
        selectedCustomer,
        setSelectedCustomer,
        paymentMethod,
        setPaymentMethod,
        isCartOpen,
        setIsCartOpen,
        cartBump
      }}
    >
      {children}
      {flyItem && (
        <div
          key={flyItem.id}
          className="fixed z-[9999] pointer-events-none"
          style={{ left: flyItem.fromX - 16, top: flyItem.fromY - 16 }}
        >
          <div
            className="fly-to-cart-x"
            style={{ '--fx': `${flyItem.toX - flyItem.fromX}px` } as React.CSSProperties}
          >
            <div
              className="fly-to-cart-y"
              style={{ '--fy': `${flyItem.toY - flyItem.fromY}px` } as React.CSSProperties}
            >
              <img
                src={flyItem.src}
                alt=""
                className="w-8 h-8 rounded-xl object-cover shadow-lg border-2 border-white"
              />
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
