import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, ShoppingBag, Users, Menu, X, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { BRAND_NAME } from '@/constants';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const NavItems = ({ onClick }) => (
    <>
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onClick}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
              isActive ? 'bg-[var(--color-teal)] text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <Icon size={17} /> {label}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="min-h-screen flex bg-[var(--color-paper)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[var(--color-ink)] text-white p-5 shrink-0">
        <Link to="/" className="font-display font-bold text-xl mb-1">{BRAND_NAME}</Link>
        <p className="text-xs text-white/40 mb-6">Admin Console</p>
        <nav className="flex flex-col gap-1 flex-1">
          <NavItems />
        </nav>
        <Link to="/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white">
          <ArrowLeft size={16} /> Back to Store
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-300 hover:bg-white/10 mt-1">
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[var(--color-ink)] text-white p-5">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display font-bold text-lg">{BRAND_NAME}</span>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu"><X size={20} /></button>
            </div>
            <nav className="flex flex-col gap-1">
              <NavItems onClick={() => setDrawerOpen(false)} />
            </nav>
            <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-300 hover:bg-white/10 mt-4">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-40 bg-[var(--color-ink)] text-white flex items-center justify-between px-4 h-14">
          <button onClick={() => setDrawerOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <span className="font-display font-semibold">Admin</span>
          <span className="text-xs text-white/50">{user?.name}</span>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
