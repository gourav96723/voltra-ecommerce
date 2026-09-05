import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '@/services';
import { useToast } from '@/context/ToastContext';
import { Field, Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, { message: 'Passwords do not match', path: ['confirmNewPassword'] });

export default function ChangePassword() {
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await authService.changePassword(data);
      toast.success('Password changed successfully.');
      reset();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="border border-[var(--color-line)] rounded-xl bg-white p-6 max-w-lg">
      <h2 className="font-display text-lg font-semibold mb-5">Change Password</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Current Password" htmlFor="currentPassword" required error={errors.currentPassword?.message}>
          <Input id="currentPassword" type="password" autoComplete="current-password" {...register('currentPassword')} error={errors.currentPassword} />
        </Field>
        <Field label="New Password" htmlFor="newPassword" required error={errors.newPassword?.message}>
          <Input id="newPassword" type="password" autoComplete="new-password" {...register('newPassword')} error={errors.newPassword} />
        </Field>
        <Field label="Confirm New Password" htmlFor="confirmNewPassword" required error={errors.confirmNewPassword?.message}>
          <Input id="confirmNewPassword" type="password" autoComplete="new-password" {...register('confirmNewPassword')} error={errors.confirmNewPassword} />
        </Field>
        <Button type="submit" loading={isSubmitting}>Update Password</Button>
      </form>
    </div>
  );
}
