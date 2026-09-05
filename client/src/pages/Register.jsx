import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Field, Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { BRAND_NAME } from '@/constants';

const schema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().email('Enter a valid email address'),
    phone: z.string().trim().min(7, 'Enter a valid phone number').optional().or(z.literal('')),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export default function Register() {
  const { register: registerUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await registerUser(data);
      toast.success(`Welcome to ${BRAND_NAME}!`);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="font-display font-bold text-2xl">{BRAND_NAME}</Link>
          <h1 className="font-display text-xl font-semibold mt-4">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Join to track orders and save favorites.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Full Name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" autoComplete="name" {...register('name')} error={errors.name} />
          </Field>
          <Field label="Email" htmlFor="email" required error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register('email')} error={errors.email} />
          </Field>
          <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
            <Input id="phone" type="tel" autoComplete="tel" {...register('phone')} error={errors.phone} />
          </Field>
          <Field label="Password" htmlFor="password" required error={errors.password?.message}>
            <div className="relative">
              <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" {...register('password')} error={errors.password} className="pr-10" />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <Field label="Confirm Password" htmlFor="confirmPassword" required error={errors.confirmPassword?.message}>
            <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" {...register('confirmPassword')} error={errors.confirmPassword} />
          </Field>
          <Button type="submit" loading={isSubmitting} className="w-full">Create Account</Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-[var(--color-teal-dark)] font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
