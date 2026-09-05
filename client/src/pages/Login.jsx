import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Field, Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { BRAND_NAME } from '@/constants';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await login(data);
      toast.success('Welcome back!');
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="font-display font-bold text-2xl">{BRAND_NAME}</Link>
          <h1 className="font-display text-xl font-semibold mt-4">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Log in to continue shopping.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Email" htmlFor="email" required error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register('email')} error={errors.email} />
          </Field>
          <Field label="Password" htmlFor="password" required error={errors.password?.message}>
            <div className="relative">
              <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" {...register('password')} error={errors.password} className="pr-10" />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <Button type="submit" loading={isSubmitting} className="w-full">Log In</Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account? <Link to="/register" className="text-[var(--color-teal-dark)] font-medium">Register</Link>
        </p>

        <div className="mt-8 bg-[var(--color-paper-dim)] rounded-lg p-4 text-xs text-gray-500">
          <p className="font-semibold text-[var(--color-ink)] mb-1">Demo credentials</p>
          <p>Customer: customer@demo.com / Customer@1234</p>
          <p>Admin: admin@demo.com / Admin@1234</p>
        </div>
      </div>
    </div>
  );
}
