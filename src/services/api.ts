import axios from 'axios';
import { DashboardMetrics, Product, Order, Customer, UnitType, OrderStatus, Supplier, Purchase, Driver, DeliveryMethod, Category, DeliveryRecord, Expense, SalesSummary, ProductSales, ExpenseSummary, PurchaseSummary, ProfitMargin, InventoryValuation, InventoryValuationDetail, TopCustomer } from '../types';

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 1,
    fullName: 'Juan Pérez',
    documentType: 'DNI',
    documentNumber: '45892134',
    phone: '+51 981234567',
    whatsapp: '51981234567',
    email: 'juan.perez@email.com',
    address: 'Av. Los Jardines 123, San Isidro',
    isFrequent: true,
    totalPurchases: 2450.00,
    lastPurchaseDate: '24 Jul 2026',
    notes: 'Cliente Frecuente.'
  },
  {
    id: 2,
    fullName: 'María López',
    documentType: 'DNI',
    documentNumber: '71239845',
    phone: '+51 987654321',
    whatsapp: '51987654321',
    email: 'maria.lopez@email.com',
    address: 'Calle Las Flores 456, Miraflores',
    isFrequent: true,
    totalPurchases: 1800.00,
    lastPurchaseDate: '24 Jul 2026',
    notes: 'Compra plantas ornamentales.'
  },
  {
    id: 3,
    fullName: 'Carlos Ruiz',
    documentType: 'DNI',
    documentNumber: '10458923',
    phone: '+51 974125896',
    whatsapp: '51974125896',
    email: 'carlos.ruiz@email.com',
    address: 'Jr. El Bosque 789, Surco',
    isFrequent: false,
    totalPurchases: 850.00,
    lastPurchaseDate: '22 Jul 2026'
  },
  {
    id: 4,
    fullName: 'Ana Torres',
    documentType: 'DNI',
    documentNumber: '42981567',
    phone: '+51 963258741',
    whatsapp: '51963258741',
    email: 'ana.torres@email.com',
    address: 'Av. Primavera 1020, San Borja',
    isFrequent: false,
    totalPurchases: 320.00,
    lastPurchaseDate: '20 Jul 2026'
  },
  {
    id: 5,
    fullName: 'Pedro Gómez',
    documentType: 'DNI',
    documentNumber: '87654321',
    phone: '+51 912345678',
    whatsapp: '51912345678',
    email: 'pedro.gomez@email.com',
    address: 'Av. Brasil 456, Lima',
    isFrequent: false,
    totalPurchases: 0.00,
    notes: 'Nuevo cliente registrado sin compras aún.'
  }
];

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vivero_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================
// BACKEND AVAILABILITY MONITOR
// ============================================================
// When a request fails at network level (backend down), start a
// heartbeat that pings the server with exponential backoff. As soon
// as the backend responds again, dispatch `vivero_backend_online`
// so every page can re-fetch its data automatically (no manual refresh).
let backendDown = false;
let heartbeatTimer: number | null = null;
let heartbeatAttempt = 0;

const stopHeartbeat = () => {
  if (heartbeatTimer) {
    clearTimeout(heartbeatTimer);
    heartbeatTimer = null;
  }
};

const notifyBackendOnline = () => {
  stopHeartbeat();
  if (backendDown) {
    backendDown = false;
    heartbeatAttempt = 0;
    window.dispatchEvent(new CustomEvent('vivero_backend_online'));
  }
};

const heartbeat = () => {
  const delay = Math.min(4000 * 2 ** heartbeatAttempt, 30000);
  heartbeatTimer = window.setTimeout(async () => {
    try {
      await api.get('/categories/active');
      notifyBackendOnline();
    } catch (err: any) {
      if (err?.response) {
        // Server responded (401/404/...) → backend is UP
        notifyBackendOnline();
      } else {
        heartbeatAttempt += 1;
        heartbeat();
      }
    }
  }, delay);
};

const startBackendMonitoring = () => {
  if (!backendDown) {
    backendDown = true;
    heartbeatAttempt = 0;
    heartbeat();
  }
};

api.interceptors.response.use(
  (response) => {
    if (backendDown) notifyBackendOnline();
    return response;
  },
  (error) => {
    if (!error?.response) {
      // Network-level failure: backend unreachable → monitor until it returns
      startBackendMonitoring();
    }
    return Promise.reject(error);
  }
);

// Mock Initial Data matching exact mockups
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    code: 'PROD-001',
    name: 'Grass americano',
    variety: 'Americano Premium',
    description: 'Grass natural de alta calidad, ideal para jardines, parques y áreas recreativas.',
    categoryId: 1,
    categoryName: 'Grass Natural',
    unitType: 'M2',
    price: 12.00,
    costPrice: 6.50,
    stock: 850,
    reservedStock: 150,
    availableStock: 850,
    minStock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=600&q=80',
    active: true
  },
  {
    id: 2,
    code: 'PROD-002',
    name: 'Grass bermuda',
    variety: 'Bermuda Fina',
    description: 'Resistente al alto tráfico y a climas cálidos. Ideal para canchas deportivas.',
    categoryId: 1,
    categoryName: 'Grass Natural',
    unitType: 'M2',
    price: 15.00,
    costPrice: 8.00,
    stock: 620,
    reservedStock: 0,
    availableStock: 620,
    minStock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80',
    active: true
  },
  {
    id: 3,
    code: 'PROD-003',
    name: 'Grass japonés',
    variety: 'Japonés Zoysia',
    description: 'De hoja muy fina y suave. Excelente para jardines residenciales de alto acabado.',
    categoryId: 1,
    categoryName: 'Grass Natural',
    unitType: 'M2',
    price: 18.00,
    costPrice: 9.50,
    stock: 40,
    reservedStock: 0,
    availableStock: 40,
    minStock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a23?auto=format&fit=crop&w=600&q=80',
    active: true
  },
  {
    id: 4,
    code: 'PROD-004',
    name: 'Palmera Areca',
    variety: 'Areca Lutescens',
    description: 'Palmera de interior/exterior ideal para purificar el aire y dar un toque tropical.',
    categoryId: 2,
    categoryName: 'Plantas Ornamentales',
    unitType: 'UNIDAD',
    price: 80.00,
    costPrice: 40.00,
    stock: 35,
    reservedStock: 0,
    availableStock: 35,
    minStock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80',
    active: true
  },
  {
    id: 5,
    code: 'PROD-005',
    name: 'Ficus Lyrata',
    variety: 'Higuera Violín',
    description: 'Planta ornamental elegante con hojas grandes en forma de violín.',
    categoryId: 2,
    categoryName: 'Plantas Ornamentales',
    unitType: 'UNIDAD',
    price: 120.00,
    costPrice: 65.00,
    stock: 18,
    reservedStock: 0,
    availableStock: 18,
    minStock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=600&q=80',
    active: true
  },
  {
    id: 6,
    code: 'PROD-006',
    name: 'Cactus San Pedro',
    variety: 'Echinopsis',
    description: 'Cactus ornamental emblemático de bajo mantenimiento.',
    categoryId: 2,
    categoryName: 'Plantas Ornamentales',
    unitType: 'UNIDAD',
    price: 45.00,
    costPrice: 20.00,
    stock: 28,
    reservedStock: 0,
    availableStock: 28,
    minStock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80',
    active: true
  },
  {
    id: 7,
    code: 'PROD-007',
    name: 'Tierra Preparada Multiuso 50kg',
    variety: 'Sustrato Orgánico',
    brand: 'Fertiplant',
    description: 'Tierra enriquecida con humus y compost orgánico para plantas y grass.',
    categoryId: 4,
    categoryName: 'Accesorios e Insumos',
    unitType: 'UNIDAD',
    price: 19.90,
    originalPrice: 39.00,
    discountPercentage: 49,
    costPrice: 12.00,
    stock: 150,
    reservedStock: 0,
    availableStock: 150,
    minStock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80',
    active: true
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 1,
    orderNumber: '#P-00125',
    saleId: 1,
    customerId: 1,
    customerName: 'Juan Pérez',
    customerPhone: '+51 981234567',
    deliveryAddress: 'Av. Los Jardines 123, San Isidro',
    deliveryDate: '25 Jul, 10:00 AM',
    deliveryTimeSlot: '10:00 AM',
    status: 'PENDIENTE',
    assignedDriverName: 'Carlos Delivery',
    assignedDriverPhone: '+51 987654323',
    deliveryNotes: 'Entregar en puerta principal',
    createdAt: '2026-07-24T10:00:00',
    delivery: {
      id: 1,
      driverName: 'Carlos Delivery',
      driverPhone: '+51 987654323',
      routeStatus: 'EN_CAMINO'
    }
  },
  {
    id: 2,
    orderNumber: '#P-00124',
    saleId: 2,
    customerId: 2,
    customerName: 'María López',
    customerPhone: '+51 987654321',
    deliveryAddress: 'Calle Las Flores 456, Miraflores',
    deliveryDate: '25 Jul, 02:00 PM',
    deliveryTimeSlot: '02:00 PM',
    status: 'PENDIENTE',
    assignedDriverName: 'Carlos Delivery',
    assignedDriverPhone: '+51 987654323',
    createdAt: '2026-07-24T11:30:00'
  },
  {
    id: 3,
    orderNumber: '#P-00123',
    saleId: 3,
    customerId: 3,
    customerName: 'Carlos Ruiz',
    customerPhone: '+51 974125896',
    deliveryAddress: 'Jr. El Bosque 789, Surco',
    deliveryDate: '26 Jul, 09:00 AM',
    deliveryTimeSlot: '09:00 AM',
    status: 'EN_DELIVERY',
    assignedDriverName: 'Carlos Delivery',
    assignedDriverPhone: '+51 987654323',
    createdAt: '2026-07-24T12:00:00',
    delivery: {
      id: 2,
      driverName: 'Carlos Delivery',
      driverPhone: '+51 987654323',
      routeStatus: 'EN_CAMINO',
      currentLatitude: -12.0897,
      currentLongitude: -77.0365
    }
  }
];

export const MOCK_DASHBOARD: DashboardMetrics = {
  dailySales: 1250.00,
  dailySalesGrowth: 12.5,
  monthlySales: 18540.00,
  monthlySalesGrowth: 18.3,
  netProfit: 7540.00,
  netProfitGrowth: 15.7,
  totalExpenses: 530.00,
  pendingOrdersCount: 12,
  criticalStockCount: 2,
  salesChart: [
    { date: '18 Jul', amount: 500 },
    { date: '19 Jul', amount: 750 },
    { date: '20 Jul', amount: 1100 },
    { date: '21 Jul', amount: 800 },
    { date: '22 Jul', amount: 1200 },
    { date: '23 Jul', amount: 700 },
    { date: '24 Jul', amount: 1250 }
  ],
  topProducts: [
    { id: 1, name: 'Grass americano', variety: '820 m²', quantitySold: 820, imageUrl: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=300&q=80' },
    { id: 4, name: 'Palmera Areca', variety: '45 und', quantitySold: 45, imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=300&q=80' },
    { id: 2, name: 'Grass bermuda', variety: '620 m²', quantitySold: 620, imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=300&q=80' },
    { id: 5, name: 'Ficus Lyrata', variety: '32 und', quantitySold: 32, imageUrl: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=300&q=80' },
    { id: 6, name: 'Cactus San Pedro', variety: '28 und', quantitySold: 28, imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=300&q=80' }
  ],
  criticalStockProducts: [
    { ...MOCK_PRODUCTS[2], stock: 40 },
    { ...MOCK_PRODUCTS[3], stock: 5 }
  ],
  pendingOrders: MOCK_ORDERS,
  upcomingDeliveries: MOCK_ORDERS.filter(o => o.status === 'EN_DELIVERY' || o.status === 'PENDIENTE')
};

// API Services for Dashboard
export const dashboardApi = {
  getMetrics: () => api.get<DashboardMetrics>('/dashboard/metrics')
};

// API Services for Ubigeo & Territorio
export const ubigeoApi = {
  getDepartments: () => api.get<{ id: number; code: string; name: string; active: boolean }[]>('/ubigeo/departments'),
  createDepartment: (data: { code: string; name: string }) =>
    api.post<{ id: number; code: string; name: string; active: boolean }>('/ubigeo/departments', data),
  updateDepartment: (id: number, data: { code: string; name: string; active?: boolean }) =>
    api.put<{ id: number; code: string; name: string; active: boolean }>(`/ubigeo/departments/${id}`, data),
  toggleDepartmentStatus: (id: number) =>
    api.put<{ id: number; code: string; name: string; active: boolean }>(`/ubigeo/departments/${id}/toggle-status`),
  deleteDepartment: (id: number) => api.delete(`/ubigeo/departments/${id}`),

  getProvinces: () =>
    api.get<{ id: number; code: string; name: string; departmentId: number; departmentName: string; active: boolean }[]>('/ubigeo/provinces'),
  getProvincesByDepartment: (departmentId: number) =>
    api.get<{ id: number; code: string; name: string; departmentId: number; departmentName: string; active: boolean }[]>(`/ubigeo/departments/${departmentId}/provinces`),
  createProvince: (data: { code: string; name: string; departmentId: number }) =>
    api.post<{ id: number; code: string; name: string; departmentId: number; departmentName: string; active: boolean }>('/ubigeo/provinces', data),
  updateProvince: (id: number, data: { code: string; name: string; departmentId: number; active?: boolean }) =>
    api.put<{ id: number; code: string; name: string; departmentId: number; departmentName: string; active: boolean }>(`/ubigeo/provinces/${id}`, data),
  toggleProvinceStatus: (id: number) =>
    api.put<{ id: number; code: string; name: string; departmentId: number; departmentName: string; active: boolean }>(`/ubigeo/provinces/${id}/toggle-status`),
  deleteProvince: (id: number) => api.delete(`/ubigeo/provinces/${id}`),

  getDistricts: () =>
    api.get<{ id: number; code: string; name: string; provinceId: number; provinceName: string; departmentId: number; departmentName: string; active: boolean }[]>('/ubigeo/districts'),
  getDistrictsByProvince: (provinceId: number) =>
    api.get<{ id: number; code: string; name: string; provinceId: number; provinceName: string; departmentId: number; departmentName: string; active: boolean }[]>(`/ubigeo/provinces/${provinceId}/districts`),
  createDistrict: (data: { code: string; name: string; provinceId: number }) =>
    api.post<{ id: number; code: string; name: string; provinceId: number; provinceName: string; departmentId: number; departmentName: string; active: boolean }>('/ubigeo/districts', data),
  updateDistrict: (id: number, data: { code: string; name: string; provinceId: number; active?: boolean }) =>
    api.put<{ id: number; code: string; name: string; provinceId: number; provinceName: string; departmentId: number; departmentName: string; active: boolean }>(`/ubigeo/districts/${id}`, data),
  toggleDistrictStatus: (id: number) =>
    api.put<{ id: number; code: string; name: string; provinceId: number; provinceName: string; departmentId: number; departmentName: string; active: boolean }>(`/ubigeo/districts/${id}/toggle-status`),
  deleteDistrict: (id: number) => api.delete(`/ubigeo/districts/${id}`),

  bulkImport: (items: Array<{
    departmentCode: string;
    departmentName: string;
    provinceCode?: string;
    provinceName?: string;
    districtCode?: string;
    districtName?: string;
  }>) =>
    api.post<{
      importedDepartments: number;
      importedProvinces: number;
      importedDistricts: number;
      totalRecords: number;
      message: string;
    }>('/ubigeo/bulk-import', { items }),
};

// API Services for Products & Categories
export const productApi = {
  getAllProducts: () => api.get<Product[]>('/products'),
  getProductById: (id: number) => api.get<Product>(`/products/${id}`),
  createProduct: (data: {
    code?: string;
    name: string;
    variety?: string;
    brand?: string;
    description?: string;
    categoryId: number;
    unitType: UnitType;
    price: number;
    originalPrice?: number;
    discountPercentage?: number;
    costPrice?: number;
    stock?: number;
    minStock?: number;
    imageUrl?: string;
  }) => api.post<Product>('/products', data),
  updateProduct: (id: number, data: {
    code?: string;
    name: string;
    variety?: string;
    brand?: string;
    description?: string;
    categoryId: number;
    unitType: UnitType;
    price: number;
    originalPrice?: number;
    discountPercentage?: number;
    costPrice?: number;
    stock?: number;
    minStock?: number;
    imageUrl?: string;
  }) => api.put<Product>(`/products/${id}`, data),
  deleteProduct: (id: number) => api.delete(`/products/${id}`),
};

export const categoryApi = {
  getAllCategories: () => api.get<Category[]>('/categories'),
  getActiveCategories: () => api.get<Category[]>('/categories/active'),
  createCategory: (data: Partial<Category>) => api.post<Category>('/categories', data),
  updateCategory: (id: number, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data),
  toggleCategoryStatus: (id: number) => api.put<Category>(`/categories/${id}/toggle-status`),
};

export const customerApi = {
  getAllCustomers: () => api.get<Customer[]>('/customers'),
  searchCustomers: (query: string) => api.get<Customer[]>(`/customers/search?query=${encodeURIComponent(query)}`),
  getCustomerById: (id: number) => api.get<Customer>(`/customers/${id}`),
  createCustomer: (data: Partial<Customer>) => api.post<Customer>('/customers', data),
  updateCustomer: (id: number, data: Partial<Customer>) => api.put<Customer>(`/customers/${id}`, data),
};

export const orderApi = {
  getAllOrders: () => api.get<Order[]>('/orders'),
  getOrdersByStatus: (status: OrderStatus) => api.get<Order[]>(`/orders/status/${status}`),
  getOrderById: (id: number) => api.get<Order>(`/orders/${id}`),
  updateOrderStatus: (id: number, status: OrderStatus, driverName?: string, driverPhone?: string, notes?: string) =>
    api.patch<Order>(`/orders/${id}/status`, { status, driverName, driverPhone, notes }),
};

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 1,
    companyName: 'Agro Grass del Perú S.A.C.',
    contactName: 'Ing. Roberto Gómez',
    documentNumber: '20512345678',
    phone: '+51 955112233',
    email: 'ventas@agrograssperu.com',
    address: 'Panamericana Sur Km 35, Lurín',
    active: true
  },
  {
    id: 2,
    companyName: 'Vivero Central Cieneguilla',
    contactName: 'Sra. Carmen Morales',
    documentNumber: '20601234567',
    phone: '+51 944332211',
    email: 'contacto@viverocieneguilla.com',
    address: 'Av. Toledo 520, Cieneguilla',
    active: true
  },
  {
    id: 3,
    companyName: 'Insumos y Tierra Preparada del Sur',
    contactName: 'Don Luis Mendoza',
    documentNumber: '10458912345',
    phone: '+51 977889900',
    email: 'tierrapreparada@email.com',
    address: 'Av. Pachacútec 1420, Villa El Salvador',
    active: true
  }
];

export const supplierApi = {
  getAllSuppliers: () => api.get<Supplier[]>('/suppliers'),
  createSupplier: (data: Partial<Supplier>) => api.post<Supplier>('/suppliers', data),
  updateSupplier: (id: number, data: Partial<Supplier>) => api.put<Supplier>(`/suppliers/${id}`, data),
  deleteSupplier: (id: number) => api.delete(`/suppliers/${id}`),
};

export const driverApi = {
  getAllDrivers: () => api.get<Driver[]>('/drivers'),
  createDriver: (data: Partial<Driver>) => api.post<Driver>('/drivers', data),
  updateDriver: (id: number, data: Partial<Driver>) => api.put<Driver>(`/drivers/${id}`, data),
  toggleDriverStatus: (id: number) => api.put<Driver>(`/drivers/${id}/toggle-status`),
};

export const purchaseApi = {
  getRecentPurchases: () => api.get<Purchase[]>('/purchases'),
  createPurchase: (data: {
    supplierId: number;
    supplierName?: string;
    items: Array<{ productId: number; quantity: number; unitCost: number }>;
    notes?: string;
    isDelivery?: boolean;
    deliveryAddress?: string;
    deliveryTimeSlot?: string;
    deliveryDate?: string;
    deliveryNotes?: string;
  }) => api.post<Purchase>('/purchases', data),
};

export const saleApi = {
  getRecentSales: () => api.get<any[]>('/sales'),
  getSaleById: (id: number) => api.get<any>(`/sales/${id}`),
  createSale: (data: {
    customerId?: number;
    customerName?: string;
    customerPhone?: string;
    items: Array<{ productId: number; quantity: number; unitPrice: number }>;
    deliveryFee?: number;
    discount?: number;
    paymentMethod: string;
    createOrderForDelivery?: boolean;
    deliveryAddress?: string;
    deliveryTimeSlot?: string;
    deliveryDate?: string;
  }) => api.post<any>('/sales', data),
};

export const expenseApi = {
  getRecentExpenses: () => api.get<Expense[]>('/expenses'),
  createExpense: (data: {
    category: string;
    description: string;
    amount: number;
    paymentMethod: string;
  }) => api.post<Expense>('/expenses', data),
};

export const inventoryApi = {
  getRecentMovements: () => api.get<any[]>('/inventory/movements'),
  getMovementsByProduct: (productId: number) => api.get<any[]>(`/inventory/movements/product/${productId}`),
  adjustStock: (payload: { productId: number; movementType: string; quantity: number; reason?: string }) =>
    api.post<any>('/inventory/adjust', payload),
};

export const deliveryMethodApi = {
  getAll: () => api.get<DeliveryMethod[]>('/delivery-methods'),
  getActive: () => api.get<DeliveryMethod[]>('/delivery-methods/active'),
  create: (data: Partial<DeliveryMethod>) => api.post<DeliveryMethod>('/delivery-methods', data),
  update: (id: number, data: Partial<DeliveryMethod>) => api.put<DeliveryMethod>(`/delivery-methods/${id}`, data),
  toggleStatus: (id: number) => api.put<DeliveryMethod>(`/delivery-methods/${id}/toggle-status`),
};

export const deliveryApi = {
  getAllDeliveries: () => api.get<DeliveryRecord[]>('/deliveries'),
  getDeliveryByOrder: (orderId: number) => api.get<DeliveryRecord>(`/deliveries/order/${orderId}`),
  updateGpsPosition: (orderId: number, data: { latitude: number; longitude: number; accuracy?: number; speed?: number }) =>
    api.put<DeliveryRecord>(`/deliveries/order/${orderId}/gps`, data),
  updateDestination: (orderId: number, data: { latitude: number; longitude: number }) =>
    api.put<DeliveryRecord>(`/deliveries/order/${orderId}/destination`, data),
  updateEta: (orderId: number, data: { estimatedArrival: string }) =>
    api.put<DeliveryRecord>(`/deliveries/order/${orderId}/eta`, data),
};

export interface CompanySettingsData {
  companyName?: string;
  companyRuc?: string;
  companyPhone?: string;
  companyAddress?: string;
  warehouseLatitude?: number;
  warehouseLongitude?: number;
  geminiApiKey?: string;
}

export interface ProductAnalysis {
  name: string;
  categoryName: string;
  description: string;
  imageUrl: string;
  message?: string;
}

export const companySettingsApi = {
  getSettings: () => api.get<CompanySettingsData>('/settings/company'),
  updateSettings: (data: CompanySettingsData) => api.put<CompanySettingsData>('/settings/company', data),
};

export const aiApi = {
  analyzeProductImage: (data: { image: string; mimeType: string }) =>
    api.post<ProductAnalysis>('/ai/analyze-product', data),
};

export const reportsApi = {
  getSalesSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get<SalesSummary>('/reports/sales-summary', { params }),

  getProductSalesRanking: (params?: { startDate?: string; endDate?: string; limit?: number }) =>
    api.get<ProductSales[]>('/reports/sales-by-product', { params }),

  getExpenseSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ExpenseSummary>('/reports/expenses-summary', { params }),

  getPurchaseSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get<PurchaseSummary>('/reports/purchases-summary', { params }),

  getProfitMargin: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ProfitMargin>('/reports/profit-margins', { params }),

  getInventoryValuation: () =>
    api.get<InventoryValuation>('/reports/inventory-valuation'),

  getInventoryValuationDetail: () =>
    api.get<InventoryValuationDetail>('/reports/inventory-valuation-detail'),

  getTopCustomers: (params?: { startDate?: string; endDate?: string; limit?: number }) =>
    api.get<TopCustomer[]>('/reports/top-customers', { params }),
};
