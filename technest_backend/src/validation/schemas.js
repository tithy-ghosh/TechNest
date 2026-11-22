const { z } = require('zod');

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(8).max(72);
const personName = z.string().trim().min(2).max(80);
const id = z.string().trim().min(1);
const token = z.string().trim().min(1).max(256);

const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);

const queryString = (max = 200) =>
  z.preprocess(
    (value) => (Array.isArray(value) ? value.join(',') : value),
    z.string().trim().max(max).optional()
  );

const optionalDate = z.preprocess(
  (value) => (value === '' || value == null ? null : value),
  z.coerce.date().nullable()
);

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
];

const PRODUCT_STATUSES = ['active', 'draft', 'archived'];
const SHIPPING_METHODS = ['standard', 'express', 'overnight'];

// ---------- auth ----------
const registerSchema = z.object({ name: personName, email, password });
const loginSchema = z.object({ email, password: z.string().min(1).max(72) });
const verifyEmailSchema = z.object({ token });
const forgotPasswordSchema = z.object({ email });
const resetPasswordSchema = z.object({ token, password });

// ---------- products ----------
const variantSchema = z.object({
  sku: z.string().trim().min(1).max(80),
  color: z.string().trim().max(60).optional().nullable(),
  storage: z.string().trim().max(60).optional().nullable(),
  price: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative(),
  images: z.array(z.string().trim().min(1)).default([]),
});

const specSchema = z.object({
  key: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(500),
});

const productBaseShape = {
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().min(10).max(5000),
  brand: z.string().trim().min(1).max(80),
  category: z.string().trim().min(1).max(80),
  subCategory: z.string().trim().max(80).optional().nullable(),
  tags: z.array(z.string().trim().min(1)),
  basePrice: z.coerce.number().nonnegative(),
  comparePrice: z.coerce.number().nonnegative().optional().nullable(),
  variants: z.array(variantSchema).min(1),
  specs: z.array(specSchema),
  isFeatured: z.boolean(),
  status: z.enum(PRODUCT_STATUSES),
};

const productCreateSchema = z.object({
  ...productBaseShape,
  tags: z.array(z.string().trim().min(1)).default([]),
  specs: z.array(specSchema).default([]),
  isFeatured: z.boolean().default(false),
  status: z.enum(PRODUCT_STATUSES).default('draft'),
});

const productUpdateSchema = z.object(productBaseShape).partial();

const productQuerySchema = z.object({
  search: queryString(100),
  category: queryString(80),
  brand: queryString(200),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'rating', 'bestseller']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

const idParamSchema = z.object({ id });
const slugParamSchema = z.object({ slug: z.string().trim().min(1).max(200) });
const reviewParamsSchema = z.object({
  slug: z.string().trim().min(1).max(200),
  reviewId: id,
});

// ---------- cart ----------
const addItemSchema = z.object({
  productId: id,
  variantSku: z.string().trim().min(1).max(80),
  quantity: z.coerce.number().int().min(1).max(99),
});

const applyCouponSchema = z.object({
  code: z.string().trim().min(1).max(50),
});

// ---------- orders ----------
const orderQuerySchema = z.object({
  page,
  limit,
  status: z.enum(ORDER_STATUSES).optional(),
});

const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

// ---------- coupons ----------
const couponBaseShape = {
  code: z.string().trim().min(1).max(50).transform((value) => value.toUpperCase()),
  type: z.enum(['percent', 'fixed']),
  value: z.coerce.number().positive(),
  minOrder: z.coerce.number().nonnegative(),
  maxUses: z.coerce.number().int().nonnegative().optional().nullable(),
  expiresAt: optionalDate.optional(),
  isActive: z.boolean(),
};

const couponCreateSchema = z
  .object({
    ...couponBaseShape,
    minOrder: z.coerce.number().nonnegative().default(0),
    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'percent' && data.value > 100) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'Percentage discount cannot exceed 100',
      });
    }
  });

const couponUpdateSchema = z.object(couponBaseShape).partial().superRefine((data, ctx) => {
  if (data.type === 'percent' && data.value != null && data.value > 100) {
    ctx.addIssue({
      code: 'custom',
      path: ['value'],
      message: 'Percentage discount cannot exceed 100',
    });
  }
});

const validateCouponSchema = z.object({
  code: z.string().trim().min(1).max(50),
  orderTotal: z.coerce.number().nonnegative(),
});

// ---------- reviews ----------
const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  comment: z.string().trim().max(2000).optional(),
  body: z.string().trim().max(2000).optional(),
});

// ---------- payments ----------
const paymentItemSchema = z.object({
  productId: id,
  variantSku: z.string().trim().min(1).max(80),
  quantity: z.coerce.number().int().min(1).max(99),
});

const shippingAddressSchema = z
  .object({
    line1: z.string().trim().max(200).optional(),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    zip: z.string().trim().max(30).optional(),
    country: z.string().trim().max(100).optional(),
  })
  .partial();

const createIntentSchema = z.object({
  shippingMethod: z.enum(SHIPPING_METHODS),
  items: z.array(paymentItemSchema).max(100).optional(),
  couponCode: z.string().trim().max(50).optional().nullable(),
  shippingAddress: shippingAddressSchema.optional(),
});

// ---------- newsletter ----------
const subscribeSchema = z.object({
  email,
  name: z.string().trim().max(80).optional(),
});

const tokenQuerySchema = z.object({ token });

// ---------- chat ----------
const chatSchema = z.object({
  sessionId: z.string().trim().min(1).max(100),
  message: z.string().trim().min(1).max(2000),
  context: z.record(z.string(), z.any()).optional(),
});

// ---------- users ----------
const userQuerySchema = z.object({
  page,
  limit,
  search: queryString(100),
});

const productIdParamSchema = z.object({ productId: id });

// ---------- admin ----------
const revenueQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month']).default('day'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const topProductsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  productCreateSchema,
  productUpdateSchema,
  productQuerySchema,
  idParamSchema,
  slugParamSchema,
  reviewParamsSchema,
  addItemSchema,
  applyCouponSchema,
  orderQuerySchema,
  orderStatusSchema,
  couponCreateSchema,
  couponUpdateSchema,
  validateCouponSchema,
  createReviewSchema,
  createIntentSchema,
  subscribeSchema,
  tokenQuerySchema,
  chatSchema,
  userQuerySchema,
  productIdParamSchema,
  revenueQuerySchema,
  topProductsQuerySchema,
};
