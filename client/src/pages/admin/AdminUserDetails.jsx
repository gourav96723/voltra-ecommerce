import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { adminService } from '@/services';
import { PageSpinner, ErrorState, EmptyState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import { formatDate, formatPrice } from '@/utils/format';

export default function AdminUserDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminService.getUserById(id).then((res) => setData(res.data)).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!data) return <PageSpinner />;

  const { user, orders } = data;

  return (
    <div className="max-w-3xl">
      <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[var(--color-ink)] mb-4">
        <ArrowLeft size={15} /> Back to Users
      </Link>

      <div className="border border-[var(--color-line)] rounded-xl bg-white p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold">{user.name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-sm text-gray-500">{user.phone || 'No phone on file'}</p>
          </div>
          {user.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Deactivated</Badge>}
        </div>
        <p className="text-xs text-gray-400 mt-3">Joined {formatDate(user.createdAt)}</p>
      </div>

      <h2 className="font-display font-semibold mb-3">Recent Orders ({orders.length})</h2>
      {orders.length === 0 ? (
        <EmptyState title="No orders yet" />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o._id} className="border border-[var(--color-line)] rounded-xl bg-white p-4 flex items-center justify-between">
              <div>
                <p className="font-mono-tag text-sm font-medium">{o.orderNumber}</p>
                <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
              </div>
              <OrderStatusBadge status={o.status} />
              <span className="font-mono-tag text-sm font-semibold">{formatPrice(o.total)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
