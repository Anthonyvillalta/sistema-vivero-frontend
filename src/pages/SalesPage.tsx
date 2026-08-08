import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { productApi, categoryApi } from '../services/api';
import { Product, getProductPricing } from '../types';
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Loader2,
  Sprout,
  Flower2,
  Trees,
  Package,
  Leaf,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  X
} from 'lucide-react';

const CATEGORY_CHIPS = [
  { name: 'Todos', icon: Leaf },
  { name: 'Grass', icon: Sprout },
  { name: 'Plantas', icon: Flower2 },
  { name: 'Árboles', icon: Trees },
  { name: 'Accesorios', icon: Package }
];

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('grass')) return Sprout;
  if (name.includes('plant')) return Flower2;
  if (name.includes('árbol') || name.includes('palmer')) return Trees;
  if (name.includes('accesorio') || name.includes('insumo')) return Package;
  return Leaf;
};

export const SalesPage: React.FC = () => {
  const {
    items,
    addToCart,
    updateQuantity,
    removeFromCart,
    subtotal,
    total,
    setIsCartOpen,
    clearCart
  } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productApi.getAllProducts().catch(() => null),
        categoryApi.getAllCategories().catch(() => null)
      ]);
      if (prodRes?.data && prodRes.data.length > 0) {
        setProducts(prodRes.data);
      } else {
        setProducts([]);
      }
      if (catRes?.data && catRes.data.length > 0) {
        const catNames = catRes.data
          .map((c: { name: string }) => c.name)
          .filter((n: string) => n);
        if (catNames.length > 0) {
          const chipNames = ['Todos', 'Grass', 'Plantas', 'Árboles', 'Accesorios'];
          const extra = catNames.filter(
            (n: string) => !chipNames.some(chip => n.toLowerCase().includes(chip.toLowerCase()))
          );
          extra.forEach((n: string) => chipNames.push(n));
          setCategoryChips(chipNames.map(n => ({ name: n, icon: getCategoryIcon(n) })));
        }
      }
    } catch (err) {
      console.error('Error al cargar productos para POS:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const [categoryChips, setCategoryChips] = useState(CATEGORY_CHIPS);

  useEffect(() => {
    fetchProducts();
    const handleUpdate = () => {
      fetchProducts();
      setTimeout(() => fetchProducts(), 500);
    };
    window.addEventListener('vivero_products_updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    window.addEventListener('vivero_backend_online', handleUpdate);
    return () => {
      window.removeEventListener('vivero_products_updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      window.removeEventListener('vivero_backend_online', handleUpdate);
    };
  }, []);

  const filteredProducts = products.filter(p => {
    const query = search.toLowerCase().trim();
    const matchesSearch = !query ||
      p.name.toLowerCase().includes(query) ||
      p.categoryName.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query) ||
      (p.variety && p.variety.toLowerCase().includes(query)) ||
      (p.brand && p.brand.toLowerCase().includes(query));
    const matchesCategory = selectedCategory === 'Todos' ||
      p.categoryName.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartItemsCount = items.length;

  const handleAdd = (p: Product, e: React.MouseEvent) => {
    addToCart(p, 1, { x: e.clientX, y: e.clientY });
  };

  const handleToggle = (p: Product, e: React.MouseEvent) => {
    if (p.availableStock !== undefined && p.availableStock !== null
      ? p.availableStock <= 0
      : p.stock <= 0) return;
    const existing = items.find(i => i.product.id === p.id);
    if (existing) {
      removeFromCart(p.id);
    } else {
      addToCart(p, 1, { x: e.clientX, y: e.clientY });
    }
  };

  const handleQtyStep = (p: Product, delta: number) => {
    const current = items.find(i => i.product.id === p.id)?.quantity || 0;
    const maxStock = p.availableStock !== undefined && p.availableStock !== null ? p.availableStock : p.stock;
    const step = p.unitType === 'M2' ? 5 : 1;
    const next = Math.min(Math.max(1, current + delta * step), Math.max(1, maxStock));
    updateQuantity(p.id, next);
  };

  return (
    <div className="space-y-3 sm:space-y-3.5 pb-36 lg:pb-8">
      {/* POS Header */}
      <div className="bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#1b4332] rounded-2xl sm:rounded-3xl p-3 sm:p-5 text-white shadow-xl">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-vivero-soft/20 border border-vivero-mint/30 flex-shrink-0">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-vivero-mint" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-black leading-tight truncate">Punto de Venta POS</h2>
            <p className="text-[10px] sm:text-[11px] text-emerald-200 font-medium truncate">
              Selecciona productos y cobra en tiempo real
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-start">
        {/* Catalog Column */}
        <div className="flex-1 min-w-0 space-y-2.5 sm:space-y-3">
          {/* Search + Category Chips */}
          <div className="space-y-2 sm:space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar producto, código, variedad o marca..."
                className="w-full pl-8 sm:pl-10 pr-8 sm:pr-9 py-2 sm:py-2.5 bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-vivero-primary focus:ring-2 focus:ring-vivero-mint/30 shadow-2xs transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {categoryChips.map(chip => {
                const Icon = chip.icon;
                const isActive = selectedCategory === chip.name;
                return (
                  <button
                    key={chip.name}
                    onClick={() => setSelectedCategory(chip.name)}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1 sm:gap-1.5 whitespace-nowrap transition-all active:scale-95 border ${
                      isActive
                        ? 'bg-[#1b4332] text-vivero-mint border-[#1b4332] shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isActive ? 'text-vivero-mint' : 'text-vivero-primary'}`} />
                    {chip.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 overflow-hidden animate-pulse">
                  <div className="h-20 sm:h-28 bg-slate-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-2.5 bg-slate-200 rounded w-2/3" />
                    <div className="h-2.5 bg-slate-200 rounded w-1/2" />
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center space-y-2 bg-white rounded-3xl border border-slate-200/80 p-8">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-extrabold text-slate-700">No se encontraron productos</p>
              <p className="text-xs text-slate-400">Ajusta la búsqueda o la categoría seleccionada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
              {filteredProducts.map(p => {
                const pricing = getProductPricing(p);
                const maxStock = p.availableStock !== undefined && p.availableStock !== null ? p.availableStock : p.stock;
                const outOfStock = maxStock <= 0;
                const lowStock = maxStock > 0 && maxStock <= (p.minStock || 0);
                const inCart = items.find(i => i.product.id === p.id);
                const inCartQty = inCart?.quantity || 0;
                const step = p.unitType === 'M2' ? 5 : 1;
                const CategoryIcon = getCategoryIcon(p.categoryName);

                return (
                  <div
                    key={p.id}
                    onClick={e => handleToggle(p, e)}
                    className={`group bg-white rounded-xl sm:rounded-2xl border shadow-2xs overflow-hidden flex flex-col transition-all cursor-pointer select-none active:scale-[0.98] ${
                      outOfStock
                        ? 'border-slate-200/80 opacity-80 cursor-not-allowed'
                        : inCart
                          ? 'border-vivero-mint ring-2 ring-vivero-mint/30 hover:shadow-card'
                          : 'border-slate-200/80 hover:border-vivero-mint/50 hover:shadow-card'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-20 sm:h-28 object-cover bg-slate-100"
                      />
                      <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 flex flex-col gap-0.5 sm:gap-1">
                        {pricing.discountPercentage > 0 && (
                          <span className="bg-[#e11d48] text-white text-[8px] sm:text-[9px] font-black px-1 py-0.5 sm:px-1.5 rounded-md shadow-2xs">
                            -{pricing.discountPercentage}%
                          </span>
                        )}
                        {lowStock && !outOfStock && (
                          <span className="bg-amber-500 text-white text-[8px] sm:text-[9px] font-black px-1 py-0.5 sm:px-1.5 rounded-md shadow-2xs flex items-center gap-0.5">
                            <AlertTriangle className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> Bajo
                          </span>
                        )}
                      </div>
                      <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 p-1 rounded-lg bg-slate-900/50 text-vivero-mint backdrop-blur-sm flex items-center gap-1">
                        <CategoryIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </div>
                      {outOfStock && (
                        <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-slate-900/80 text-white text-[9px] sm:text-[10px] font-black rounded-lg uppercase tracking-wider">
                            Agotado
                          </span>
                        </div>
                      )}
                      {!outOfStock && inCart && (
                        <div className="absolute bottom-1 left-1 sm:bottom-1.5 sm:left-1.5">
                          <span className="px-1.5 py-0.5 rounded-md bg-vivero-mint text-vivero-dark text-[8px] sm:text-[9px] font-black shadow-md border border-white/40 flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            Agregado al carrito
                          </span>
                        </div>
                      )}
                      {!outOfStock && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/75 via-slate-900/30 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-center">
                          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 text-white">
                            {inCart ? (
                              <><CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Quitar del carrito</>
                            ) : (
                              <><Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Agregar al carrito</>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-2 sm:p-2.5 flex flex-col gap-1 sm:gap-1.5 flex-1">
                      <div>
                        <p className="text-[9px] sm:text-[10px] font-extrabold text-vivero-primary uppercase tracking-wide truncate">
                          {p.categoryName}
                        </p>
                        <h5 className="font-extrabold text-slate-800 text-[11px] sm:text-xs leading-snug line-clamp-2 min-h-[1.6rem] sm:min-h-[2rem]">
                          {p.name}
                        </h5>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-black text-[#1b4332]">
                          S/ {pricing.sellingPrice.toFixed(2)}
                        </span>
                        {pricing.discountPercentage > 0 && (
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 line-through">
                            S/ {pricing.basePrice.toFixed(2)}
                          </span>
                        )}
                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-500">
                          /{p.unitType === 'M2' ? 'm²' : 'und'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1 sm:gap-1.5 mt-auto pt-1">
                        <span className={`text-[8px] sm:text-[9px] font-extrabold px-1 sm:px-1.5 py-0.5 rounded-md border ${
                          outOfStock
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : lowStock
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {outOfStock ? 'Sin stock' : `${maxStock} ${p.unitType === 'M2' ? 'm²' : 'und'}`}
                        </span>

                        {inCart ? (
                          <div className="flex items-center gap-0.5 sm:gap-1 bg-vivero-soft/70 rounded-lg border border-vivero-mint/40 p-0.5">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleQtyStep(p, -1);
                              }}
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white hover:bg-vivero-soft text-vivero-dark flex items-center justify-center transition-colors shadow-2xs"
                              title="Disminuir"
                            >
                              <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                            <span className="text-[10px] sm:text-[11px] font-black text-vivero-dark w-6 sm:w-8 text-center">
                              {inCartQty}
                            </span>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleQtyStep(p, 1);
                              }}
                              disabled={outOfStock || inCartQty >= maxStock}
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint flex items-center justify-center transition-colors shadow-2xs disabled:opacity-40"
                              title="Aumentar"
                            >
                              <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleAdd(p, e);
                            }}
                            disabled={outOfStock}
                            className="px-2 sm:px-2.5 py-1 rounded-lg bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint text-[9px] sm:text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                            Agregar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Cart Panel */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden sticky top-20 flex flex-col max-h-[calc(100vh-7rem)]">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1b4332] text-vivero-mint flex items-center justify-center shadow-2xs">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-800 text-sm">Carrito de Venta</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-vivero-dark bg-vivero-soft px-2 py-0.5 rounded-md border border-vivero-mint/30">
                  {cartCount} unid.
                </span>
                <button
                  onClick={clearCart}
                  disabled={items.length === 0}
                  className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Vaciar carrito"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                  <ShoppingCart className="w-7 h-7" />
                </div>
                <p className="text-xs font-bold text-slate-500">El carrito está vacío</p>
                <p className="text-[10px] text-slate-400 text-center px-6">
                  Toca un producto para agregarlo al carrito; tócalo de nuevo para quitarlo.
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {items.map(item => {
                    const itemMaxStock = item.product.availableStock !== undefined && item.product.availableStock !== null
                      ? item.product.availableStock
                      : item.product.stock;
                    const step = item.product.unitType === 'M2' ? 5 : 1;
                    return (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-2.5 p-2 bg-slate-50/80 rounded-2xl border border-slate-200/80"
                      >
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-slate-200/60"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-extrabold text-slate-800 text-[11px] leading-tight truncate">
                            {item.product.name}
                          </h5>
                          <p className="text-[10px] font-bold text-vivero-primary">
                            S/ {item.unitPrice.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <button
                              onClick={() => {
                                const next = Math.max(1, item.quantity - step);
                                updateQuantity(item.product.id, next);
                              }}
                              className="w-5 h-5 rounded-md bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-[11px] font-black text-slate-800 w-7 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => {
                                const next = Math.min(item.quantity + step, Math.max(1, itemMaxStock));
                                updateQuantity(item.product.id, next);
                              }}
                              disabled={item.quantity >= itemMaxStock}
                              className="w-5 h-5 rounded-md bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors disabled:opacity-40"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-black text-[#1b4332] text-xs">
                            S/ {item.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/80 space-y-2">
                  <div className="space-y-1 text-[11px] font-bold text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>S/ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                      <span>Total a Cobrar</span>
                      <span className="text-[#1b4332]">S/ {total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Wallet className="w-4 h-4" />
                    Cobrar Venta • S/ {total.toFixed(2)}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Floating Checkout Bar */}
      {items.length > 0 && (
        <div className="lg:hidden fixed left-0 right-0 bottom-19 z-30 px-2.5">
          <div className="bg-[#1b4332] rounded-xl sm:rounded-2xl shadow-2xl border border-vivero-mint/40 py-2 pr-2 pl-2.5 flex items-center justify-between gap-2.5 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-vivero-soft/20 border border-vivero-mint/40 text-vivero-mint flex items-center justify-center">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 min-w-[16px] px-0.5 bg-vivero-mint text-vivero-dark text-[8px] font-black rounded-full flex items-center justify-center border border-white shadow-2xs">
                  {cartCount}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-extrabold text-emerald-200 uppercase tracking-wider truncate">
                  {cartItemsCount} {cartItemsCount === 1 ? 'producto' : 'productos'} en venta
                </p>
                <p className="text-xs sm:text-sm font-black text-vivero-mint truncate">
                  S/ {total.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={clearCart}
                className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 flex items-center justify-center active:scale-95 transition-all"
                title="Vaciar carrito"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className="py-2 px-3.5 bg-vivero-mint hover:bg-emerald-300 text-vivero-dark font-extrabold text-[11px] rounded-lg shadow-md active:scale-95 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Cobrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
