import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { CompanyProvider } from './context/CompanyContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { MobileMoreMenu } from './components/MobileMoreMenu';
import { LeavesLoader } from './components/LeavesLoader';
import { Product, Order } from './types';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const DeliveryPage = lazy(() => import('./pages/DeliveryPage').then(m => ({ default: m.DeliveryPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then(m => ({ default: m.OrdersPage })));
const CustomersPage = lazy(() => import('./pages/CustomersPage').then(m => ({ default: m.CustomersPage })));
const InventoryPage = lazy(() => import('./pages/InventoryPage').then(m => ({ default: m.InventoryPage })));
const SalesPage = lazy(() => import('./pages/SalesPage').then(m => ({ default: m.SalesPage })));
const SalesHistoryPage = lazy(() => import('./pages/SalesHistoryPage').then(m => ({ default: m.SalesHistoryPage })));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage').then(m => ({ default: m.SuppliersPage })));
const DriversPage = lazy(() => import('./pages/DriversPage').then(m => ({ default: m.DriversPage })));
const PurchasesPage = lazy(() => import('./pages/PurchasesPage').then(m => ({ default: m.PurchasesPage })));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage').then(m => ({ default: m.ExpensesPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ProductDetailModal = lazy(() => import('./components/ProductDetailModal').then(m => ({ default: m.ProductDetailModal })));
const CartDrawerModal = lazy(() => import('./components/CartDrawerModal').then(m => ({ default: m.CartDrawerModal })));
const ReceiptModal = lazy(() => import('./components/ReceiptModal').then(m => ({ default: m.ReceiptModal })));
const DeliveryMap = lazy(() => import('./components/DeliveryMap').then(m => ({ default: m.DeliveryMap })));

const MainContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState<boolean>(false);

  // Register PWA Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.log('SW registration failed: ', err);
        });
      });
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageFallback />}>
        <LoginPage />
      </Suspense>
    );
  }

  const handleSaleSuccess = (saleData: any) => {
    setCompletedSale(saleData);
    window.dispatchEvent(new CustomEvent('vivero_products_updated'));
    window.dispatchEvent(new CustomEvent('vivero_sale_created', { detail: { sale: saleData } }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <Navbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeTab={activeTab}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Suspense fallback={<PageFallback />}>
            {activeTab === 'dashboard' && (
              <DashboardPage
                setActiveTab={setActiveTab}
                onSelectProduct={setSelectedProduct}
                onSelectOrder={setSelectedOrder}
              />
            )}
            {activeTab === 'products' && (
              <ProductsPage
                onSelectProduct={setSelectedProduct}
                searchTerm={searchTerm}
                onGoToInventory={() => setActiveTab('inventory')}
              />
            )}
            {activeTab === 'orders' && (
              <OrdersPage onSelectOrder={setSelectedOrder} />
            )}
            {activeTab === 'customers' && <CustomersPage />}
            {activeTab === 'inventory' && <InventoryPage />}
            {activeTab === 'sales' && <SalesPage />}
            {activeTab === 'sales-history' && <SalesHistoryPage />}
            {activeTab === 'suppliers' && <SuppliersPage />}
            {activeTab === 'drivers' && <DriversPage />}
            {activeTab === 'purchases' && <PurchasesPage />}
            {activeTab === 'expenses' && <ExpensesPage />}
            {activeTab === 'reports' && <ReportsPage />}
            {activeTab === 'categories' && <CategoriesPage />}
            {activeTab === 'delivery' && <DeliveryPage />}
            {activeTab === 'users' && <UsersPage />}
            {activeTab === 'settings' && <SettingsPage />}
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickAction={() => setActiveTab('sales')}
        onOpenMore={() => setIsMobileMoreOpen(true)}
      />

      {/* Mobile More Menu Slide-Over */}
      <MobileMoreMenu
        isOpen={isMobileMoreOpen}
        onClose={() => setIsMobileMoreOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Modals & Slide-overs */}
      <Suspense fallback={null}>
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />

        <CartDrawerModal
          onSuccessSale={handleSaleSuccess}
        />

        <ReceiptModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />

        <DeliveryMap
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onMarkDelivered={(orderId: number) => {
            setSelectedOrder(prev => prev ? { ...prev, status: 'ENTREGADO' } : null);
          }}
        />
      </Suspense>
    </div>
  );
};

const PageFallback: React.FC = () => (
  <LeavesLoader compact message="Cargando módulo..." />
);

export function App() {
  return (
    <CompanyProvider>
      <AuthProvider>
        <CartProvider>
          <MainContent />
        </CartProvider>
      </AuthProvider>
    </CompanyProvider>
  );
}

export default App;
