import api from './api';

export const productService = {
  getProducts: (params) => api.get('/products', { params }).then((r) => r.data),
  getProductBySlug: (slug) => api.get(`/products/${slug}`).then((r) => r.data),
  getBrands: () => api.get('/products/meta/brands').then((r) => r.data),

  // Admin
  getProductsAdmin: (params) => api.get('/products/admin/all', { params }).then((r) => r.data),
  getProductByIdAdmin: (id) => api.get(`/products/admin/${id}`).then((r) => r.data),
  createProduct: (data) => api.post('/products', data).then((r) => r.data),
  updateProduct: (id, data) => api.patch(`/products/${id}`, data).then((r) => r.data),
  deleteProduct: (id) => api.delete(`/products/${id}`).then((r) => r.data),
};

export const categoryService = {
  getCategories: () => api.get('/categories').then((r) => r.data),
  getAllCategoriesAdmin: () => api.get('/categories/admin/all').then((r) => r.data),
  getCategoryBySlug: (slug) => api.get(`/categories/${slug}`).then((r) => r.data),
  createCategory: (data) => api.post('/categories', data).then((r) => r.data),
  updateCategory: (id, data) => api.patch(`/categories/${id}`, data).then((r) => r.data),
  deleteCategory: (id) => api.delete(`/categories/${id}`).then((r) => r.data),
};

export const uploadService = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api
      .post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
};
