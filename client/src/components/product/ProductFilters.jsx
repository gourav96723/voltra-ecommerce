import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ProductFilters({ categories, brands, filters, setFilters, onApply, onClear }) {
  const toggleBrand = (brand) => {
    setFilters((f) => {
      const current = f.brand ? f.brand.split(',') : [];
      const next = current.includes(brand) ? current.filter((b) => b !== brand) : [...current, brand];
      return { ...f, brand: next.join(',') };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Category</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="category"
              checked={!filters.category}
              onChange={() => setFilters((f) => ({ ...f, category: '' }))}
            />
            All Categories
          </label>
          {categories.map((c) => (
            <label key={c._id} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="category"
                checked={filters.category === c._id}
                onChange={() => setFilters((f) => ({ ...f, category: c._id }))}
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Brand</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto thin-scroll pr-1">
          {brands.map((b) => (
            <label key={b} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(filters.brand ? filters.brand.split(',') : []).includes(b)}
                onChange={() => toggleBrand(b)}
              />
              {b}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Price Range</h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
          />
          <span className="text-gray-400">–</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Minimum Rating</h3>
        <div className="flex gap-2">
          {[4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => setFilters((f) => ({ ...f, minRating: f.minRating === String(r) ? '' : String(r) }))}
              className={`text-xs px-2.5 py-1.5 rounded-md border ${
                filters.minRating === String(r) ? 'bg-[var(--color-ink)] text-white border-[var(--color-ink)]' : 'border-[var(--color-line)]'
              }`}
            >
              {r}★+
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.inStock === 'true'}
          onChange={(e) => setFilters((f) => ({ ...f, inStock: e.target.checked ? 'true' : '' }))}
        />
        In Stock Only
      </label>

      <div>
        <h3 className="text-sm font-semibold mb-3">Discount</h3>
        <div className="flex gap-2 flex-wrap">
          {[10, 20, 30].map((d) => (
            <button
              key={d}
              onClick={() => setFilters((f) => ({ ...f, minDiscount: f.minDiscount === String(d) ? '' : String(d) }))}
              className={`text-xs px-2.5 py-1.5 rounded-md border ${
                filters.minDiscount === String(d) ? 'bg-[var(--color-ink)] text-white border-[var(--color-ink)]' : 'border-[var(--color-line)]'
              }`}
            >
              {d}%+
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={onApply} className="flex-1">Apply Filters</Button>
        <Button size="sm" variant="outline" onClick={onClear}>Clear</Button>
      </div>
    </div>
  );
}
