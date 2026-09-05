import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { orderService } from '@/services';
import { useToast } from '@/context/ToastContext';
import { PageSpinner, ErrorState } from '@/components/ui/States';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import Button from '@/components/ui/Button';
import { ORDER_STATUS_FLOW } from '@/constants';
import { formatDateTime, formatPrice } from '@/utils/format';

const ALL_STATUSES = [...ORDER_STATUS_FLOW, 'Cancelled'];

export default function AdminOrderDetails() {
  const { id } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [nextStatus, setNextStatus] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    orderService.getOrderByIdAdmin(id).then((res) => {
      setOrder(res.data.order);
      setNextStatus(res.data.order.status);
    }).catch((err) => setError(err.message));
  };

  useEffect(load, [id]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!order) return <PageSpinner />;

  const handleUpdateStatus = async () => {
    setBusy(true);
    try {
      const res = await orderService.updateOrderStatusAdmin(id, { status: nextStatus, note });
      setOrder(res.data.order);
      setNote('');
      toast.success('Order status updated.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[var(--color-ink)] mb-4">
        <ArrowLeft size={15} /> Back to Orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="font-mono-tag text-lg font-semibold">{order.orderNumber}</p>
          <p className="text-xs text-gray-400 mt-0.5">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <div className="border border-[var(--color-line)] rounded-xl bg-white p-5">
            <h2 className="font-display font-semibold mb-3">Customer</h2>
            <p className="text-sm">{order.user?.name}</p>
            <p className="text-sm text-gray-500">{order.user?.email}</p>
            <p className="text-sm text-gray-500">{order.user?.phone}</p>
          </div>

          <div className="border border-[var(--color-line)] rounded-xl bg-white p-5">
            <h2 className="font-display font-semibold mb-3">Items</h2>
            <ul className="divide-y divide-[var(--color-line)]">
              {order.items.map((item, i) => (
                <li key={i} className="py-3 flex gap-3">
                  <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover bg-[var(--color-paper-dim)]" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">SKU: {item.sku} · Qty: {item.quantity}</p>
                  </div>
                  <span className="font-mono-tag text-sm">{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-[var(--color-line)] rounded-xl bg-white p-5">
            <h2 className="font-display font-semibold mb-3">Shipping Address</h2>
            <p className="text-sm text-gray-600">
              {order.shippingAddress.fullName}<br />
              {order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country} · {order.shippingAddress.phone}
            </p>
          </div>

          <div className="border border-[var(--color-line)] rounded-xl bg-white p-5">
            <h2 className="font-display font-semibold mb-3">Status History</h2>
            <ul className="space-y-3">
              {order.statusHistory.map((h, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <OrderStatusBadge status={h.status} />
                  <div>
                    {h.note && <p className="text-gray-600">{h.note}</p>}
                    <p className="text-xs text-gray-400">{formatDateTime(h.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-[var(--color-line)] rounded-xl bg-white p-5">
            <h2 className="font-display font-semibold mb-3">Payment</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600"><span>Method</span><span className="font-medium">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}</span></div>
              <div className="flex justify-between text-gray-600"><span>Status</span><span className="font-medium">{order.paymentStatus}</span></div>
            </div>
            <div className="space-y-1.5 text-sm mt-3 pt-3 border-t border-[var(--color-line)]">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-mono-tag">{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Discount</span><span className="font-mono-tag">-{formatPrice(order.discount)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="font-mono-tag">{formatPrice(order.shippingFee)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Tax</span><span className="font-mono-tag">{formatPrice(order.tax)}</span></div>
              <div className="flex justify-between font-semibold border-t border-[var(--color-line)] pt-1.5"><span>Total</span><span className="font-mono-tag">{formatPrice(order.total)}</span></div>
            </div>
          </div>

          {order.status !== 'Cancelled' && (
            <div className="border border-[var(--color-line)] rounded-xl bg-white p-5">
              <h2 className="font-display font-semibold mb-3">Update Status</h2>
              <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm mb-3">
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note…" rows={2} className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm mb-3" />
              <Button className="w-full" onClick={handleUpdateStatus} loading={busy} disabled={nextStatus === order.status}>Update Status</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
