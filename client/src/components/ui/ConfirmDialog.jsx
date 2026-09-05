import { useEffect, useRef } from 'react';
import Button from './Button';

export default function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) {
  const ref = useRef(null);

  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <h2 id="confirm-dialog-title" className="font-display text-lg font-semibold text-[var(--color-ink)]">
          {title}
        </h2>
        {description && <p className="text-sm text-gray-500 mt-2">{description}</p>}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button ref={ref} variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
