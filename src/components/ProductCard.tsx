import React from 'react';
import { Product, getProductPricing } from '../types';
import { Plus, Edit2, ShoppingCart, Boxes } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onSelectProduct?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  showAddToCart?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectProduct, onEditProduct, showAddToCart = true }) => {
  const { addToCart, items } = useCart();

  const maxStock = product.availableStock !== undefined && product.availableStock !== null
    ? product.availableStock
    : product.stock;

  const isOutOfStock = maxStock <= 0;
  const isLowStock = !isOutOfStock && maxStock <= (product.minStock || 0);
  const isM2 = product.unitType === 'M2';

  const pricing = getProductPricing(product);
  const inCartQty = items.find(i => i.product.id === product.id)?.quantity || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1, { x: e.clientX, y: e.clientY });
  };

  return (
    <div
      onClick={() => onSelectProduct && onSelectProduct(product)}
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-card hover:shadow-soft transition-all duration-200 overflow-hidden cursor-pointer group flex flex-col justify-between ${
        isOutOfStock ? 'opacity-80 bg-slate-50/50' : ''
      } ${showAddToCart && inCartQty > 0 ? 'ring-2 ring-vivero-mint/40 border-vivero-mint/60' : ''}`}
    >
      <div>
        {/* Full Image Container */}
        <div className="relative h-36 sm:h-44 w-full bg-slate-100/90 flex items-center justify-center overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isOutOfStock ? 'grayscale-[50%]' : 'group-hover:scale-105'
            }`}
          />
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-white/95 backdrop-blur-md text-[#1b4332] shadow-sm">
              {product.categoryName}
            </span>
          </div>
          {isOutOfStock ? (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-600 text-white shadow-md">
                Agotado
              </span>
            </div>
          ) : isLowStock ? (
            <div className="absolute top-2 right-2">
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-500 text-white shadow-sm">
                Crítico
              </span>
            </div>
          ) : null}

          {pricing.discountPercentage > 0 && (
            <div className="absolute bottom-2 left-2">
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-[#e11d48] text-white shadow-md">
                -{pricing.discountPercentage}%
              </span>
            </div>
          )}

          {showAddToCart && inCartQty > 0 && (
            <div className="absolute bottom-2 right-2">
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-vivero-soft text-vivero-dark border border-vivero-mint/50 shadow-md flex items-center gap-0.5">
                <ShoppingCart className="w-2.5 h-2.5" />
                {inCartQty} en carrito
              </span>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="p-2.5 sm:p-3.5 space-y-1">
          {/* Brand on top (if present) */}
          {product.brand && (
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              {product.brand}
            </span>
          )}

          {/* Title + Unit Badge Right Beside Name */}
          <div className="flex items-start justify-between gap-1.5">
            <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm group-hover:text-vivero-primary transition-colors leading-snug break-words flex-1">
              {product.name}
            </h4>
            <span className="px-1.5 py-0.5 rounded-md bg-vivero-soft text-[#1b4332] text-[9px] font-black uppercase tracking-tight shadow-2xs border border-vivero-mint/30 flex-shrink-0 mt-0.5">
              {isM2 ? 'm²' : 'und'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Price & Quick Add Button */}
      <div className="p-2.5 sm:p-3.5 pt-1.5 flex items-end justify-between gap-2 border-t border-slate-100 mt-1">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-sm sm:text-base font-black text-slate-900">
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
          <span className={`text-[10px] font-bold flex items-center gap-1 ${
            isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-500'
          }`}>
            <Boxes className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {isOutOfStock ? `0 ${isM2 ? 'm²' : 'und'} en stock` : isLowStock ? `Solo ${maxStock} ${isM2 ? 'm²' : 'und'} (mín. ${product.minStock || 0})` : `${maxStock} ${isM2 ? 'm²' : 'und'} en stock`}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {showAddToCart && onEditProduct && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditProduct(product);
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all active:scale-95 flex items-center justify-center"
              title="Editar producto"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {showAddToCart ? (
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAdd}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl shadow-sm transition-all flex items-center justify-center ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#1b4332] hover:bg-vivero-primary text-vivero-mint hover:text-white active:scale-95'
              }`}
              title={isOutOfStock ? 'Producto Agotado (Sin stock en vivero)' : 'Agregar al carrito'}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditProduct && onEditProduct(product);
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-vivero-soft hover:bg-vivero-primary text-vivero-dark hover:text-white transition-all active:scale-95 flex items-center justify-center shadow-sm"
              title="Editar producto"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
