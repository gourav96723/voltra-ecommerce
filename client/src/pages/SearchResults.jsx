import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { productService } from '@/services';
import ProductCard from '@/components/product/ProductCard';
import { ProductCardSkeleton, EmptyState, ErrorState } from '@/components/ui/States';
import { SORT_OPTIONS } from '@/constants';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState('');

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    productService
      .getProducts({ search: query, sort, limit: 24 })
      .then((res) => {
        setProducts(res.data.products);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [query, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Search results for "{query}"</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? 'Searching…' : `${total} result${total === 1 ? '' : 's'} found`}</p>
        </div>
        {products.length > 0 && (
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort results" className="border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm bg-white">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title={query ? `No results for "${query}"` : 'Search for something'}
          description="Try a different brand, category, or a shorter search term."
          action={<Link to="/shop" className="text-sm font-medium text-[var(--color-teal-dark)]">Browse all products</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  );
}
