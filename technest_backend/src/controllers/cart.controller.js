const { prisma } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/ApiResponse');

const cartInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          variants: true,
          status: true,
        },
      },
    },
  },
};

const getOrCreateCart = async (userId, sessionId) => {
  if (!userId && !sessionId) {
    throw new ApiError(400, 'Cart session is required');
  }

  const where = userId ? { userId } : { sessionId };
  const existing = await prisma.cart.findFirst({ where });
  if (existing) return existing;

  return prisma.cart.create({ data: where });
};

exports.getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user?.id, req.headers['x-session-id']);
  const fullCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: cartInclude,
  });

  success(res, 200, { cart: fullCart });
});

exports.addItem = asyncHandler(async (req, res) => {
  const { productId, variantSku, quantity } = req.validated.body;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  });
  if (!product) throw new ApiError(404, 'Product not found');

  const variant = product.variants.find((item) => item.sku === variantSku);
  if (!variant) throw new ApiError(400, 'Variant not found');

  const cart = await getOrCreateCart(req.user?.id, req.headers['x-session-id']);

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_variantSku: { cartId: cart.id, variantSku } },
  });
  const requestedTotal = (existingItem?.quantity ?? 0) + quantity;
  if (variant.stock < requestedTotal) {
    throw new ApiError(400, 'Insufficient stock');
  }

  await prisma.cartItem.upsert({
    where: { cartId_variantSku: { cartId: cart.id, variantSku } },
    create: {
      cartId: cart.id,
      productId,
      variantId: variant.id,
      variantSku,
      name: product.name,
      image: variant.images?.[0] ?? null,
      quantity,
      price: variant.price,
    },
    update: { quantity: { increment: quantity } },
  });

  const fullCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: cartInclude,
  });

  success(res, 200, { cart: fullCart }, 'Added to cart');
});

exports.applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.validated.body;
  const coupon = await prisma.coupon.findFirst({
    where: { code: code.toUpperCase(), isActive: true },
  });
  if (!coupon) throw new ApiError(400, 'Invalid coupon code');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new ApiError(400, 'Coupon expired');
  }
  if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) {
    throw new ApiError(400, 'Coupon usage limit reached');
  }

  const cart = await getOrCreateCart(req.user?.id, req.headers['x-session-id']);
  const items = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (subtotal < coupon.minOrder) {
    throw new ApiError(400, `Minimum order $${coupon.minOrder} required`);
  }

  const discount =
    coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  const cappedDiscount = Math.min(discount, subtotal);

  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponCode: coupon.code, discount: cappedDiscount },
  });

  success(
    res,
    200,
    { discount: cappedDiscount, couponCode: coupon.code },
    'Coupon applied'
  );
});
