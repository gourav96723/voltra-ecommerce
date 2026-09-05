import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { cartService } from '@/services';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const EMPTY_CART = { items: [], itemCount: 0, subtotal: 0, discount: 0, shippingFee: 0, tax: 0, total: 0 };

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(EMPTY_CART);
      return;
    }
    setLoading(true);
    try {
      const res = await cartService.getCart();
      setCart(res.data);
    } catch {
      setCart(EMPTY_CART);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = async (productId, quantity = 1) => {
    const res = await cartService.addItem(productId, quantity);
    setCart(res.data);
  };

  const updateItem = async (productId, quantity) => {
    const res = await cartService.updateItem(productId, quantity);
    setCart(res.data);
  };

  const removeItem = async (productId) => {
    const res = await cartService.removeItem(productId);
    setCart(res.data);
  };

  const clearCart = async () => {
    await cartService.clearCart();
    setCart(EMPTY_CART);
  };

  return (
    <CartContext.Provider value={{ cart, loading, refreshCart, addItem, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
