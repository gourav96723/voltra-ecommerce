import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Minus, Plus, ShoppingCart, Zap, Truck, RotateCcw, ShieldCheck, ChevronRight } from 'lucide-react';
import { productService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useToast } from '@/context/ToastContext';
import StarRating from '@/components/ui/StarRating';
import { PriceTag, Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { PageSpinner, ErrorState } from '@/components/ui/States';
import ProductCard from '@/components/product/ProductCard';
import ProductReviews from '@/components/product/ProductReviews';

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState('description');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setActiveImage(0);
    setQuantity(1);
    productService
      .getProductBySlug(slug)
      .then((res) => {
        setProduct(res.data.product);
        setRelated(res.data.related);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <PageSpinner />;
  if (error || !product) return <ErrorState message={error || 'Product not found.'} />;

  const inStock = product.stock > 0;
  const wishlisted = isWishlisted(product._id);

  const handleAddToCart = async () => {
    if (!isAuthenticated) return navigate('/login', { state: { from: `/product/${slug}` } });
    setBusy(true);
    try {
      await addItem(product._id, quantity);
      toast.success(`${quantity} × ${product.name} added to cart.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) return navigate('/login', { state: { from: `/product/${slug}` } });
    setBusy(true);
    try {
      await addItem(product._id, quantity);
      navigate('/checkout');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) return navigate('/login', { state: { from: `/product/${slug}` } });
    const added = await toggle(product._id);
    toast.success(added ? 'Added to wishlist.' : 'Removed from wishlist.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 flex-wrap">
        <Link to="/" className="hover:text-[var(--color-ink)]">Home</Link>
        <ChevronRight size={14} />
        <Link to="/shop" className="hover:text-[var(--color-ink)]">Shop</Link>
        <ChevronRight size={14} />
        <Link to={`/shop?category=${product.category?._id}`} className="hover:text-[var(--color-ink)]">{product.category?.name}</Link>
        <ChevronRight size={14} />
        <span className="text-[var(--color-ink)] font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div>
          <div className="aspect-square rounded-xl overflow-hidden bg-[var(--color-paper-dim)] border border-[var(--color-line)]">
            <img src={product.images[activeImage]?.url} alt={product.images[activeImage]?.alt || product.name} className="w-full h-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${activeImage === i ? 'border-[var(--color-teal)]' : 'border-transparent'}`}
                >
                  <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <span className="text-xs uppercase tracking-wide text-gray-400 font-mono-tag">{product.brand}</span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-ink)] mt-1">{product.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <StarRating rating={product.rating} count={product.reviewCount} size={16} />
            <span className="text-xs text-gray-400 font-mono-tag">SKU: {product.sku}</span>
          </div>

          <div className="mt-5">
            <PriceTag price={product.price} discountPercentage={product.discountPercentage} size="lg" />
          </div>

          <p className="text-sm text-gray-600 mt-4">{product.shortDescription}</p>

          <div className="mt-4">
            {inStock ? (
              <Badge tone="success">In Stock — {product.stock} available</Badge>
            ) : (
              <Badge tone="danger">Out of Stock</Badge>
            )}
          </div>

          {inStock && (
            <div className="flex items-center gap-3 mt-5">
              <div className="flex items-center border border-[var(--color-line)] rounded-lg">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="p-2.5"><Minus size={14} /></button>
                <span className="w-10 text-center text-sm font-mono-tag">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} aria-label="Increase quantity" className="p-2.5"><Plus size={14} /></button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-5">
            <Button onClick={handleAddToCart} disabled={!inStock} loading={busy} variant="outline" className="flex-1 min-w-[160px]">
              <ShoppingCart size={16} /> Add to Cart
            </Button>
            <Button onClick={handleBuyNow} disabled={!inStock} loading={busy} variant="accent" className="flex-1 min-w-[160px]">
              <Zap size={16} /> Buy Now
            </Button>
            <button onClick={handleWishlist} aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'} className="p-3 border border-[var(--color-line)] rounded-lg">
              <Heart size={18} className={wishlisted ? 'fill-[var(--color-danger)] text-[var(--color-danger)]' : ''} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-8 text-center">
            <div className="border border-[var(--color-line)] rounded-lg p-3">
              <Truck size={18} className="mx-auto text-[var(--color-teal)]" />
              <p className="text-xs mt-1.5 text-gray-500">3–5 day shipping</p>
            </div>
            <div className="border border-[var(--color-line)] rounded-lg p-3">
              <RotateCcw size={18} className="mx-auto text-[var(--color-teal)]" />
              <p className="text-xs mt-1.5 text-gray-500">7-day returns</p>
            </div>
            <div className="border border-[var(--color-line)] rounded-lg p-3">
              <ShieldCheck size={18} className="mx-auto text-[var(--color-teal)]" />
              <p className="text-xs mt-1.5 text-gray-500">1-year warranty</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-14 border-b border-[var(--color-line)]">
        <div className="flex gap-6">
          {['description', 'specifications', 'reviews'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium capitalize border-b-2 -mb-px ${tab === t ? 'border-[var(--color-teal)] text-[var(--color-ink)]' : 'border-transparent text-gray-400'}`}
            >
              {t} {t === 'reviews' && `(${product.reviewCount})`}
            </button>
          ))}
        </div>
      </div>
      <div className="py-8">
        {tab === 'description' && <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">{product.description}</p>}
        {tab === 'specifications' && (
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 max-w-3xl">
            {product.specifications.map((s) => (
              <div key={s.key} className="flex justify-between border-b border-[var(--color-line)] pb-2 text-sm">
                <dt className="text-gray-500">{s.key}</dt>
                <dd className="font-medium">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {tab === 'reviews' && <ProductReviews productId={product._id} />}
      </div>

      {related.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-xl font-bold mb-5">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
