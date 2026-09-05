import { forwardRef } from 'react';
import clsx from 'clsx';

export const Input = forwardRef(({ error, className, ...props }, ref) => (
  <input
    ref={ref}
    className={clsx(
      'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-gray-400',
      'focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent',
      error ? 'border-[var(--color-danger)]' : 'border-[var(--color-line)]',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Label = ({ children, htmlFor, required }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
    {children} {required && <span className="text-[var(--color-danger)]">*</span>}
  </label>
);

export const FieldError = ({ children }) =>
  children ? <p className="mt-1 text-xs text-[var(--color-danger)]">{children}</p> : null;

export const Field = ({ label, htmlFor, required, error, children }) => (
  <div>
    {label && (
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
    )}
    {children}
    <FieldError>{error}</FieldError>
  </div>
);
