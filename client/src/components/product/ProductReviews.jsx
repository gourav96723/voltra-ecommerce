import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star, Trash2 } from 'lucide-react';
import { reviewService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import { formatDate } from '@/utils/format';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  comment: z.string().trim().min(3, 'Comment must be at least 3 characters').max(1000),
});

export default function ProductReviews({ productId }) {
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [reviewReason, setReviewReason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoverStar, setHoverStar] = useState(0);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '' },
  });
  const currentRating = watch('rating');

  const load = () => {
    setLoading(true);
    Promise.all([
      reviewService.getProductReviews(productId),
      isAuthenticated ? reviewService.canReview(productId) : Promise.resolve(null),
    ])
      .then(([reviewsRes, canReviewRes]) => {
        setReviews(reviewsRes.data.reviews);
        setDistribution(reviewsRes.data.distribution);
        if (canReviewRes) {
          setCanReview(canReviewRes.data.canReview);
          setReviewReason(canReviewRes.data.reason);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [productId, isAuthenticated]);

  const onSubmit = async (data) => {
    try {
      await reviewService.createReview(productId, data);
      toast.success('Review submitted. Thank you!');
      reset({ rating: 0, comment: '' });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await reviewService.deleteReview(id);
      toast.success('Review deleted.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const maxCount = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-10">
      <div>
        <h3 className="font-display text-lg font-semibold mb-4">Rating Breakdown</h3>
        <div className="space-y-2">
          {[...distribution].reverse().map((d) => (
            <div key={d.star} className="flex items-center gap-2 text-sm">
              <span className="w-8 font-mono-tag">{d.star}★</span>
              <div className="flex-1 h-2 bg-[var(--color-paper-dim)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--color-amber)]" style={{ width: `${(d.count / maxCount) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-gray-500 font-mono-tag">{d.count}</span>
            </div>
          ))}
        </div>

        {isAuthenticated && canReview && (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-3">
            <h4 className="text-sm font-semibold">Write a Review</h4>
            <div className="flex gap-1" onMouseLeave={() => setHoverStar(0)}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-label={`Rate ${s} stars`}
                  onMouseEnter={() => setHoverStar(s)}
                  onClick={() => setValue('rating', s, { shouldValidate: true })}
                >
                  <Star size={22} className={(hoverStar || currentRating) >= s ? 'fill-[var(--color-amber)] text-[var(--color-amber)]' : 'text-gray-300'} />
                </button>
              ))}
            </div>
            {errors.rating && <p className="text-xs text-[var(--color-danger)]">{errors.rating.message}</p>}
            <textarea
              {...register('comment')}
              rows={3}
              placeholder="Share your experience with this product…"
              className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
            />
            {errors.comment && <p className="text-xs text-[var(--color-danger)]">{errors.comment.message}</p>}
            <Button type="submit" size="sm" loading={isSubmitting}>Submit Review</Button>
          </form>
        )}
        {isAuthenticated && !canReview && reviewReason === 'not-purchased-or-not-delivered' && (
          <p className="text-xs text-gray-500 mt-6">Only customers who received this product can leave a review.</p>
        )}
      </div>

      <div>
        <h3 className="font-display text-lg font-semibold mb-4">{reviews.length} Review{reviews.length === 1 ? '' : 's'}</h3>
        {loading ? (
          <p className="text-sm text-gray-500">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet. Be the first to share your experience.</p>
        ) : (
          <ul className="space-y-5">
            {reviews.map((r) => (
              <li key={r._id} className="border-b border-[var(--color-line)] pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{r.user?.name || 'Verified Buyer'}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={13} className={s <= r.rating ? 'fill-[var(--color-amber)] text-[var(--color-amber)]' : 'text-gray-300'} />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">{formatDate(r.createdAt)}</span>
                    </div>
                  </div>
                  {user?._id === r.user?._id && (
                    <button onClick={() => handleDelete(r._id)} aria-label="Delete your review" className="text-gray-400 hover:text-[var(--color-danger)]">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">{r.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
