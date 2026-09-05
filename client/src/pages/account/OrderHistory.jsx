import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { orderService } from '@/services';
import { EmptyState, PageSpinner, ErrorState } from '@/components/ui/States';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import Button from '@/components/ui/Button';
import { formatDate, formatPrice } from '@/utils/format';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = () => {
    setLoading(true);
    setError(null);
    orderService
      .getMyOrders({ page, limit: 8 })
      .then((res) => {
        setOrders(res.data.orders);
        setTotalPages(res.totalPages);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page]);

  if (loading) return <PageSpinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        description="Once you place an order, it will show up here."
        action={<Link to="/shop"><Button>Start Shopping</Button></Link>}
      />
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {orders.map((o) => (
          <Link
            key={o._id}
            to={`/account/orders/${o._id}`}
            className="block border border-[var(--color-line)] rounded-xl bg-white p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-mono-tag text-sm font-semibold">{o.orderNumber}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(o.createdAt)} · {o.items.length} item{o.items.length === 1 ? '' : 's'}</p>
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={o.status} />
                <span className="font-mono-tag font-semibold text-sm">{formatPrice(o.total)}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3 overflow-x-auto thin-scroll">
              {o.items.slice(0, 5).map((item, i) => (
                <img key={i} src={item.image} alt={item.name} className="w-10 h-10 rounded-md object-cover bg-[var(--color-paper-dim)] shrink-0" />
              ))}
              {o.items.length > 5 && (
                <div className="w-10 h-10 rounded-md bg-[var(--color-paper-dim)] flex items-center justify-center text-xs text-gray-500 shrink-0">+{o.items.length - 5}</div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-[var(--color-line)] disabled:opacity-40" aria-label="Previous page">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-mono-tag">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-[var(--color-line)] disabled:opacity-40" aria-label="Next page">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
