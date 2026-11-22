const { prisma } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/ApiResponse');

const startOfDay = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

exports.getDashboardKPI = asyncHandler(async (req, res) => {
  const today = startOfDay();
  const paidStatuses = { notIn: ['cancelled', 'refunded'] };

  const [
    totalRevenueResult,
    totalOrders,
    totalUsers,
    totalProducts,
    todayRevenueResult,
    todayOrders,
    aovResult,
  ] = await prisma.$transaction([
    prisma.order.aggregate({
      where: { status: paidStatuses },
      _sum: { total: true },
    }),
    prisma.order.count(),
    prisma.user.count({ where: { role: 'customer' } }),
    prisma.product.count({ where: { status: 'active' } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: today }, status: paidStatuses },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.aggregate({
      where: { status: paidStatuses },
      _avg: { total: true },
    }),
  ]);

  success(res, 200, {
    totalRevenue: totalRevenueResult._sum.total ?? 0,
    totalOrders,
    totalUsers,
    totalProducts,
    todayRevenue: todayRevenueResult._sum.total ?? 0,
    todayOrders,
    averageOrderValue: Math.round((aovResult._avg.total ?? 0) * 100) / 100,
  });
});

exports.getRevenueTrends = asyncHandler(async (req, res) => {
  const { period, startDate, endDate } = req.validated.query;

  const end = endDate ?? new Date();
  const start =
    startDate ?? new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  const dateFormat =
    period === 'week' ? 'IYYY-IW' : period === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';

  const trends = await prisma.$queryRaw`
    SELECT to_char("createdAt", ${dateFormat}) AS date,
           COALESCE(SUM(total), 0)::float8 AS revenue,
           COUNT(*)::int AS orders
    FROM "Order"
    WHERE "createdAt" >= ${start}
      AND "createdAt" <= ${end}
      AND status::text NOT IN ('cancelled', 'refunded')
    GROUP BY 1
    ORDER BY 1
  `;

  success(res, 200, { trends, period, startDate: start, endDate: end });
});

exports.getOrderStats = asyncHandler(async (req, res) => {
  const grouped = await prisma.order.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

  const statusDistribution = grouped
    .map((row) => ({ status: row.status, count: row._count._all }))
    .sort((a, b) => b.count - a.count);

  const recentOrders = await prisma.order.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  success(res, 200, { statusDistribution, recentOrders });
});

exports.getTopProducts = asyncHandler(async (req, res) => {
  const { limit } = req.validated.query;

  const topProducts = await prisma.product.findMany({
    where: { status: 'active' },
    orderBy: { soldCount: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      brand: true,
      category: true,
      basePrice: true,
      soldCount: true,
      avgRating: true,
      reviewCount: true,
    },
  });

  success(res, 200, { topProducts });
});

exports.getRevenueByCategory = asyncHandler(async (req, res) => {
  const categoryRevenue = await prisma.$queryRaw`
    SELECT COALESCE(p.category, 'Unknown') AS category,
           COALESCE(SUM(oi.price * oi.quantity), 0)::float8 AS revenue,
           COALESCE(SUM(oi.quantity), 0)::int AS "unitsSold"
    FROM "OrderItem" oi
    JOIN "Order" o ON o.id = oi."orderId"
    LEFT JOIN "Product" p ON p.id = oi."productId"
    WHERE o.status::text NOT IN ('cancelled', 'refunded')
    GROUP BY 1
    ORDER BY revenue DESC
  `;

  success(res, 200, { categoryRevenue });
});

exports.getUserStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [totalUsers, newThisMonth, newLastMonth, registrationTrend] =
    await prisma.$transaction([
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.user.count({
        where: { role: 'customer', createdAt: { gte: thisMonth } },
      }),
      prisma.user.count({
        where: {
          role: 'customer',
          createdAt: { gte: lastMonth, lt: thisMonth },
        },
      }),
      prisma.$queryRaw`
        SELECT to_char("createdAt", 'YYYY-MM') AS month,
               COUNT(*)::int AS count
        FROM "User"
        WHERE role::text = 'customer'
        GROUP BY 1
        ORDER BY 1
      `,
    ]);

  success(res, 200, {
    totalUsers,
    newThisMonth,
    newLastMonth,
    registrationTrend,
  });
});

exports.getAbandonedCarts = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalAbandoned, abandonedCarts] = await prisma.$transaction([
    prisma.cart.count({ where: { updatedAt: { gte: thirtyDaysAgo } } }),
    prisma.cart.findMany({
      where: { updatedAt: { gte: thirtyDaysAgo } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: { product: { select: { id: true, name: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    }),
  ]);

  success(res, 200, { totalAbandoned, abandonedCarts });
});

exports.getCouponStats = asyncHandler(async (req, res) => {
  const coupons = await prisma.coupon.findMany({
    select: {
      id: true,
      code: true,
      type: true,
      value: true,
      usesCount: true,
      maxUses: true,
      isActive: true,
      expiresAt: true,
    },
    orderBy: { usesCount: 'desc' },
  });

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((coupon) => coupon.isActive).length;
  const totalUses = coupons.reduce((sum, coupon) => sum + coupon.usesCount, 0);

  success(res, 200, { totalCoupons, activeCoupons, totalUses, coupons });
});
