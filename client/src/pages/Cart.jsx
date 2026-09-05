import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { PriceTag } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { EmptyState, PageSpinner } from '@/components/ui/States';
import { formatPrice } from '@/utils/format';

export default function Cart() {
  const { cart, loading, updateItem, removeItem } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  if (loading) return <PageSpinner />;

  if (cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse the shop and add items you love."
          action={<Link to="/shop"><Button>Start Shopping</Button></Link>}
        />
      </div>
    );
  }

  const handleQty = async (productId, qty, stock) => {
    if (qty < 1) return;
    if (qty > stock) return toast.error(`Only ${stock} unit(s) available.`);
    try {
      await updateItem(productId, qty);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemove = async (productId, name) => {
    await removeItem(productId);
    toast.success(`${name} removed from cart.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-2xl font-bold mb-6">Your Cart ({cart.itemCount} item{cart.itemCount === 1 ? '' : 's'})</h1>
      <div className="grid lg:grid-cols-[1fr_340px] gap-8">
        <ul className="space-y-4">
          {cart.items.map((item) => (
            <li key={item.product._id} className={`flex gap-4 border border-[var(--color-line)] rounded-xl p-4 bg-white ${item.exceedsStock ? 'border-[var(--color-danger)]' : ''}`}>
              <Link to={`/product/${item.product.slug}`} className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-[var(--color-paper-dim)]">
                <img src={item.product.images?.[0]?.url} alt={item.product.name} className="w-full h-full object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.product.slug}`} className="font-medium text-sm hover:underline line-clamp-2">{item.product.name}</Link>
                <p className="text-xs text-gray-400 font-mono-tag mt-0.5">{item.product.brand}</p>
                {item.exceedsStock && <p className="text-xs text-[var(--color-danger)] mt-1">Only {item.product.stock} left — reduce quantity</p>}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-[var(--color-line)] rounded-lg">
                    <button onClick={() => handleQty(item.product._id, item.quantity - 1, item.product.stock)} aria-label="Decrease quantity" className="p-2"><Minus size={13} /></button>
                    <span className="w-8 text-center text-sm font-mono-tag">{item.quantity}</span>
                    <button onClick={() => handleQty(item.product._id, item.quantity + 1, item.product.stock)} aria-label="Increase quantity" className="p-2"><Plus size={13} /></button>
                  </div>
                  <span className="font-mono-tag font-semibold text-sm">{formatPrice(item.lineTotal)}</span>
                </div>
              </div>
              <button onClick={() => handleRemove(item.product._id, item.product.name)} aria-label={`Remove ${item.product.name}`} className="text-gray-400 hover:text-[var(--color-danger)] self-start">
                <Trash2 size={17} />
              </button>
            </li>
          ))}
        </ul>

        <div className="border border-[var(--color-line)] rounded-xl p-5 bg-white h-fit sticky top-20">
          <h2 className="font-display font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-mono-tag">{formatPrice(cart.subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Discount</span><span className="font-mono-tag text-[var(--color-success)]">-{formatPrice(cart.discount)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="font-mono-tag">{cart.shippingFee === 0 ? 'Free' : formatPrice(cart.shippingFee)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Tax</span><span className="font-mono-tag">{formatPrice(cart.tax)}</span></div>
            <div className="border-t border-[var(--color-line)] pt-2 flex justify-between font-semibold"><span>Total</span><span className="font-mono-tag">{formatPrice(cart.total)}</span></div>
          </div>
          <Button
            className="w-full mt-5"
            variant="accent"
            disabled={cart.items.some((i) => i.exceedsStock)}
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </Button>
          {cart.items.some((i) => i.exceedsStock) && (
            <p className="text-xs text-[var(--color-danger)] mt-2">Resolve stock issues above to continue.</p>
          )}
        </div>
      </div>
    </div>
  );
}
