export const BRAND_NAME = 'Voltra';
export const BRAND_TAGLINE = 'Tech that earns its shelf space.';

export const ORDER_STATUS_FLOW = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

export const ORDER_STATUS_COLORS = {
  Pending: 'bg-gray-100 text-gray-700',
  Confirmed: 'bg-blue-50 text-blue-700',
  Processing: 'bg-amber-50 text-amber-700',
  Shipped: 'bg-indigo-50 text-indigo-700',
  'Out for Delivery': 'bg-purple-50 text-purple-700',
  Delivered: 'bg-emerald-50 text-emerald-700',
  Cancelled: 'bg-red-50 text-red-700',
};

export const SORT_OPTIONS = [
  { value: '', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Best Rated' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'discount-desc', label: 'Highest Discount' },
];
