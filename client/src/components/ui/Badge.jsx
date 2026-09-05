import clsx from 'clsx';
import { formatPrice } from '@/utils/format';

export function Badge({ children, tone = 'default', className }) {
  const tones = {
    default: 'bg-[var(--color-paper-dim)] text-[var(--color-ink)]',
    amber: 'bg-amber-50 text-[var(--color-amber-dark)]',
    danger: 'bg-red-50 text-[var(--color-danger)]',
    success: 'bg-emerald-50 text-[var(--color-success)]',
    teal: 'bg-teal-50 text-[var(--color-teal-dark)]',
  };
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold font-mono-tag', tones[tone], className)}>
      {children}
    </span>
  );
}

export function PriceTag({ price, discountPercentage = 0, size = 'md' }) {
  const discounted = discountPercentage ? Math.round(price * (1 - discountPercentage / 100)) : price;
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl' };
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={clsx('font-mono-tag font-semibold text-[var(--color-ink)]', sizes[size])}>
        {formatPrice(discounted)}
      </span>
      {discountPercentage > 0 && (
        <>
          <span className="text-xs text-gray-400 line-through font-mono-tag">{formatPrice(price)}</span>
          <Badge tone="amber">{discountPercentage}% OFF</Badge>
        </>
      )}
    </div>
  );
}
