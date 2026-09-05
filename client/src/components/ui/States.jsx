import { Loader2, AlertTriangle, PackageOpen } from 'lucide-react';
import Button from './Button';

export function Spinner({ size = 24, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-[var(--color-teal)] ${className}`} />;
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner size={32} />
    </div>
  );
}

export function EmptyState({ icon: Icon = PackageOpen, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-[var(--color-paper-dim)] flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-400" />
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle size={28} className="text-[var(--color-danger)]" />
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">Something went wrong</h3>
      <p className="text-sm text-gray-500 mt-1.5 max-w-sm">{message || 'Please try again.'}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-line)] overflow-hidden bg-white">
      <div className="skeleton aspect-square" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
      </div>
    </div>
  );
}

export function LineSkeleton({ className = '' }) {
  return <div className={`skeleton rounded ${className}`} />;
}
