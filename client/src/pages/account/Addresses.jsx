import { useEffect, useState } from 'react';
import { MapPin, Plus, Pencil, Trash2, Star } from 'lucide-react';
import { authService } from '@/services';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { EmptyState, PageSpinner } from '@/components/ui/States';
import AddressForm from '@/components/checkout/AddressForm';

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    authService.listAddresses().then((res) => setAddresses(res.data.addresses)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSaved = (newAddresses) => {
    setAddresses(newAddresses);
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    try {
      const res = await authService.deleteAddress(deleteTarget._id);
      setAddresses(res.data.addresses);
      toast.success('Address deleted.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-semibold">Saved Addresses</h2>
        {!formOpen && (
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus size={15} /> Add Address
          </Button>
        )}
      </div>

      {formOpen && (
        <div className="border border-[var(--color-line)] rounded-xl bg-white p-5 mb-5">
          <AddressForm initial={editing} onSaved={handleSaved} onCancel={() => { setFormOpen(false); setEditing(null); }} />
        </div>
      )}

      {addresses.length === 0 && !formOpen ? (
        <EmptyState icon={MapPin} title="No saved addresses" description="Add an address to speed up checkout." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div key={a._id} className="border border-[var(--color-line)] rounded-xl bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-tag bg-[var(--color-paper-dim)] px-2 py-0.5 rounded">{a.label}</span>
                  {a.isDefault && <span className="text-xs flex items-center gap-0.5 text-[var(--color-amber-dark)]"><Star size={11} className="fill-current" /> Default</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(a); setFormOpen(true); }} aria-label="Edit address" className="text-gray-400 hover:text-[var(--color-ink)] p-1"><Pencil size={15} /></button>
                  <button onClick={() => setDeleteTarget(a)} aria-label="Delete address" className="text-gray-400 hover:text-[var(--color-danger)] p-1"><Trash2 size={15} /></button>
                </div>
              </div>
              <p className="text-sm font-medium mt-2">{a.fullName}</p>
              <p className="text-sm text-gray-600 mt-0.5">{a.addressLine1}, {a.addressLine2 ? `${a.addressLine2}, ` : ''}{a.city}, {a.state} {a.postalCode}</p>
              <p className="text-sm text-gray-400 mt-0.5">{a.country}</p>
              <p className="text-sm text-gray-400">{a.phone}</p>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this address?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
