import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { productService } from '@/services';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { EmptyState, PageSpinner, ErrorState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/utils/format';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    setError(null);
    productService
      .getProductsAdmin({ search, page, limit: 15 })
      .then((res) => {
        setProducts(res.data.products);
        setTotalPages(res.totalPages);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleDelete = async () => {
    try {
      await productService.deleteProduct(deleteTarget._id);
      toast.success('Product deactivated.');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-2xl font-bold">Products</h1>
        <Link to="/admin/products/new"><Button><Plus size={16} /> Add Product</Button></Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-5 max-w-sm">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="pl-9" />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <PageSpinner />
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="No products found" description="Try a different search or add your first product." action={<Link to="/admin/products/new"><Button>Add Product</Button></Link>} />
      ) : (
        <div className="border border-[var(--color-line)] rounded-xl bg-white overflow-hidden">
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-paper-dim)]">
                <tr className="text-left text-xs text-gray-500">
                  <th className="p-3 font-medium">Product</th>
                  <th className="p-3 font-medium">Category</th>
                  <th className="p-3 font-medium">Price</th>
                  <th className="p-3 font-medium">Stock</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} className="border-t border-[var(--color-line)]">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={p.images?.[0]?.url} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-[var(--color-paper-dim)]" />
                        <div>
                          <p className="font-medium line-clamp-1">{p.name}</p>
                          <p className="text-xs text-gray-400 font-mono-tag">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-gray-500">{p.category?.name}</td>
                    <td className="p-3 font-mono-tag">{formatPrice(p.price)}</td>
                    <td className="p-3">
                      <span className={p.stock <= 5 ? 'text-[var(--color-danger)] font-medium' : ''}>{p.stock}</span>
                    </td>
                    <td className="p-3">{p.active ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Inactive</Badge>}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Link to={`/admin/products/${p._id}/edit`} aria-label={`Edit ${p.name}`} className="p-1.5 text-gray-400 hover:text-[var(--color-ink)]"><Pencil size={15} /></Link>
                        <button onClick={() => setDeleteTarget(p)} aria-label={`Deactivate ${p.name}`} className="p-1.5 text-gray-400 hover:text-[var(--color-danger)]"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-[var(--color-line)] disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={16} /></button>
          <span className="text-sm font-mono-tag">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-[var(--color-line)] disabled:opacity-40" aria-label="Next page"><ChevronRight size={16} /></button>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Deactivate this product?"
        description="It will be hidden from the storefront but kept for historical orders. This can be reversed by editing the product."
        confirmLabel="Deactivate"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
