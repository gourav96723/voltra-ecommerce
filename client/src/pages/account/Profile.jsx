import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { authService } from '@/services';
import { Field, Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone: z.string().trim().min(7, 'Enter a valid phone number').optional().or(z.literal('')),
});

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: user.name, phone: user.phone || '' },
  });

  const onSubmit = async (data) => {
    try {
      const res = await authService.updateProfile(data);
      updateUser(res.data.user);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="border border-[var(--color-line)] rounded-xl bg-white p-6 max-w-lg">
      <h2 className="font-display text-lg font-semibold mb-5">Profile Information</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Full Name" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" {...register('name')} error={errors.name} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" value={user.email} disabled className="bg-[var(--color-paper-dim)] text-gray-500" />
        </Field>
        <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
          <Input id="phone" type="tel" {...register('phone')} error={errors.phone} />
        </Field>
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>Save Changes</Button>
      </form>
    </div>
  );
}
