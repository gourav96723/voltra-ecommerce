import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, X, ShoppingCart } from 'lucide-react';
import { wishlistService } from '@/services';
import { useToast } from '@/context/ToastContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { PriceTag } from '@/components/ui/Badge';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';
import { EmptyState, PageSpinner } from '@/components/ui/States';

export default function Wishlist() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { refresh } = useWishlist();
  const { refreshCart } = useCart();

  const load = () => {
    setLoading(true);
    wishlistService
      .getWishlist()
      .then((res) => setProducts(res.data.products))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRemove = async (id, name) => {
    await wishlistService.removeItem(id);
    setProducts((prev) => prev.filter((p) => p._id !== id));
    refresh();
    toast.success(`${name} removed from wishlist.`);
  };

  const handleMoveToCart = async (id, name) => {
    try {
      await wishlistService.moveToCart(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      refresh();
      refreshCart();
      toast.success(`${name} moved to cart.`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <PageSpinner />;

  if (products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save items you're eyeing so you don't lose track of them."
          action={<Link to="/shop"><Button>Explore Products</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-2xl font-bold mb-6">Your Wishlist ({products.length})</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <div key={p._id} className="border border-[var(--color-line)] rounded-xl bg-white p-4 flex gap-4">
            <Link to={`/product/${p.slug}`} className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-[var(--color-paper-dim)]">
              <img src={p.images?.[0]?.url} alt={p.name} className="w-full h-full object-cover" />
            </Link>
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/product/${p.slug}`} className="font-medium text-sm hover:underline line-clamp-2">{p.name}</Link>
                <button onClick={() => handleRemove(p._id, p.name)} aria-label={`Remove ${p.name} from wishlist`} className="text-gray-400 hover:text-[var(--color-danger)] shrink-0">
                  <X size={16} />
                </button>
              </div>
              <StarRating rating={p.rating} count={p.reviewCount} />
              <div className="mt-auto pt-2 flex items-center justify-between">
                <PriceTag price={p.price} discountPercentage={p.discountPercentage} size="sm" />
                <button
                  onClick={() => handleMoveToCart(p._id, p.name)}
                  disabled={p.stock < 1}
                  aria-label={`Move ${p.name} to cart`}
                  className="w-8 h-8 rounded-lg bg-[var(--color-ink)] text-white flex items-center justify-center disabled:opacity-40"
                >
                  <ShoppingCart size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
