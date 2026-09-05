import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Zap } from 'lucide-react';
import { productService, categoryService } from '@/services';
import ProductCard from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/States';
import { BRAND_TAGLINE } from '@/constants';

function Section({ title, subtitle, children, viewAllHref }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)]">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link to={viewAllHref} className="hidden sm:flex items-center gap-1 text-sm font-medium text-[var(--color-teal-dark)] hover:underline">
            View all <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function ProductGrid({ products, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((p) => <ProductCard key={p._id} product={p} />)}
    </div>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestDeals, setBestDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [featuredRes, newRes, dealsRes, catRes] = await Promise.all([
          productService.getProducts({ featured: 'true', limit: 8 }),
          productService.getProducts({ sort: 'newest', limit: 8 }),
          productService.getProducts({ sort: 'discount-desc', limit: 8 }),
          categoryService.getCategories(),
        ]);
        if (!mounted) return;
        setFeatured(featuredRes.data.products);
        setNewArrivals(newRes.data.products);
        setBestDeals(dealsRes.data.products);
        setCategories(catRes.data.categories);
      } catch {
        // Sections degrade gracefully to empty state below if this fails
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-[var(--color-ink)] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'linear-gradient(var(--color-teal) 1px, transparent 1px), linear-gradient(90deg, var(--color-teal) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 font-mono-tag text-xs text-[var(--color-teal)] border border-[var(--color-teal)]/30 rounded-full px-3 py-1">
              <Zap size={12} /> NEW SEASON DROP
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] mt-5">
              {BRAND_TAGLINE}
            </h1>
            <p className="text-white/60 mt-5 max-w-md text-base">
              Curated smartphones, laptops, audio, and wearables — spec-checked, price-matched, and shipped fast.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/shop" className="bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] text-white font-medium px-6 py-3 rounded-lg inline-flex items-center gap-2">
                Shop Now <ArrowRight size={16} />
              </Link>
              <Link to="/shop?sort=discount-desc" className="border border-white/20 hover:bg-white/10 font-medium px-6 py-3 rounded-lg">
                Best Deals
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {bestDeals.slice(0, 4).map((p) => (
              <Link to={`/product/${p.slug}`} key={p._id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                <img src={p.images?.[0]?.url} alt={p.name} className="w-full aspect-square object-cover rounded-lg mb-3" />
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="font-mono-tag text-[var(--color-teal)] text-sm mt-1">-{p.discountPercentage}% OFF</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-[var(--color-line)] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <Truck size={22} className="text-[var(--color-teal)]" />
            <div>
              <p className="text-sm font-semibold">Free shipping over ₹999</p>
              <p className="text-xs text-gray-500">Delivered in 3–5 business days</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck size={22} className="text-[var(--color-teal)]" />
            <div>
              <p className="text-sm font-semibold">Secure Razorpay checkout</p>
              <p className="text-xs text-gray-500">Your payment details stay private</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RotateCcw size={22} className="text-[var(--color-teal)]" />
            <div>
              <p className="text-sm font-semibold">7-day easy returns</p>
              <p className="text-xs text-gray-500">No questions asked</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((c) => (
            <Link
              key={c._id}
              to={`/shop?category=${c._id}`}
              className="rounded-xl border border-[var(--color-line)] bg-white p-5 text-center hover:border-[var(--color-teal)] hover:shadow-md transition-all"
            >
              <p className="font-display font-semibold text-sm text-[var(--color-ink)]">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <Section title="Featured Products" subtitle="Hand-picked by our team" viewAllHref="/shop?featured=true">
        <ProductGrid products={featured} loading={loading} />
      </Section>

      <Section title="Best Deals" subtitle="Steepest discounts, right now" viewAllHref="/shop?sort=discount-desc">
        <ProductGrid products={bestDeals} loading={loading} />
      </Section>

      <Section title="New Arrivals" subtitle="Just landed in the warehouse" viewAllHref="/shop?sort=newest">
        <ProductGrid products={newArrivals} loading={loading} />
      </Section>
    </div>
  );
}
