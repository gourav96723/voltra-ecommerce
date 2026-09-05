import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

const VARIANTS = {
  primary: 'bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink-soft)]',
  accent: 'bg-[var(--color-teal)] text-white hover:bg-[var(--color-teal-dark)]',
  outline: 'border border-[var(--color-ink)] text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white',
  ghost: 'text-[var(--color-ink)] hover:bg-[var(--color-paper-dim)]',
  danger: 'bg-[var(--color-danger)] text-white hover:bg-red-700',
};

const SIZES = {
  sm: 'text-sm px-3 py-1.5 rounded-md',
  md: 'text-sm px-4 py-2.5 rounded-lg',
  lg: 'text-base px-6 py-3 rounded-lg',
};

const Button = forwardRef(
  ({ variant = 'primary', size = 'md', loading, disabled, className, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

export default Button;
