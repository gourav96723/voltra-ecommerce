import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, ShoppingBag, IndianRupee, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { adminService } from '@/services';
import { PageSpinner, ErrorState } from '@/components/ui/States';
import StatCard from '@/components/admin/StatCard';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import { formatDate, formatPrice } from '@/utils/format';

const PIE_COLORS = ['#00c2a8', '#ff9f45', '#11162b', '#7c8bff', '#e0483e', '#1f9d55', '#8a6fd6'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminService.getDashboard().then((res) => setData(res.data)).catch((err) => setError(err.message));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!data) return <PageSpinner />;

  const { totals, lowStockProducts, recentOrders, revenueByDay, topProducts, categoryBreakdown } = data;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={formatPrice(totals.revenue)} icon={IndianRupee} tone="teal" />
        <StatCard label="Total Orders" value={totals.orders} icon={ShoppingBag} />
        <StatCard label="Customers" value={totals.users} icon={Users} />
        <StatCard label="Active Products" value={totals.products} icon={Package} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Pending Orders" value={totals.pendingOrders} tone="amber" />
        <StatCard label="Delivered" value={totals.deliveredOrders} />
        <StatCard label="Cancelled" value={totals.cancelledOrders} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="border border-[var(--color-line)] rounded-xl bg-white p-5">
          <h2 className="font-display font-semibold mb-4">Revenue (Last 30 Days)</h2>
          {revenueByDay.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No paid orders yet in this window.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatPrice(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#00c2a8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="border border-[var(--color-line)] rounded-xl bg-white p-5">
          <h2 className="font-display font-semibold mb-4">Top Products (Units Sold)</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No sales data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} tickFormatter={(v) => (v.length > 16 ? v.slice(0, 16) + '…' : v)} />
                <Tooltip />
                <Bar dataKey="unitsSold" fill="#ff9f45" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 mb-8">
        <div className="border border-[var(--color-line)] rounded-xl bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-[var(--color-teal-dark)] font-medium">View all</Link>
          </div>
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs border-b border-[var(--color-line)]">
                  <th className="pb-2 font-medium">Order</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o._id} className="border-b border-[var(--color-line)] last:border-0">
                    <td className="py-2.5">
                      <Link to={`/admin/orders/${o._id}`} className="font-mono-tag text-xs hover:underline">{o.orderNumber}</Link>
                      <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
                    </td>
                    <td className="py-2.5 text-xs">{o.user?.name || '—'}</td>
                    <td className="py-2.5"><OrderStatusBadge status={o.status} /></td>
                    <td className="py-2.5 text-right font-mono-tag">{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-[var(--color-line)] rounded-xl bg-white p-5">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-[var(--color-amber-dark)]" /> Low Stock</h2>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-400">All products are well-stocked.</p>
          ) : (
            <ul className="space-y-2.5">
              {lowStockProducts.map((p) => (
                <li key={p._id} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{p.name}</span>
                  <span className="font-mono-tag text-xs bg-red-50 text-[var(--color-danger)] px-2 py-0.5 rounded">{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border border-[var(--color-line)] rounded-xl bg-white p-5">
        <h2 className="font-display font-semibold mb-4">Products by Category</h2>
        {categoryBreakdown.length === 0 ? (
          <p className="text-sm text-gray-400">No category data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.name}>
                {categoryBreakdown.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
