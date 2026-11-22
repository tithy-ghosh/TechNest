const { prisma } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/ApiResponse');

const reviewInclude = {
  user: { select: { id: true, name: true } },
};

// The old API stored review text in `body`; the frontend reads `body` and maps
// it to `comment`. Expose both so either contract keeps working.
const presentReview = (review) => ({
  ...review,
  body: review.comment,
  comment: review.comment,
});

const findProduct = async (slugOrId) => {
  const bySlug = await prisma.product.findFirst({
    where: { slug: slugOrId },
    select: { id: true },
  });
  if (bySlug) return bySlug;

  return prisma.product.findUnique({
    where: { id: slugOrId },
    select: { id: true },
  });
};

const refreshProductStats = async (productId, client = prisma) => {
  const stats = await client.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { _all: true },
  });

  await client.product.update({
    where: { id: productId },
    data: {
      avgRating: Math.round((stats._avg.rating ?? 0) * 10) / 10,
      reviewCount: stats._count._all,
    },
  });
};

exports.getReviews = asyncHandler(async (req, res) => {
  const { slug } = req.validated.params;
  const product = await findProduct(slug);
  if (!product) throw new ApiError(404, 'Product not found');

  const reviews = await prisma.review.findMany({
    where: { productId: product.id },
    include: reviewInclude,
    orderBy: { createdAt: 'desc' },
  });

  success(res, 200, { reviews: reviews.map(presentReview) });
});

exports.createReview = asyncHandler(async (req, res) => {
  const { slug } = req.validated.params;
  const { rating, title, comment, body } = req.validated.body;
  const text = comment ?? body ?? null;

  const product = await findProduct(slug);
  if (!product) throw new ApiError(404, 'Product not found');

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId: product.id, userId: req.user.id } },
    select: { id: true },
  });
  if (existing) throw new ApiError(409, 'You have already reviewed this product');

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        productId: product.id,
        userId: req.user.id,
        rating,
        title: title || null,
        comment: text,
      },
      include: reviewInclude,
    });

    await refreshProductStats(product.id, tx);
    return created;
  });

  success(res, 201, { review: presentReview(review) }, 'Review submitted');
});

exports.deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.validated.params;

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true, productId: true },
  });
  if (!review) throw new ApiError(404, 'Review not found');

  const isOwner = review.userId === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw new ApiError(403, 'Not authorized');

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: review.id } });
    await refreshProductStats(review.productId, tx);
  });

  success(res, 200, null, 'Review deleted');
});
