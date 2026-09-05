import api from './api';

export { productService, categoryService, uploadService } from './productService';
export { authService } from './authService';

export const cartService = {
  getCart: () => api.get('/cart').then((r) => r.data),
  addItem: (productId, quantity = 1) => api.post('/cart/items', { productId, quantity }).then((r) => r.data),
  updateItem: (productId, quantity) => api.patch(`/cart/items/${productId}`, { quantity }).then((r) => r.data),
  removeItem: (productId) => api.delete(`/cart/items/${productId}`).then((r) => r.data),
  clearCart: () => api.delete('/cart').then((r) => r.data),
};

export const wishlistService = {
  getWishlist: () => api.get('/wishlist').then((r) => r.data),
  addItem: (productId) => api.post(`/wishlist/${productId}`).then((r) => r.data),
  removeItem: (productId) => api.delete(`/wishlist/${productId}`).then((r) => r.data),
  moveToCart: (productId) => api.post(`/wishlist/${productId}/move-to-cart`).then((r) => r.data),
};

export const orderService = {
  createOrder: (data) => api.post('/orders', data).then((r) => r.data),
  getMyOrders: (params) => api.get('/orders/my', { params }).then((r) => r.data),
  getMyOrderById: (id) => api.get(`/orders/my/${id}`).then((r) => r.data),
  cancelOrder: (id, reason) => api.post(`/orders/my/${id}/cancel`, { reason }).then((r) => r.data),
  retryPayment: (id) => api.post(`/orders/${id}/retry-payment`).then((r) => r.data),

  // Admin
  getAllOrdersAdmin: (params) => api.get('/orders/admin/all', { params }).then((r) => r.data),
  getOrderByIdAdmin: (id) => api.get(`/orders/admin/${id}`).then((r) => r.data),
  updateOrderStatusAdmin: (id, data) => api.patch(`/orders/admin/${id}/status`, data).then((r) => r.data),
};

export const paymentService = {
  getConfig: () => api.get('/payments/config').then((r) => r.data),
  verifyPayment: (data) => api.post('/payments/verify', data).then((r) => r.data),
  paymentFailed: (orderId) => api.post('/payments/failed', { orderId }).then((r) => r.data),
};

export const reviewService = {
  getProductReviews: (productId) => api.get(`/reviews/product/${productId}`).then((r) => r.data),
  canReview: (productId) => api.get(`/reviews/product/${productId}/can-review`).then((r) => r.data),
  createReview: (productId, data) => api.post(`/reviews/product/${productId}`, data).then((r) => r.data),
  deleteReview: (id) => api.delete(`/reviews/${id}`).then((r) => r.data),
};

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard').then((r) => r.data),
  getUsers: (params) => api.get('/admin/users', { params }).then((r) => r.data),
  getUserById: (id) => api.get(`/admin/users/${id}`).then((r) => r.data),
  setUserActiveStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }).then((r) => r.data),
};
