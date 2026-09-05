import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { orderService } from '@/services';
import { PageSpinner, ErrorState } from '@/components/ui/States';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/utils/format';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    orderService.getMyOrderById(id).then((res) => setOrder(res.data.order)).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!order) return <PageSpinner />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 size={32} className="text-[var(--color-success)]" />
      </div>
      <h1 className="font-display text-2xl font-bold">
        {order.paymentStatus === 'Paid' || order.paymentMethod === 'cod' ? 'Order Confirmed!' : 'Order Received'}
      </h1>
      <p className="text-gray-500 mt-2">Thanks for shopping with Voltra. A confirmation has been recorded for order:</p>
      <p className="font-mono-tag font-semibold text-lg mt-2">{order.orderNumber}</p>

      <div className="border border-[var(--color-line)] rounded-xl bg-white p-5 mt-8 text-left">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Payment Method</span>
          <span className="font-medium">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Payment Status</span>
          <span className="font-medium">{order.paymentStatus}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Shipping to</span>
          <span className="font-medium text-right">{order.shippingAddress.city}, {order.shippingAddress.state}</span>
        </div>
        <div className="border-t border-[var(--color-line)] mt-3 pt-3 flex justify-between font-semibold text-sm">
          <span>{order.paymentMethod === 'cod' && order.paymentStatus !== 'Paid' ? 'Amount Due' : 'Total Paid'}</span>
          <span className="font-mono-tag">{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="flex gap-3 justify-center mt-8">
        <Link to={`/account/orders/${order._id}`}><Button variant="outline">View Order</Button></Link>
        <Link to="/shop"><Button>Continue Shopping</Button></Link>
      </div>
    </div>
  );
}
