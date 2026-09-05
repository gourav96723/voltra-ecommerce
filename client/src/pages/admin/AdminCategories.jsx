import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { categoryService } from '@/services';
import { useToast } from '@/context/ToastContext';
import { Field, Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, PageSpinner } from '@/components/ui/States';

const schema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  description: z.string().trim().optional().or(z.literal('')),
});

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const load = () => {
    setLoading(true);
    categoryService.getAllCategoriesAdmin().then((res) => setCategories(res.data.categories)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setEditing(null); reset({ name: '', description: '' }); setFormOpen(true); };
  const openEdit = (c) => { setEditing(c); reset({ name: c.name, description: c.description }); setFormOpen(true); };

  const onSubmit = async (data) => {
    try {
      if (editing) {
        await categoryService.updateCategory(editing._id, data);
        toast.success('Category updated.');
      } else {
        await categoryService.createCategory(data);
        toast.success('Category created.');
      }
      setFormOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleActive = async (c) => {
    try {
      await categoryService.updateCategory(c._id, { isActive: !c.isActive });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await categoryService.deleteCategory(deleteTarget._id);
      toast.success('Category deactivated.');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Categories</h1>
        <Button onClick={openCreate}><Plus size={16} /> Add Category</Button>
      </div>

      {formOpen && (
        <div className="border border-[var(--color-line)] rounded-xl bg-white p-5 mb-6 max-w-lg">
          <h2 className="font-display font-semibold mb-4">{editing ? 'Edit Category' : 'New Category'}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Name" htmlFor="name" required error={errors.name?.message}>
              <Input id="name" {...register('name')} error={errors.name} />
            </Field>
            <Field label="Description" htmlFor="description" error={errors.description?.message}>
              <Input id="description" {...register('description')} error={errors.description} />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={isSubmitting}>{editing ? 'Save' : 'Create'}</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <PageSpinner />
      ) : categories.length === 0 ? (
        <EmptyState icon={Tag} title="No categories yet" action={<Button onClick={openCreate}>Add Category</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div key={c._id} className="border border-[var(--color-line)] rounded-xl bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.description || 'No description'}</p>
                </div>
                {c.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Inactive</Badge>}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(c)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--color-ink)]"><Pencil size={13} /> Edit</button>
                <button onClick={() => toggleActive(c)} className="text-xs text-gray-500 hover:text-[var(--color-ink)]">{c.isActive ? 'Deactivate' : 'Activate'}</button>
                <button onClick={() => setDeleteTarget(c)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--color-danger)] ml-auto"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this category?"
        description="Categories with active products cannot be deleted — deactivate the products first."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
