import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { wishlistService } from '@/services';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [productIds, setProductIds] = useState([]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setProductIds([]);
      return;
    }
    try {
      const res = await wishlistService.getWishlist();
      setProductIds(res.data.products.map((p) => p._id));
    } catch {
      setProductIds([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = async (productId) => {
    if (productIds.includes(productId)) {
      await wishlistService.removeItem(productId);
      setProductIds((prev) => prev.filter((id) => id !== productId));
      return false;
    }
    await wishlistService.addItem(productId);
    setProductIds((prev) => [...prev, productId]);
    return true;
  };

  return (
    <WishlistContext.Provider value={{ productIds, refresh, toggle, isWishlisted: (id) => productIds.includes(id) }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
