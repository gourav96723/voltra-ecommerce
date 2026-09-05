import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { orderService } from '@/services';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { EmptyState, PageSpinner, ErrorState } from '@/components/ui/States';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import { formatDate, formatPrice } from '@/utils/format';
import { ORDER_STATUS_FLOW } from '@/constants';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    orderService
      .getAllOrdersAdmin({ search, status, page, limit: 15 })
      .then((res) => {
        setOrders(res.data.orders);
        setTotalPages(res.totalPages);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, status]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Orders</h1>

      <div className="flex flex-wrap gap-3 mb-5">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order number…" className="pl-9 w-60" />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All Statuses</option>
          {[...ORDER_STATUS_FLOW, 'Cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <PageSpinner />
      ) : orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders found" />
      ) : (
        <div className="border border-[var(--color-line)] rounded-xl bg-white overflow-hidden">
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-paper-dim)]">
                <tr className="text-left text-xs text-gray-500">
                  <th className="p-3 font-medium">Order</th>
                  <th className="p-3 font-medium">Customer</th>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Payment</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="border-t border-[var(--color-line)] hover:bg-[var(--color-paper-dim)]/40">
                    <td className="p-3"><Link to={`/admin/orders/${o._id}`} className="font-mono-tag text-xs font-medium hover:underline">{o.orderNumber}</Link></td>
                    <td className="p-3">
                      <p className="text-xs font-medium">{o.user?.name}</p>
                      <p className="text-xs text-gray-400">{o.user?.email}</p>
                    </td>
                    <td className="p-3 text-xs text-gray-500">{formatDate(o.createdAt)}</td>
                    <td className="p-3 text-xs">{o.paymentStatus}</td>
                    <td className="p-3"><OrderStatusBadge status={o.status} /></td>
                    <td className="p-3 text-right font-mono-tag">{formatPrice(o.total)}</td>
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
    </div>
  );
}
