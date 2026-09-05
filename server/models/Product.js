const mongoose = require('mongoose');
const slugify = require('slugify');

const specSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    alt: { type: String, default: '' },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: true },
    shortDescription: { type: String, trim: true, maxlength: 220 },
    price: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, min: 0, max: 90, default: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: { type: [imageSchema], validate: (v) => v.length > 0 },
    specifications: { type: [specSchema], default: [] },
    tags: { type: [String], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.virtual('discountPrice').get(function computeDiscountPrice() {
  if (!this.discountPercentage) return this.price;
  return Math.round(this.price * (1 - this.discountPercentage / 100) * 100) / 100;
});

productSchema.virtual('inStock').get(function computeInStock() {
  return this.stock > 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.pre('validate', function generateSlug(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = `${slugify(this.name || '', { lower: true, strict: true })}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
  }
  next();
});

productSchema.index({ name: 'text', brand: 'text', tags: 'text' });
productSchema.index({ category: 1, active: 1 });
productSchema.index({ price: 1 });
productSchema.index({ featured: 1 });

module.exports = mongoose.model('Product', productSchema);
