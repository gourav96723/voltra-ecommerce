import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Check, X, RefreshCw } from 'lucide-react';
import { orderService, paymentService } from '@/services';
import { useToast } from '@/context/ToastContext';
import { PageSpinner, ErrorState } from '@/components/ui/States';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ORDER_STATUS_FLOW } from '@/constants';
import { formatDateTime, formatPrice } from '@/utils/format';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => {
    orderService.getMyOrderById(id).then((res) => setOrder(res.data.order)).catch((err) => setError(err.message));
  };

  useEffect(load, [id]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!order) return <PageSpinner />;

  const currentStepIndex = order.status === 'Cancelled' ? -1 : ORDER_STATUS_FLOW.indexOf(order.status);
  const canCancel = !['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(order.status);
  const canRetryPayment = order.paymentMethod === 'razorpay' && order.paymentStatus !== 'Paid' && order.status !== 'Cancelled';

  const handleCancel = async () => {
    setBusy(true);
    try {
      const res = await orderService.cancelOrder(id, 'Cancelled by customer from order details.');
      setOrder(res.data.order);
      toast.success('Order cancelled.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      setCancelOpen(false);
    }
  };

  const handleRetryPayment = async () => {
    setBusy(true);
    try {
      const res = await orderService.retryPayment(id);
      const ok = await loadRazorpayScript();
      if (!ok) {
        toast.error('Could not load payment gateway.');
        return;
      }
      const { order: refreshedOrder, razorpay } = res.data;
      const rzp = new window.Razorpay({
        key: razorpay.keyId,
        amount: razorpay.amount,
        currency: razorpay.currency,
        name: 'Voltra',
        description: `Order ${refreshedOrder.orderNumber}`,
        order_id: razorpay.orderId,
        handler: async (response) => {
          try {
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: refreshedOrder._id,
            });
            toast.success('Payment successful!');
            load();
          } catch (err) {
            toast.error(err.message);
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
        theme: { color: '#00c2a8' },
      });
      rzp.on('payment.failed', async () => {
        await paymentService.paymentFailed(refreshedOrder._id).catch(() => {});
        toast.error('Payment failed. You can retry again.');
        setBusy(false);
      });
      rzp.open();
    } catch (err) {
      if (err.status === 503) toast.error('Online payment is not configured on this server yet.');
      else toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="font-mono-tag text-lg font-semibold">{order.orderNumber}</p>
          <p className="text-xs text-gray-400 mt-0.5">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Tracking timeline */}
      {order.status !== 'Cancelled' ? (
        <div className="border border-[var(--color-line)] rounded-xl bg-white p-5 mb-6 overflow-x-auto thin-scroll">
          <div className="flex items-center min-w-[600px]">
            {ORDER_STATUS_FLOW.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${i <= currentStepIndex ? 'bg-[var(--color-teal)] text-white' : 'bg-[var(--color-paper-dim)] text-gray-400'}`}>
                    {i <= currentStepIndex ? <Check size={14} /> : i + 1}
                  </div>
                  <span className={`text-xs mt-1.5 text-center max-w-[80px] ${i <= currentStepIndex ? 'text-[var(--color-ink)] font-medium' : 'text-gray-400'}`}>{s}</span>
                </div>
                {i < ORDER_STATUS_FLOW.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${i < currentStepIndex ? 'bg-[var(--color-teal)]' : 'bg-[var(--color-line)]'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4 mb-6 flex items-center gap-2 text-sm text-[var(--color-danger)]">
          <X size={16} /> This order was cancelled{order.cancelReason ? `: ${order.cancelReason}` : '.'}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="border border-[var(--color-line)] rounded-xl bg-white p-5">
          <h2 className="font-display font-semibold mb-4">Items</h2>
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

          <h3 className="font-display font-semibold mt-6 mb-2">Shipping Address</h3>
          <p className="text-sm text-gray-600">
            {order.shippingAddress.fullName}<br />
            {order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
            {order.shippingAddress.country} · {order.shippingAddress.phone}
          </p>
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
              <div className="flex justify-between text-gray-600"><span>Discount</span><span className="font-mono-tag text-[var(--color-success)]">-{formatPrice(order.discount)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="font-mono-tag">{order.shippingFee === 0 ? 'Free' : formatPrice(order.shippingFee)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Tax</span><span className="font-mono-tag">{formatPrice(order.tax)}</span></div>
              <div className="flex justify-between font-semibold border-t border-[var(--color-line)] pt-1.5"><span>Total</span><span className="font-mono-tag">{formatPrice(order.total)}</span></div>
            </div>

            {canRetryPayment && (
              <Button className="w-full mt-4" variant="accent" onClick={handleRetryPayment} loading={busy}>
                <RefreshCw size={15} /> Retry Payment
              </Button>
            )}
            {canCancel && (
              <Button className="w-full mt-2" variant="outline" onClick={() => setCancelOpen(true)}>Cancel Order</Button>
            )}
          </div>

          {order.status === 'Delivered' && order.items[0]?.product?.slug && (
            <div className="border border-[var(--color-line)] rounded-xl bg-white p-5">
              <p className="text-sm text-gray-600">Received your order? <Link to={`/product/${order.items[0].product.slug}`} className="text-[var(--color-teal-dark)] font-medium">Leave a review</Link> from the product page.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this order?"
        description="If payment was already made, a refund will be processed."
        confirmLabel="Cancel Order"
        danger
        onConfirm={handleCancel}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
}
