import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import clsx from 'clsx';
import StarRating from '@/components/ui/StarRating';
import { PriceTag, Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useToast } from '@/context/ToastContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);

  const inStock = product.stock > 0;
  const wishlisted = isWishlisted(product._id);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return navigate('/login', { state: { from: location.pathname } });
    setBusy(true);
    try {
      await addItem(product._id, 1);
      toast.success(`${product.name} added to cart.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return navigate('/login', { state: { from: location.pathname } });
    try {
      const added = await toggle(product._id);
      toast.success(added ? 'Added to wishlist.' : 'Removed from wishlist.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group rounded-xl border border-[var(--color-line)] bg-white overflow-hidden flex flex-col transition-shadow hover:shadow-lg focus-visible:shadow-lg"
    >
      <div className="relative aspect-square bg-[var(--color-paper-dim)] overflow-hidden">
        <img
          src={product.images?.[0]?.url}
          alt={product.images?.[0]?.alt || product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow hover:scale-105 transition-transform"
        >
          <Heart size={16} className={clsx(wishlisted ? 'fill-[var(--color-danger)] text-[var(--color-danger)]' : 'text-[var(--color-ink)]')} />
        </button>
        {product.discountPercentage > 0 && (
          <div className="absolute top-2.5 left-2.5">
            <Badge tone="amber">-{product.discountPercentage}%</Badge>
          </div>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <Badge tone="danger">Out of Stock</Badge>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <span className="text-xs uppercase tracking-wide text-gray-400 font-mono-tag">{product.brand}</span>
        <h3 className="text-sm font-medium text-[var(--color-ink)] leading-snug line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
        <StarRating rating={product.rating} count={product.reviewCount} />
        <div className="mt-auto pt-1 flex items-end justify-between gap-2">
          <PriceTag price={product.price} discountPercentage={product.discountPercentage} />
          <button
            onClick={handleAddToCart}
            disabled={!inStock || busy}
            aria-label={`Add ${product.name} to cart`}
            className="shrink-0 w-9 h-9 rounded-lg bg-[var(--color-ink)] text-white flex items-center justify-center hover:bg-[var(--color-teal)] transition-colors disabled:opacity-40 disabled:hover:bg-[var(--color-ink)]"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </Link>
  );
}
