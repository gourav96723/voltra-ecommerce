import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '@/services';
import { useToast } from '@/context/ToastContext';
import { Field, Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const schema = z.object({
  label: z.enum(['Home', 'Work', 'Other']).default('Home'),
  fullName: z.string().trim().min(2, 'Enter a full name'),
  phone: z.string().trim().min(7, 'Enter a valid phone number'),
  addressLine1: z.string().trim().min(3, 'Enter your address'),
  addressLine2: z.string().trim().optional().or(z.literal('')),
  city: z.string().trim().min(2, 'Enter a city'),
  state: z.string().trim().min(2, 'Enter a state'),
  postalCode: z.string().trim().min(3, 'Enter a postal code'),
  country: z.string().trim().min(2).default('India'),
  isDefault: z.boolean().optional(),
});

export default function AddressForm({ initial, onSaved, onCancel }) {
  const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initial || { label: 'Home', country: 'India' },
  });

  const onSubmit = async (data) => {
    try {
      let res;
      if (initial?._id) {
        res = await authService.updateAddress(initial._id, data);
        toast.success('Address updated.');
        onSaved(res.data.addresses, initial._id);
      } else {
        res = await authService.addAddress(data);
        toast.success('Address added.');
        const added = res.data.addresses[res.data.addresses.length - 1];
        onSaved(res.data.addresses, added._id);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Label" htmlFor="label">
          <select id="label" {...register('label')} className="w-full border border-[var(--color-line)] rounded-lg px-3.5 py-2.5 text-sm bg-white">
            <option>Home</option>
            <option>Work</option>
            <option>Other</option>
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Full Name" htmlFor="fullName" required error={errors.fullName?.message}>
            <Input id="fullName" {...register('fullName')} error={errors.fullName} />
          </Field>
        </div>
      </div>
      <Field label="Phone" htmlFor="phone" required error={errors.phone?.message}>
        <Input id="phone" type="tel" {...register('phone')} error={errors.phone} />
      </Field>
      <Field label="Address Line 1" htmlFor="addressLine1" required error={errors.addressLine1?.message}>
        <Input id="addressLine1" {...register('addressLine1')} error={errors.addressLine1} />
      </Field>
      <Field label="Address Line 2" htmlFor="addressLine2" error={errors.addressLine2?.message}>
        <Input id="addressLine2" {...register('addressLine2')} error={errors.addressLine2} />
      </Field>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="City" htmlFor="city" required error={errors.city?.message}>
          <Input id="city" {...register('city')} error={errors.city} />
        </Field>
        <Field label="State" htmlFor="state" required error={errors.state?.message}>
          <Input id="state" {...register('state')} error={errors.state} />
        </Field>
        <Field label="Postal Code" htmlFor="postalCode" required error={errors.postalCode?.message}>
          <Input id="postalCode" {...register('postalCode')} error={errors.postalCode} />
        </Field>
      </div>
      <Field label="Country" htmlFor="country" required error={errors.country?.message}>
        <Input id="country" {...register('country')} error={errors.country} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('isDefault')} /> Set as default address
      </label>
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" loading={isSubmitting}>{initial?._id ? 'Save Changes' : 'Save Address'}</Button>
        {onCancel && <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
