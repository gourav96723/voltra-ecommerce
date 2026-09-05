import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Users as UsersIcon } from 'lucide-react';
import { adminService } from '@/services';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, PageSpinner, ErrorState } from '@/components/ui/States';
import { formatDate } from '@/utils/format';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    setError(null);
    adminService
      .getUsers({ search, page, limit: 15 })
      .then((res) => {
        setUsers(res.data.users);
        setTotalPages(res.totalPages);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const toggleStatus = async (user) => {
    try {
      await adminService.setUserActiveStatus(user._id, !user.isActive);
      toast.success(`${user.name} ${user.isActive ? 'deactivated' : 'activated'}.`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Users</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-5 max-w-sm">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" className="pl-9" />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <PageSpinner />
      ) : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" />
      ) : (
        <div className="border border-[var(--color-line)] rounded-xl bg-white overflow-hidden">
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-paper-dim)]">
                <tr className="text-left text-xs text-gray-500">
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Joined</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-t border-[var(--color-line)]">
                    <td className="p-3"><Link to={`/admin/users/${u._id}`} className="font-medium hover:underline">{u.name}</Link></td>
                    <td className="p-3 text-gray-500">{u.email}</td>
                    <td className="p-3 text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="p-3">{u.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Deactivated</Badge>}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => toggleStatus(u)} className="text-xs font-medium text-[var(--color-teal-dark)]">
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-[var(--color-line)] disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={16} /></button>
          <span className="text-sm font-mono-tag">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-[var(--color-line)] disabled:opacity-40" aria-label="Next page"><ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
}
