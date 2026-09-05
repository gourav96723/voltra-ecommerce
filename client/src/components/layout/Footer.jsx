import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Mail } from 'lucide-react';
import { BRAND_NAME, BRAND_TAGLINE } from '@/constants';
import { useToast } from '@/context/ToastContext';

export default function Footer() {
  const [email, setEmail] = useState('');
  const toast = useToast();

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success('You are subscribed to Voltra updates.');
    setEmail('');
  };

  return (
    <footer className="bg-[var(--color-ink)] text-white mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <span className="font-display font-bold text-xl">{BRAND_NAME}</span>
            <p className="text-sm text-white/60 mt-2 max-w-xs">{BRAND_TAGLINE}</p>
            <form onSubmit={handleSubscribe} className="mt-5 flex max-w-sm">
              <div className="relative flex-1">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-label="Email for newsletter"
                  className="w-full bg-white/10 border border-white/10 rounded-l-lg pl-9 pr-3 py-2 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
                />
              </div>
              <button type="submit" className="bg-[var(--color-teal)] px-4 rounded-r-lg text-sm font-medium hover:bg-[var(--color-teal-dark)]">
                Subscribe
              </button>
            </form>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Shop</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/shop" className="hover:text-white">All Products</Link></li>
              <li><Link to="/shop?featured=true" className="hover:text-white">Featured</Link></li>
              <li><Link to="/shop?sort=discount-desc" className="hover:text-white">Best Deals</Link></li>
              <li><Link to="/shop?sort=newest" className="hover:text-white">New Arrivals</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/account/orders" className="hover:text-white">Order History</Link></li>
              <li><Link to="/wishlist" className="hover:text-white">Wishlist</Link></li>
              <li><Link to="/account/addresses" className="hover:text-white">Addresses</Link></li>
              <li><Link to="/account/profile" className="hover:text-white">Profile Settings</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li>Shipping &amp; Returns</li>
              <li>Warranty Policy</li>
              <li>Track an Order</li>
              <li>Contact Us</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-white/40">
          <span>© {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</span>
          <span>Secure checkout · Razorpay powered · Demo project for portfolio use</span>
        </div>
      </div>
    </footer>
  );
}
