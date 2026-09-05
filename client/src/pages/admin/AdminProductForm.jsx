import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Plus, X, UploadCloud, ArrowLeft, Loader2 } from 'lucide-react';
import { productService, categoryService, uploadService } from '@/services';
import { useToast } from '@/context/ToastContext';
import { Field, Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/States';

const schema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().trim().min(1, 'Brand is required'),
  sku: z.string().trim().min(1, 'SKU is required'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  discountPercentage: z.coerce.number().min(0).max(90).default(0),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  shortDescription: z.string().trim().max(220).optional().or(z.literal('')),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  images: z.array(z.object({ url: z.string().url('Add at least one valid image'), publicId: z.string().optional(), alt: z.string().optional() })).min(1, 'At least one image is required'),
  specifications: z.array(z.object({ key: z.string().trim().min(1), value: z.string().trim().min(1) })).optional(),
  tags: z.array(z.object({ value: z.string().trim().min(1) })).optional(),
});

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [uploading, setUploading] = useState(false);

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      images: [], specifications: [{ key: 'Warranty', value: '1 Year' }], tags: [], discountPercentage: 0, stock: 0, active: true, featured: false,
    },
  });

  const imagesArray = useFieldArray({ control, name: 'images' });
  const specsArray = useFieldArray({ control, name: 'specifications' });
  const tagsArray = useFieldArray({ control, name: 'tags' });

  useEffect(() => {
    categoryService.getAllCategoriesAdmin().then((res) => setCategories(res.data.categories));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    productService.getProductByIdAdmin(id).then((res) => {
      const p = res.data.product;
      reset({
        ...p,
        category: p.category?._id || p.category,
        tags: (p.tags || []).map((t) => ({ value: t })),
      });
      setLoading(false);
    });
  }, [id, isEdit, reset]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadService.uploadImage(file);
      imagesArray.append({ url: res.data.url, publicId: res.data.publicId, alt: '' });
      toast.success('Image uploaded.');
    } catch (err) {
      if (err.status === 503) toast.error('Image upload is not configured. Set Cloudinary credentials, or paste an image URL below instead.');
      else toast.error(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      tags: (data.tags || []).map((t) => t.value),
    };
    try {
      if (isEdit) {
        await productService.updateProduct(id, payload);
        toast.success('Product updated.');
      } else {
        await productService.createProduct(payload);
        toast.success('Product created.');
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-3xl">
      <Link to="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[var(--color-ink)] mb-4">
        <ArrowLeft size={15} /> Back to Products
      </Link>
      <h1 className="font-display text-2xl font-bold mb-6">{isEdit ? 'Edit Product' : 'Add Product'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="border border-[var(--color-line)] rounded-xl bg-white p-5 space-y-4">
          <h2 className="font-display font-semibold">Basic Information</h2>
          <Field label="Product Name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" {...register('name')} error={errors.name} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Category" htmlFor="category" required error={errors.category?.message}>
              <select id="category" {...register('category')} className="w-full border border-[var(--color-line)] rounded-lg px-3.5 py-2.5 text-sm bg-white">
                <option value="">Select category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Brand" htmlFor="brand" required error={errors.brand?.message}>
              <Input id="brand" {...register('brand')} error={errors.brand} />
            </Field>
          </div>
          <Field label="SKU" htmlFor="sku" required error={errors.sku?.message}>
            <Input id="sku" {...register('sku')} error={errors.sku} disabled={isEdit} className={isEdit ? 'bg-[var(--color-paper-dim)]' : ''} />
          </Field>
          <Field label="Short Description" htmlFor="shortDescription" error={errors.shortDescription?.message}>
            <Input id="shortDescription" {...register('shortDescription')} error={errors.shortDescription} />
          </Field>
          <Field label="Description" htmlFor="description" required error={errors.description?.message}>
            <textarea id="description" rows={4} {...register('description')} className="w-full border border-[var(--color-line)] rounded-lg px-3.5 py-2.5 text-sm" />
          </Field>
        </div>

        <div className="border border-[var(--color-line)] rounded-xl bg-white p-5 space-y-4">
          <h2 className="font-display font-semibold">Pricing &amp; Inventory</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Price (₹)" htmlFor="price" required error={errors.price?.message}>
              <Input id="price" type="number" step="0.01" {...register('price')} error={errors.price} />
            </Field>
            <Field label="Discount %" htmlFor="discountPercentage" error={errors.discountPercentage?.message}>
              <Input id="discountPercentage" type="number" {...register('discountPercentage')} error={errors.discountPercentage} />
            </Field>
            <Field label="Stock" htmlFor="stock" required error={errors.stock?.message}>
              <Input id="stock" type="number" {...register('stock')} error={errors.stock} />
            </Field>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('featured')} /> Featured</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('active')} /> Active (visible in store)</label>
          </div>
        </div>

        <div className="border border-[var(--color-line)] rounded-xl bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold">Images</h2>
            <label className="inline-flex items-center gap-1.5 text-sm text-[var(--color-teal-dark)] font-medium cursor-pointer">
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
              Upload Image
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
          {errors.images && <p className="text-xs text-[var(--color-danger)]">{errors.images.message || errors.images.root?.message}</p>}
          <div className="flex flex-wrap gap-3">
            {imagesArray.fields.map((field, i) => (
              <div key={field.id} className="relative w-20 h-20">
                <img src={field.url} alt="" className="w-full h-full object-cover rounded-lg border border-[var(--color-line)]" />
                <button type="button" onClick={() => imagesArray.remove(i)} aria-label="Remove image" className="absolute -top-1.5 -right-1.5 bg-white border border-[var(--color-line)] rounded-full p-0.5">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Or paste an image URL and press Add" id="manual-image-url" />
            <Button type="button" variant="outline" size="sm" onClick={() => {
              const input = document.getElementById('manual-image-url');
              if (input.value.trim()) {
                imagesArray.append({ url: input.value.trim(), publicId: '', alt: '' });
                input.value = '';
              }
            }}>Add</Button>
          </div>
        </div>

        <div className="border border-[var(--color-line)] rounded-xl bg-white p-5 space-y-3">
          <h2 className="font-display font-semibold">Specifications</h2>
          {specsArray.fields.map((field, i) => (
            <div key={field.id} className="flex gap-2">
              <Input placeholder="Key (e.g. RAM)" {...register(`specifications.${i}.key`)} />
              <Input placeholder="Value (e.g. 16GB)" {...register(`specifications.${i}.value`)} />
              <button type="button" onClick={() => specsArray.remove(i)} aria-label="Remove spec" className="p-2 text-gray-400 hover:text-[var(--color-danger)]"><X size={16} /></button>
            </div>
          ))}
          <Button type="button" size="sm" variant="ghost" onClick={() => specsArray.append({ key: '', value: '' })}><Plus size={14} /> Add Specification</Button>
        </div>

        <div className="border border-[var(--color-line)] rounded-xl bg-white p-5 space-y-3">
          <h2 className="font-display font-semibold">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {tagsArray.fields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-1 bg-[var(--color-paper-dim)] rounded-full pl-3 pr-1 py-1">
                <input {...register(`tags.${i}.value`)} className="bg-transparent text-xs w-20 focus:outline-none" />
                <button type="button" onClick={() => tagsArray.remove(i)} aria-label="Remove tag" className="p-1"><X size={12} /></button>
              </div>
            ))}
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={() => tagsArray.append({ value: '' })}><Plus size={14} /> Add Tag</Button>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={isSubmitting}>{isEdit ? 'Save Changes' : 'Create Product'}</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/admin/products')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
