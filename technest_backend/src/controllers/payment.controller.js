const { Prisma } = require('@prisma/client');
const { prisma } = require('../config/db');
const { createPaymentIntent } = require('../services/stripe.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/ApiResponse');

const SHIPPING_COSTS = { standard: 5.99, express: 12.99, overnight: 24.99 };
const FREE_SHIPPING_THRESHOLD = 50;

const roundMoney = (value) => Math.round(value * 100) / 100;

const resolveOrderItems = async (rawItems) => {
  if (!rawItems?.length) return [];

  const productIds = [...new Set(rawItems.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));

  return rawItems.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new ApiError(400, 'One of the products no longer exists');

    const variant = product.variants.find((entry) => entry.sku === item.variantSku);
    if (!variant) {
      throw new ApiError(400, `Variant ${item.variantSku} is no longer available`);
    }
    if (variant.stock < item.quantity) {
      throw new ApiError(400, `Not enough stock for ${product.name} (${variant.sku})`);
    }

    return {
      productId: product.id,
      variantSku: variant.sku,
      name: product.name,
      image: variant.images?.[0] ?? null,
      slug: product.slug,
      variantColor: variant.color,
      variantStorage: variant.storage,
      price: variant.price,
      quantity: item.quantity,
    };
  });
};

const calculateDiscount = async (couponCode, subtotal) => {
  if (!couponCode) return { coupon: null, discount: 0 };

  const coupon = await prisma.coupon.findFirst({
    where: { code: couponCode.toUpperCase(), isActive: true },
  });
  if (!coupon) throw new ApiError(400, 'Invalid coupon code');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new ApiError(400, 'Coupon expired');
  }
  if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) {
    throw new ApiError(400, 'Coupon usage limit reached');
  }
  if (subtotal < coupon.minOrder) {
    throw new ApiError(400, `Minimum order $${coupon.minOrder} required`);
  }

  const rawDiscount =
    coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;

  return {
    coupon,
    discount: roundMoney(Math.min(rawDiscount, subtotal)),
  };
};

exports.createIntent = asyncHandler(async (req, res) => {
  const { shippingMethod, items, couponCode, shippingAddress } = req.validated.body;

  let resolvedItems = await resolveOrderItems(items);

  // Fallback for clients that keep the cart only in the database.
  if (resolvedItems.length === 0) {
    const cart = await prisma.cart.findFirst({
      where: { userId: req.user.id },
      include: { items: true },
    });

    resolvedItems = await resolveOrderItems(
      cart?.items.map((item) => ({
        productId: item.productId,
        variantSku: item.variantSku,
        quantity: item.quantity,
      })) ?? []
    );
  }

  if (resolvedItems.length === 0) throw new ApiError(400, 'Cart is empty');

  const subtotal = roundMoney(
    resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  const { coupon, discount } = await calculateDiscount(couponCode, subtotal);
  const shippingCost =
    subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COSTS[shippingMethod] ?? 5.99;
  const total = roundMoney(subtotal - discount + shippingCost);

  if (total <= 0) throw new ApiError(400, 'Order total must be greater than zero');

  const hasAddress =
    shippingAddress && Object.keys(shippingAddress).length > 0;

  const order = await prisma.order.create({
    data: {
      userId: req.user.id,
      status: 'pending',
      subtotal,
      discount,
      shippingCost,
      total,
      shippingMethod,
      couponCode: coupon?.code ?? null,
      shippingAddress: hasAddress ? shippingAddress : Prisma.DbNull,
      items: { create: resolvedItems },
      statusHistory: { create: { status: 'pending', note: 'Order created' } },
    },
    include: { items: true },
  });

  let intent;
  try {
    intent = await createPaymentIntent(total, {
      orderId: order.id,
      userId: req.user.id,
    });
  } catch (err) {
    await prisma.order.delete({ where: { id: order.id } }).catch(() => {});
    throw err;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: intent.id },
  });

  success(res, 200, {
    clientSecret: intent.client_secret,
    orderId: order.id,
    total,
  });
});
