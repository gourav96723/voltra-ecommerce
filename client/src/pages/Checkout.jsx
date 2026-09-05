import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, MapPin, Plus, CreditCard, Truck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { authService, orderService, paymentService } from '@/services';
import Button from '@/components/ui/Button';
import { PageSpinner, EmptyState } from '@/components/ui/States';
import { formatPrice } from '@/utils/format';
import AddressForm from '@/components/checkout/AddressForm';

const STEPS = ['Address', 'Summary', 'Payment'];

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

export default function Checkout() {
  const { cart, loading: cartLoading, refreshCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [placing, setPlacing] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [razorpayConfigured, setRazorpayConfigured] = useState(false);
  const [loadingPaymentConfig, setLoadingPaymentConfig] = useState(true);

  useEffect(() => {
    Promise.all([
      authService.listAddresses().then((res) => {
        setAddresses(res.data.addresses);
        const def = res.data.addresses.find((a) => a.isDefault) || res.data.addresses[0];
        if (def) setSelectedAddressId(def._id);
        setLoadingAddresses(false);
      }),
      paymentService.getConfig().then((res) => {
        setRazorpayConfigured(Boolean(res.data.onlinePaymentAvailable));
      }).catch(() => {
        setRazorpayConfigured(false);
      }).finally(() => setLoadingPaymentConfig(false)),
    ]).catch(() => {
      setLoadingAddresses(false);
    });
  }, []);



  if (cartLoading || loadingAddresses || loadingPaymentConfig) return <PageSpinner />;

  if (cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <EmptyState title="Your cart is empty" description="Add items before checking out." action={<Link to="/shop"><Button>Shop Now</Button></Link>} />
      </div>
    );
  }

  const handleAddressAdded = (newAddresses, newlyAddedId) => {
    setAddresses(newAddresses);
    setSelectedAddressId(newlyAddedId);
    setShowAddressForm(false);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) return toast.error('Select a shipping address.');
    setPlacing(true);
    try {
      const res = await orderService.createOrder({ addressId: selectedAddressId, paymentMethod });

      if (paymentMethod === 'cod') {
        await refreshCart();
        toast.success('Order placed with Cash on Delivery!');
        navigate(`/order-success/${res.data.order._id}`);
        return;
      }

      const ok = await loadRazorpayScript();
      if (!ok) {
        toast.error('Could not load payment gateway. Check your connection and try again.');
        setPlacing(false);
        return;
      }

      const { order, razorpay } = res.data;
      const rzp = new window.Razorpay({
        key: razorpay.keyId,
        amount: razorpay.amount,
        currency: razorpay.currency,
        name: 'Voltra',
        description: `Order ${order.orderNumber}`,
        order_id: razorpay.orderId,
        handler: async (response) => {
          try {
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order._id,
            });
            await refreshCart();
            toast.success('Payment successful! Order confirmed.');
            navigate(`/order-success/${order._id}`);
          } catch (err) {
            toast.error(err.message || 'Payment verification failed.');
            navigate(`/account/orders/${order._id}`);
          }
        },
        modal: {
          ondismiss: async () => {
            await paymentService.paymentFailed(order._id).catch(() => {});
            toast.info('Payment cancelled. You can retry from Order History.');
            setPlacing(false);
          },
        },
        theme: { color: '#00c2a8' },
      });
      rzp.on('payment.failed', async () => {
        await paymentService.paymentFailed(order._id).catch(() => {});
        toast.error('Payment failed. You can retry from Order History.');
        setPlacing(false);
      });
      rzp.open();
    } catch (err) {
      if (err.status === 503) {
        toast.error('Online payment is not configured on this server yet. Try Cash on Delivery instead.');
      } else {
        toast.error(err.message);
      }
      setPlacing(false);
    }
  };

  const selectedAddress = addresses.find((a) => a._id === selectedAddressId);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-2xl font-bold mb-2">Checkout</h1>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${i <= step ? 'bg-[var(--color-teal)] text-white' : 'bg-[var(--color-paper-dim)] text-gray-400'}`}>
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-sm ${i <= step ? 'text-[var(--color-ink)] font-medium' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-[var(--color-line)]" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div>
          {step === 0 && (
            <div className="border border-[var(--color-line)] rounded-xl bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold flex items-center gap-2"><MapPin size={18} /> Shipping Address</h2>
                <button onClick={() => setShowAddressForm((s) => !s)} className="text-sm text-[var(--color-teal-dark)] font-medium flex items-center gap-1">
                  <Plus size={14} /> Add New
                </button>
              </div>

              {showAddressForm && (
                <div className="mb-5 border border-[var(--color-line)] rounded-lg p-4">
                  <AddressForm onSaved={handleAddressAdded} />
                </div>
              )}

              {addresses.length === 0 ? (
                <p className="text-sm text-gray-500">No saved addresses. Add one to continue.</p>
              ) : (
                <div className="space-y-3">
                  {addresses.map((a) => (
                    <label key={a._id} className={`block border rounded-lg p-4 cursor-pointer ${selectedAddressId === a._id ? 'border-[var(--color-teal)] ring-1 ring-[var(--color-teal)]' : 'border-[var(--color-line)]'}`}>
                      <div className="flex items-start gap-3">
                        <input type="radio" name="address" checked={selectedAddressId === a._id} onChange={() => setSelectedAddressId(a._id)} className="mt-1" />
                        <div className="text-sm">
                          <p className="font-medium">{a.fullName} · <span className="text-gray-400 font-mono-tag text-xs">{a.label}</span></p>
                          <p className="text-gray-600 mt-0.5">{a.addressLine1}, {a.addressLine2 ? `${a.addressLine2}, ` : ''}{a.city}, {a.state} {a.postalCode}</p>
                          <p className="text-gray-400 mt-0.5">{a.phone}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <Button className="mt-5" onClick={() => setStep(1)} disabled={!selectedAddressId}>Continue to Summary</Button>
            </div>
          )}

          {step === 1 && (
            <div className="border border-[var(--color-line)] rounded-xl bg-white p-5">
              <h2 className="font-display font-semibold mb-4">Order Summary</h2>
              <ul className="divide-y divide-[var(--color-line)]">
                {cart.items.map((item) => (
                  <li key={item.product._id} className="py-3 flex gap-3">
                    <img src={item.product.images?.[0]?.url} alt={item.product.name} className="w-14 h-14 rounded-lg object-cover bg-[var(--color-paper-dim)]" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium line-clamp-1">{item.product.name}</p>
                      <p className="text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-mono-tag text-sm">{formatPrice(item.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between mt-4">
                <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
                <Button onClick={() => setStep(2)}>Continue to Payment</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="border border-[var(--color-line)] rounded-xl bg-white p-5">
              <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><CreditCard size={18} /> Payment Method</h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 border rounded-lg p-4 ${razorpayConfigured ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} ${paymentMethod === 'razorpay' && razorpayConfigured ? 'border-[var(--color-teal)] ring-1 ring-[var(--color-teal)]' : 'border-[var(--color-line)]'}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} disabled={!razorpayConfigured} />
                  <CreditCard size={18} className="text-[var(--color-teal)]" />
                  <div className="text-sm">
                    <p className="font-medium">Pay Online (Razorpay)</p>
                    <p className="text-gray-400 text-xs">{razorpayConfigured ? 'Cards, UPI, netbanking & wallets' : 'Currently unavailable — configure Razorpay on the backend'}</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 border rounded-lg p-4 cursor-pointer ${paymentMethod === 'cod' ? 'border-[var(--color-teal)] ring-1 ring-[var(--color-teal)]' : 'border-[var(--color-line)]'}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                  <Truck size={18} className="text-[var(--color-teal)]" />
                  <div className="text-sm">
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="text-gray-400 text-xs">Pay when your order arrives</p>
                  </div>
                </label>
              </div>
              <div className="flex justify-between mt-5">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button variant="accent" onClick={handlePlaceOrder} loading={placing} disabled={paymentMethod === 'razorpay' && !razorpayConfigured}>
                  {paymentMethod === 'cod' ? 'Place Order' : `Pay ${formatPrice(cart.total)}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="border border-[var(--color-line)] rounded-xl bg-white p-5 h-fit sticky top-20">
          <h2 className="font-display font-semibold mb-3">Total</h2>
          {selectedAddress && step > 0 && (
            <div className="text-xs text-gray-500 mb-3 pb-3 border-b border-[var(--color-line)]">
              Shipping to: <span className="text-[var(--color-ink)] font-medium">{selectedAddress.city}, {selectedAddress.state}</span>
            </div>
          )}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-mono-tag">{formatPrice(cart.subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Discount</span><span className="font-mono-tag text-[var(--color-success)]">-{formatPrice(cart.discount)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="font-mono-tag">{cart.shippingFee === 0 ? 'Free' : formatPrice(cart.shippingFee)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Tax</span><span className="font-mono-tag">{formatPrice(cart.tax)}</span></div>
            <div className="border-t border-[var(--color-line)] pt-2 flex justify-between font-semibold"><span>Total</span><span className="font-mono-tag">{formatPrice(cart.total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
