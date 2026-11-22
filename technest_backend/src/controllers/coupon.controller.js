const { prisma } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/ApiResponse');

const roundMoney = (value) => Math.round(value * 100) / 100;

exports.getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  });

  success(res, 200, { coupons, total: coupons.length });
});

exports.createCoupon = asyncHandler(async (req, res) => {
  const { code, type, value, minOrder, maxUses, expiresAt, isActive } =
    req.validated.body;

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) throw new ApiError(409, 'Coupon code already exists');

  const coupon = await prisma.coupon.create({
    data: {
      code,
      type,
      value,
      minOrder,
      maxUses: maxUses ?? null,
      expiresAt: expiresAt ?? null,
      isActive,
    },
  });

  success(res, 201, { coupon }, 'Coupon created');
});

exports.updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;

  const existing = await prisma.coupon.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) throw new ApiError(404, 'Coupon not found');

  const data = { ...req.validated.body };
  if (data.code) {
    const duplicate = await prisma.coupon.findFirst({
      where: { code: data.code, NOT: { id } },
      select: { id: true },
    });
    if (duplicate) throw new ApiError(409, 'Coupon code already exists');
  }

  const coupon = await prisma.coupon.update({ where: { id }, data });
  success(res, 200, { coupon }, 'Coupon updated');
});

exports.deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;

  const existing = await prisma.coupon.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) throw new ApiError(404, 'Coupon not found');

  await prisma.coupon.delete({ where: { id } });
  success(res, 200, null, 'Coupon deleted');
});

exports.validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderTotal } = req.validated.body;

  const coupon = await prisma.coupon.findFirst({
    where: { code: code.toUpperCase(), isActive: true },
  });
  if (!coupon) throw new ApiError(404, 'Invalid or inactive coupon');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new ApiError(400, 'Coupon has expired');
  }
  if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) {
    throw new ApiError(400, 'Coupon usage limit reached');
  }
  if (orderTotal < coupon.minOrder) {
    throw new ApiError(400, `Minimum order amount is $${coupon.minOrder}`);
  }

  const discount = roundMoney(
    coupon.type === 'percent'
      ? (orderTotal * coupon.value) / 100
      : Math.min(coupon.value, orderTotal)
  );

  success(res, 200, { coupon, discount }, 'Coupon valid');
});
