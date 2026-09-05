const { z } = require('zod');

const specSchema = z.object({ key: z.string().trim().min(1), value: z.string().trim().min(1) });
const imageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().optional(),
  alt: z.string().optional(),
});

const createProductSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().min(10),
  shortDescription: z.string().trim().max(220).optional(),
  price: z.number().positive(),
  discountPercentage: z.number().min(0).max(90).optional(),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().trim().min(1),
  sku: z.string().trim().min(1),
  stock: z.number().int().min(0),
  images: z.array(imageSchema).min(1, 'At least one image is required'),
  specifications: z.array(specSchema).optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
});

const updateProductSchema = createProductSchema.partial();

const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().optional(),
  image: z
    .object({ url: z.string().url().optional(), publicId: z.string().optional() })
    .optional(),
  isActive: z.boolean().optional(),
});

const updateCategorySchema = createCategorySchema.partial();

module.exports = {
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
};
