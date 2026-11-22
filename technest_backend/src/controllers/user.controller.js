const { prisma } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/ApiResponse');

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
};

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      ...safeUserSelect,
      addresses: { orderBy: [{ isDefault: 'desc' }, { id: 'asc' }] },
      wishlist: { select: { id: true } },
    },
  });

  if (!user) throw new ApiError(404, 'User not found');

  success(
    res,
    200,
    {
      id: user.id,
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      // The frontend stores wishlist ids and compares them with product._id.
      wishlist: user.wishlist.map((product) => product.id),
      addresses: user.addresses,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    'Profile fetched successfully'
  );
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.validated.query;

  const where = { role: 'customer' };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: safeUserSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  success(res, 200, {
    users,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

exports.addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.validated.params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) throw new ApiError(404, 'Product not found');

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { wishlist: { connect: { id: productId } } },
    select: { wishlist: { select: { id: true } } },
  });

  success(
    res,
    200,
    { wishlist: user.wishlist.map((item) => item.id) },
    'Added to wishlist'
  );
});

exports.removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.validated.params;

  const current = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { wishlist: { select: { id: true } } },
  });
  if (!current) throw new ApiError(404, 'User not found');

  const remaining = current.wishlist
    .filter((item) => item.id !== productId)
    .map((item) => ({ id: item.id }));

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { wishlist: { set: remaining } },
    select: { wishlist: { select: { id: true } } },
  });

  success(
    res,
    200,
    { wishlist: user.wishlist.map((item) => item.id) },
    'Removed from wishlist'
  );
});

exports.getUserById = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: safeUserSelect,
  });
  if (!user) throw new ApiError(404, 'Customer not found');

  const [orders, spent] = await prisma.$transaction([
    prisma.order.findMany({
      where: { userId: id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.order.aggregate({
      where: {
        userId: id,
        status: { notIn: ['cancelled', 'refunded'] },
      },
      _sum: { total: true },
    }),
  ]);

  success(res, 200, {
    user,
    orders,
    totalSpent: Math.round((spent._sum.total ?? 0) * 100) / 100,
  });
});
