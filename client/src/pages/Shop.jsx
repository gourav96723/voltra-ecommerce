import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { productService, categoryService } from '@/services';
import ProductCard from '@/components/product/ProductCard';
import ProductFilters from '@/components/product/ProductFilters';
import { ProductCardSkeleton, EmptyState, ErrorState } from '@/components/ui/States';
import { SORT_OPTIONS } from '@/constants';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
    inStock: searchParams.get('inStock') || '',
    minDiscount: searchParams.get('minDiscount') || '',
  });
  const [sort, setSort] = useState(searchParams.get('sort') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const featured = searchParams.get('featured');

  useEffect(() => {
    categoryService.getCategories().then((r) => setCategories(r.data.categories)).catch(() => {});
    productService.getBrands().then((r) => setBrands(r.data.brands)).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...filters, sort, page, limit: 12 };
      if (featured) params.featured = featured;
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const res = await productService.getProducts(params);
      setProducts(res.data.products);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, sort, page, featured]);

  useEffect(() => {
    fetchProducts();
    const next = { ...filters, sort, page: String(page) };
    if (featured) next.featured = featured;
    Object.keys(next).forEach((k) => !next[k] && delete next[k]);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort, page]);

  const clearFilters = () => {
    setFilters({ category: '', brand: '', minPrice: '', maxPrice: '', minRating: '', inStock: '', minDiscount: '' });
    setPage(1);
  };

  const applyFilters = () => {
    setPage(1);
    setDrawerOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Shop</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? 'Loading products…' : `${total} products found`}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            aria-label="Sort products"
            className="border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm bg-white"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden flex items-center gap-1.5 border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm bg-white"
          >
            <SlidersHorizontal size={15} /> Filters
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-8">
        <aside className="hidden lg:block">
          <ProductFilters categories={categories} brands={brands} filters={filters} setFilters={setFilters} onApply={applyFilters} onClear={clearFilters} />
        </aside>

        <div>
          {error ? (
            <ErrorState message={error} onRetry={fetchProducts} />
          ) : loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState title="No products match your filters" description="Try widening your price range or clearing a filter." action={
              <button onClick={clearFilters} className="text-sm font-medium text-[var(--color-teal-dark)]">Clear all filters</button>
            } />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                    className="p-2 rounded-lg border border-[var(--color-line)] disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-mono-tag">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Next page"
                    className="p-2 rounded-lg border border-[var(--color-line)] disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[90%] bg-white p-5 overflow-y-auto thin-scroll">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-lg">Filters</h2>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close filters"><X size={20} /></button>
            </div>
            <ProductFilters categories={categories} brands={brands} filters={filters} setFilters={setFilters} onApply={applyFilters} onClear={clearFilters} />
          </div>
        </div>
      )}
    </div>
  );
}
