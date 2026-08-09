export type RoleName = 'ROLE_ADMIN' | 'ROLE_VENDEDOR' | 'ROLE_REPARTIDOR';

export interface User {
  id?: number;
  username: string;
  fullName: string;
  role: RoleName;
  email?: string;
  phone?: string;
  active?: boolean;
  token?: string;
}

export type UnitType = 'M2' | 'UNIDAD';
export type MovementType = 'ENTRADA' | 'SALIDA' | 'MERMA' | 'RESERVA' | 'LIBERAR_RESERVA' | 'AJUSTE';

export interface Category {
  id: number;
  name: string;
  description?: string;
  iconName?: string;
  active: boolean;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  variety?: string;
  brand?: string;
  description?: string;
  categoryId: number;
  categoryName: string;
  unitType: UnitType;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  costPrice: number;
  stock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  imageUrl: string;
  active: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type PaymentMethod = 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA' | 'TARJETA' | 'MIXTO';

export interface Sale {
  id: number;
  receiptNumber: string;
  customerId?: number;
  customerName: string;
  customerPhone: string;
  saleDate: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  sellerUsername: string;
  items: {
    id: number;
    productId: number;
    productName: string;
    unitType: UnitType;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export type OrderStatus = 'PENDIENTE' | 'PREPARANDO' | 'EN_DELIVERY' | 'ENTREGADO' | 'CANCELADO';

export interface Order {
  id: number;
  orderNumber: string;
  saleId?: number;
  customerId?: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTimeSlot: string;
  status: OrderStatus;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  deliveryNotes?: string;
  productsSummary?: string;
  createdAt: string;
  delivery?: {
    id: number;
    driverName: string;
    driverPhone: string;
    routeStatus: string;
    currentLatitude?: number;
    currentLongitude?: number;
    destinationLatitude?: number;
    destinationLongitude?: number;
    gpsAccuracy?: number;
    gpsSpeed?: number;
    estimatedArrival?: string;
    deliveredAt?: string;
    recipientNotes?: string;
  };
}

export interface DeliveryRecord {
  id: number;
  orderId: number;
  orderNumber?: string;
  customerName?: string;
  deliveryAddress?: string;
  driverName: string;
  driverPhone?: string;
  routeStatus: string;
  currentLatitude?: number;
  currentLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  gpsAccuracy?: number;
  gpsSpeed?: number;
  estimatedArrival?: string;
  deliveredAt?: string;
  recipientNotes?: string;
}

export interface Driver {
  id: number;
  fullName: string;
  documentNumber?: string;
  phone?: string;
  vehicleInfo?: string;
  licenseNumber?: string;
  active: boolean;
}

export interface DeliveryMethod {
  id: number;
  name: string;
  type: 'DELIVERY' | 'STORE';
  price: number;
  estimatedTime?: string;
  description?: string;
  active: boolean;
}

export interface Customer {
  id: number;
  fullName: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  whatsapp: string;
  email?: string;
  address?: string;
  isFrequent: boolean;
  totalPurchases: number;
  lastPurchaseDate?: string;
  notes?: string;
}

export interface Supplier {
  id: number;
  companyName: string;
  contactName?: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  active: boolean;
}

export interface Purchase {
  id: number;
  purchaseNumber: string;
  supplierId: number;
  supplierName: string;
  purchaseDate: string;
  totalAmount: number;
  status: string;
  notes?: string;
  items: {
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[];
}

export interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  paymentMethod: string;
  registeredBy: string;
}

export interface DashboardMetrics {
  dailySales: number;
  dailySalesGrowth: number;
  monthlySales: number;
  monthlySalesGrowth: number;
  netProfit: number;
  netProfitGrowth: number;
  totalExpenses: number;
  pendingOrdersCount: number;
  criticalStockCount: number;
  salesChart: { date: string; amount: number }[];
  topProducts: {
    id: number;
    name: string;
    variety: string;
    quantitySold: number;
    imageUrl: string;
  }[];
  criticalStockProducts: Product[];
  pendingOrders: Order[];
  upcomingDeliveries: Order[];
}

export interface SalesSummary {
  totalSales: number;
  totalTransactions: number;
  averageTicket: number;
  yesterdaySales: number;
  growthPercentage?: number;
  dailyTrend: { date: string; amount: number }[];
  paymentBreakdown: { method: string; amount: number; count: number }[];
  salesByCategory: CategorySales[];
}

export interface CategorySales {
  categoryId: number;
  categoryName: string;
  totalAmount: number;
  totalQuantity: number;
  averagePrice?: number;
}

export interface ProductSales {
  productId: number;
  productName: string;
  variety: string;
  categoryName: string;
  quantitySold: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
}

export interface ExpenseSummary {
  totalExpenses: number;
  totalTransactions: number;
  averageExpense: number;
  byCategory: { category: string; amount: number; count: number }[];
  dailyTrend: { date: string; amount: number }[];
}

export interface PurchaseSummary {
  totalPurchases: number;
  totalTransactions: number;
  averagePurchase: number;
  topSuppliers: { supplierId: number; supplierName: string; amount: number; purchaseCount: number }[];
  dailyTrend: { date: string; amount: number }[];
}

export interface ProfitMargin {
  totalRevenue: number;
  totalCostOfGoods: number;
  grossProfit: number;
  grossProfitMargin: number;
  totalExpenses: number;
  netProfit: number;
  netProfitMargin: number;
  topProductsByProfit: ProductSales[];
  categoryMargins: CategorySales[];
}

export interface StockProduct {
  productId: number;
  productName: string;
  categoryName: string;
  unitType: string;
  stock: number;
  costPrice: number;
  stockValue: number;
  minStock: number;
}

export interface InventoryValuation {
  totalStockValue: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  valuationByCategory: { categoryId: number; categoryName: string; totalValue: number; totalQuantity: number }[];
  lowStockProducts: StockProduct[];
}

export interface StockCategoryValuation {
  categoryId: number;
  categoryName: string;
  totalCostValue: number;
  totalPotentialRevenue: number;
  totalPotentialProfit: number;
  totalProducts: number;
  totalQuantity: number;
}

export interface LowStockAlert {
  productId: number;
  productName: string;
  categoryName: string;
  unitType: string;
  stock: number;
  availableStock: number;
  costPrice: number;
  minPrice: number;
  minStock: number;
  stockValue: number;
  daysUntilOutOfStock?: number;
}

export interface InventoryValuationDetail {
  totalCostStockValue: number;
  totalPotentialRevenue: number;
  totalPotentialProfit: number;
  totalProducts: number;
  totalSpecies: number;
  totalAvailableStock: number;
  valuationByCategory: StockCategoryValuation[];
  lowStockAlerts: LowStockAlert[];
}

export interface TopCustomer {
  customerId: number;
  fullName: string;
  phone: string;
  purchaseCount: number;
  totalPurchases: number;
  customerLifetimeValue: number;
}

export function getProductPricing(product: { price: number; originalPrice?: number; discountPercentage?: number }) {
  const priceNum = Number(product.price) || 0;
  const origNum = Number(product.originalPrice) || 0;
  const discPctNum = Number(product.discountPercentage) || 0;

  if (origNum > priceNum) {
    const calcPct = discPctNum > 0 ? discPctNum : Math.round(((origNum - priceNum) / origNum) * 100);
    return {
      hasDiscount: true,
      basePrice: origNum,
      sellingPrice: priceNum,
      discountPercentage: calcPct
    };
  }

  if (discPctNum > 0) {
    const discounted = Math.max(0, priceNum * (1 - discPctNum / 100));
    return {
      hasDiscount: true,
      basePrice: priceNum,
      sellingPrice: Number(discounted.toFixed(2)),
      discountPercentage: discPctNum
    };
  }

  return {
    hasDiscount: false,
    basePrice: priceNum,
    sellingPrice: priceNum,
    discountPercentage: 0
  };
}
