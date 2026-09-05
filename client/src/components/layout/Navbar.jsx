import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { Search, Heart, ShoppingCart, User, Menu, X, LogOut, Package, MapPin, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { BRAND_NAME } from '@/constants';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
];

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cart } = useCart();
  const { productIds } = useWishlist();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setDrawerOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setAccountOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-ink)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">
          <button
            className="lg:hidden p-2 -ml-2"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={22} />
          </button>

          <Link to="/" className="font-display font-bold text-xl tracking-tight shrink-0">
            {BRAND_NAME}
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-2">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md ml-4">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for laptops, earbuds, cameras…"
                aria-label="Search products"
                className="w-full bg-white/10 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] focus:bg-white/15"
              />
            </div>
          </form>

          <div className="flex items-center gap-1 ml-auto">
            <Link to="/wishlist" className="relative p-2.5 hover:bg-white/10 rounded-lg" aria-label="Wishlist">
              <Heart size={20} />
              {productIds.length > 0 && (
                <span className="absolute top-1 right-1 bg-[var(--color-amber)] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {productIds.length}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative p-2.5 hover:bg-white/10 rounded-lg" aria-label="Cart">
              <ShoppingCart size={20} />
              {cart.itemCount > 0 && (
                <span className="absolute top-1 right-1 bg-[var(--color-teal)] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.itemCount}
                </span>
              )}
            </Link>

            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className="p-2.5 hover:bg-white/10 rounded-lg flex items-center gap-1"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                aria-label="Account menu"
              >
                <User size={20} />
              </button>
              {accountOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 bg-white text-[var(--color-ink)] rounded-xl shadow-xl border border-[var(--color-line)] py-2 overflow-hidden"
                >
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 border-b border-[var(--color-line)]">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setAccountOpen(false)} role="menuitem" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--color-paper-dim)]">
                          <LayoutDashboard size={16} /> Admin Dashboard
                        </Link>
                      )}
                      <Link to="/account/profile" onClick={() => setAccountOpen(false)} role="menuitem" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--color-paper-dim)]">
                        <User size={16} /> Profile
                      </Link>
                      <Link to="/account/orders" onClick={() => setAccountOpen(false)} role="menuitem" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--color-paper-dim)]">
                        <Package size={16} /> Orders
                      </Link>
                      <Link to="/account/addresses" onClick={() => setAccountOpen(false)} role="menuitem" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--color-paper-dim)]">
                        <MapPin size={16} /> Addresses
                      </Link>
                      <button onClick={handleLogout} role="menuitem" className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-danger)] hover:bg-red-50">
                        <LogOut size={16} /> Logout
                      </button>
                    </>
                  ) : (
                    <div className="px-4 py-2 flex flex-col gap-2">
                      <Link to="/login" onClick={() => setAccountOpen(false)} className="text-sm font-medium text-center py-2 rounded-lg bg-[var(--color-ink)] text-white">
                        Login
                      </Link>
                      <Link to="/register" onClick={() => setAccountOpen(false)} className="text-sm font-medium text-center py-2 rounded-lg border border-[var(--color-line)]">
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white text-[var(--color-ink)] p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display font-bold text-lg">{BRAND_NAME}</span>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleSearch} className="mb-5">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products…"
                  className="w-full border border-[var(--color-line)] rounded-lg pl-9 pr-3 py-2 text-sm"
                />
              </div>
            </form>
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setDrawerOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-[var(--color-paper-dim)] text-sm font-medium">
                  {link.label}
                </Link>
              ))}
              <Link to="/wishlist" onClick={() => setDrawerOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-[var(--color-paper-dim)] text-sm font-medium">
                Wishlist
              </Link>
              <Link to="/cart" onClick={() => setDrawerOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-[var(--color-paper-dim)] text-sm font-medium">
                Cart
              </Link>
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setDrawerOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-[var(--color-paper-dim)] text-sm font-medium">
                      Admin Dashboard
                    </Link>
                  )}
                  <Link to="/account/profile" onClick={() => setDrawerOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-[var(--color-paper-dim)] text-sm font-medium">
                    Profile
                  </Link>
                  <Link to="/account/orders" onClick={() => setDrawerOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-[var(--color-paper-dim)] text-sm font-medium">
                    Orders
                  </Link>
                  <button onClick={() => { handleLogout(); setDrawerOpen(false); }} className="text-left px-3 py-2.5 rounded-lg hover:bg-red-50 text-sm font-medium text-[var(--color-danger)]">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setDrawerOpen(false)} className="px-3 py-2.5 rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium text-center mt-2">
                    Login
                  </Link>
                  <Link to="/register" onClick={() => setDrawerOpen(false)} className="px-3 py-2.5 rounded-lg border border-[var(--color-line)] text-sm font-medium text-center">
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
