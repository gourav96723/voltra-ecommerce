import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { ToastProvider } from '@/context/ToastContext';
import { ProtectedRoute, AdminRoute } from '@/routes/guards';
import { PageSpinner } from '@/components/ui/States';

import MainLayout from '@/layouts/MainLayout';
import AccountLayout from '@/layouts/AccountLayout';
import AdminLayout from '@/layouts/AdminLayout';

import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import SearchResults from '@/pages/SearchResults';
import ProductDetails from '@/pages/ProductDetails';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import NotFound from '@/pages/NotFound';
import Cart from '@/pages/Cart';
import Wishlist from '@/pages/Wishlist';
import Checkout from '@/pages/Checkout';
import OrderSuccess from '@/pages/OrderSuccess';

import Profile from '@/pages/account/Profile';
import ChangePassword from '@/pages/account/ChangePassword';
import Addresses from '@/pages/account/Addresses';
import OrderHistory from '@/pages/account/OrderHistory';
import OrderDetails from '@/pages/account/OrderDetails';

// Admin pages are lazy-loaded (pulls in recharts) so the customer bundle stays lean.
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('@/pages/admin/AdminProducts'));
const AdminProductForm = lazy(() => import('@/pages/admin/AdminProductForm'));
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories'));
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders'));
const AdminOrderDetails = lazy(() => import('@/pages/admin/AdminOrderDetails'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminUserDetails = lazy(() => import('@/pages/admin/AdminUserDetails'));

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Routes>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/product/:slug" element={<ProductDetails />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/cart" element={<Cart />} />

                  <Route element={<ProtectedRoute />}>
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-success/:id" element={<OrderSuccess />} />

                    <Route path="/account" element={<AccountLayout />}>
                      <Route path="profile" element={<Profile />} />
                      <Route path="change-password" element={<ChangePassword />} />
                      <Route path="addresses" element={<Addresses />} />
                      <Route path="orders" element={<OrderHistory />} />
                      <Route path="orders/:id" element={<OrderDetails />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Route>

                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Suspense fallback={<PageSpinner />}><Dashboard /></Suspense>} />
                    <Route path="products" element={<Suspense fallback={<PageSpinner />}><AdminProducts /></Suspense>} />
                    <Route path="products/new" element={<Suspense fallback={<PageSpinner />}><AdminProductForm /></Suspense>} />
                    <Route path="products/:id/edit" element={<Suspense fallback={<PageSpinner />}><AdminProductForm /></Suspense>} />
                    <Route path="categories" element={<Suspense fallback={<PageSpinner />}><AdminCategories /></Suspense>} />
                    <Route path="orders" element={<Suspense fallback={<PageSpinner />}><AdminOrders /></Suspense>} />
                    <Route path="orders/:id" element={<Suspense fallback={<PageSpinner />}><AdminOrderDetails /></Suspense>} />
                    <Route path="users" element={<Suspense fallback={<PageSpinner />}><AdminUsers /></Suspense>} />
                    <Route path="users/:id" element={<Suspense fallback={<PageSpinner />}><AdminUserDetails /></Suspense>} />
                  </Route>
                </Route>
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
