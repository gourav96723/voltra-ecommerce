import { Star } from 'lucide-react';
import clsx from 'clsx';

export default function StarRating({ rating = 0, count, size = 14, showCount = true }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={clsx(i <= Math.round(rating) ? 'fill-[var(--color-amber)] text-[var(--color-amber)]' : 'text-gray-300')}
          />
        ))}
      </div>
      {showCount && (
        <span className="text-xs text-gray-500 font-mono-tag">
          {rating > 0 ? rating.toFixed(1) : 'New'}
          {typeof count === 'number' ? ` (${count})` : ''}
        </span>
      )}
    </div>
  );
}
