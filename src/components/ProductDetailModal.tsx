import React, { useState, useEffect, useRef } from 'react';
import { Product, getProductPricing } from '../types';
import { X, Minus, Plus, ShoppingCart, ArrowLeft, CheckCircle2, ZoomIn } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState<number>(product.unitType === 'M2' ? 10 : 1);
  const [added, setAdded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isHovering, setIsHovering] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const imageRef = useRef<HTMLDivElement>(null);
  const supportsHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  useEffect(() => {
    const el = imageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      setZoom(z => Math.min(4, Math.max(1, +(z + (e.deltaY < 0 ? 0.25 : -0.25)).toFixed(2))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
  };

  const handleZoomIn = () => setZoom(z => Math.min(4, +(z + 0.5).toFixed(2)));
  const handleZoomOut = () => setZoom(z => Math.max(1, +(z - 0.5).toFixed(2)));

  const handleMouseEnter = () => {
    setIsHovering(true);
    setZoom(2);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setZoom(1);
  };

  const maxStock = product.availableStock !== undefined && product.availableStock !== null
    ? product.availableStock
    : product.stock;

  const isOutOfStock = maxStock <= 0;
  const isM2 = product.unitType === 'M2';

  const pricing = getProductPricing(product);

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (isOutOfStock) return;
    addToCart(product, quantity, e ? { x: e.clientX, y: e.clientY } : undefined);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[92vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-700 hover:text-vivero-dark font-extrabold text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Detalle del producto</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 space-y-3.5">
          {/* Image */}
          <div
            ref={imageRef}
            className="relative h-44 sm:h-56 rounded-2xl overflow-hidden bg-slate-100 shadow-inner cursor-zoom-in"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={product.imageUrl}
              alt={product.name}
              draggable={false}
              className="w-full h-full object-contain transition-transform duration-300 ease-out will-change-transform select-none"
              style={{
                transform: isHovering && zoom > 1 ? `scale(${zoom})` : 'scale(1)',
                transformOrigin: `${origin.x}% ${origin.y}%`
              }}
            />

            {/* Zoom Hint */}
            <div
              className={`absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-white/90 backdrop-blur-md rounded-xl px-2 py-1.5 shadow-md transition-all duration-200 ${
                isHovering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
              }`}
            >
              <ZoomIn className="w-3.5 h-3.5 text-vivero-primary" />
              <span className="text-[9px] font-black text-slate-600">
                {supportsHover ? 'Zoom automático • rueda para ajustar' : 'Zoom automático • toca +/− para ajustar'}
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-white/90 backdrop-blur-md rounded-xl p-1 shadow-md">
              <button
                onClick={handleZoomOut}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-90 transition-all"
                title="Alejar"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-black text-slate-700 min-w-10 text-center">
                {zoom.toFixed(2)}×
              </span>
              <button
                onClick={handleZoomIn}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-90 transition-all"
                title="Acercar"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="absolute top-2.5 right-2.5">
              {isOutOfStock ? (
                <span className="px-2.5 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full shadow-md">
                  Agotado
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-emerald-100/90 backdrop-blur-md text-emerald-800 text-[10px] font-black rounded-full shadow-sm flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  En stock
                </span>
              )}
            </div>
          </div>

          {/* Title & Price */}
          <div className="flex items-start justify-between gap-2">
            <div>
              {product.brand && (
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block mb-0.5">
                  {product.brand}
                </span>
              )}
              <h2 className="text-base sm:text-lg font-black text-slate-800 leading-tight break-words">
                {product.name}
              </h2>
              <p className="text-[10px] font-extrabold text-vivero-primary mt-0.5">
                {product.categoryName} {product.variety ? `• ${product.variety}` : ''}
              </p>
            </div>
            <div className="text-right flex-shrink-0 space-y-0.5">
              {pricing.hasDiscount && (
                <span className="bg-[#e11d48] text-white font-black text-[10px] px-2 py-0.5 rounded-lg inline-block shadow-2xs">
                  -{pricing.discountPercentage}%
                </span>
              )}
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900">
                  S/ {pricing.sellingPrice.toFixed(2)}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  /{isM2 ? 'm²' : 'und'}
                </span>
              </div>
              {pricing.hasDiscount && (
                <span className="text-xs font-bold text-slate-400 line-through block leading-none">
                  S/ {pricing.basePrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Descripción
            </h4>
            <p className="text-xs text-slate-600 leading-snug bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              {product.description || 'Grass natural y plantas ornamentales seleccionadas directamente del vivero para la máxima frescura y durabilidad en tus áreas verdes.'}
            </p>
          </div>

          {/* Stock Available Box */}
          <div className="flex items-center justify-between p-2.5 bg-vivero-soft/60 rounded-xl border border-vivero-soft">
            <span className="text-[10px] font-extrabold text-vivero-dark uppercase">
              Stock disponible
            </span>
            <span className="text-xs sm:text-sm font-black text-vivero-primary">
              {product.availableStock} {isM2 ? 'm²' : 'unidades'}
            </span>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-1.5 pt-0.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Cantidad ({isM2 ? 'm²' : 'unidades'})
            </label>
            <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - (isM2 ? 5 : 1)))}
                className="w-9 h-9 bg-white rounded-lg shadow-sm flex items-center justify-center font-black text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-black text-slate-800">
                {quantity} {isM2 ? 'm²' : 'und'}
              </span>
              <button
                onClick={() => setQuantity(q => q + (isM2 ? 5 : 1))}
                className="w-9 h-9 bg-white rounded-lg shadow-sm flex items-center justify-center font-black text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-white sticky bottom-0">
          <button
            onClick={(e) => handleAddToCart(e)}
            disabled={added || isOutOfStock}
            className={`w-full py-3 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-[0.98] ${
              isOutOfStock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : added
                ? 'bg-emerald-600 text-white'
                : 'bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint'
            }`}
          >
            {isOutOfStock ? (
              <span>Producto Agotado (Sin stock disponible)</span>
            ) : added ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>¡Agregado con éxito!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Agregar al carrito • S/ {(pricing.sellingPrice * quantity).toFixed(2)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
