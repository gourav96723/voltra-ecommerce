import { NavLink, Outlet } from 'react-router-dom';
import { User, Package, MapPin, KeyRound } from 'lucide-react';

const links = [
  { to: '/account/profile', label: 'Profile', icon: User },
  { to: '/account/orders', label: 'Order History', icon: Package },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/change-password', label: 'Change Password', icon: KeyRound },
];

export default function AccountLayout() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-2xl font-bold mb-6">My Account</h1>
      <div className="grid md:grid-cols-[220px_1fr] gap-8">
        <nav className="flex md:flex-col gap-1 overflow-x-auto thin-scroll">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                  isActive ? 'bg-[var(--color-ink)] text-white' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-dim)]'
                }`
              }
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
