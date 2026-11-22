const { prisma } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/ApiResponse');
const {
  sendOrderShippedEmail,
  sendOrderCancelledEmail,
  sendOrderDeliveredEmail,
} = require('../services/email.service');

const orderInclude = {
  user: { select: { id: true, name: true, email: true } },
  items: true,
  statusHistory: { orderBy: { updatedAt: 'asc' } },
};

exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  success(res, 200, { orders });
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const isAdmin = req.user?.role === 'admin';

  const order = await prisma.order.findFirst({
    where: isAdmin ? { id } : { id, userId: req.user.id },
    include: orderInclude,
  });

  if (!order) throw new ApiError(404, 'Order not found');
  success(res, 200, { order });
});

exports.getAllOrders = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.validated.query;
  const where = status ? { status } : {};

  const [total, orders] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  success(res, 200, {
    orders,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { status } = req.validated.body;

  const existing = await prisma.order.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) throw new ApiError(404, 'Order not found');

  const order = await prisma.order.update({
    where: { id },
    data: {
      status,
      statusHistory: {
        create: { status, note: `Status updated to ${status}` },
      },
    },
    include: orderInclude,
  });

  if (order.user?.email) {
    const emailMap = {
      shipped: () => sendOrderShippedEmail(order.user, order),
      cancelled: () => sendOrderCancelledEmail(order.user, order),
      delivered: () => sendOrderDeliveredEmail(order.user, order),
    };
    const emailFn = emailMap[status];
    if (emailFn) {
      emailFn().catch((err) =>
        console.error(
          `[updateOrderStatus] Email failed for status "${status}":`,
          err.message
        )
      );
    }
  }

  success(res, 200, { order }, 'Order status updated');
});
