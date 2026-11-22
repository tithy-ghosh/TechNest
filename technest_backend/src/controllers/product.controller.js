const slugify = require('slugify');
const { prisma } = require('../config/db');
const { uploadToCloudinary } = require('../services/image.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/ApiResponse');

const makeSlug = (name) =>
  slugify(name, { lower: true, strict: true }) || `product-${Date.now()}`;

const sortMap = {
  price_asc: { basePrice: 'asc' },
  price_desc: { basePrice: 'desc' },
  newest: { createdAt: 'desc' },
  rating: { avgRating: 'desc' },
  bestseller: { soldCount: 'desc' },
};

exports.getProducts = asyncHandler(async (req, res) => {
  const { search, category, brand, minPrice, maxPrice, rating, sort, page, limit } =
    req.validated.query;
  const isAdmin = req.user?.role === 'admin';

  const where = isAdmin ? {} : { status: 'active' };

  if (category) where.category = category;
  if (brand) {
    where.brand = {
      in: brand
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    };
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.basePrice = {
      ...(minPrice !== undefined && { gte: minPrice }),
      ...(maxPrice !== undefined && { lte: maxPrice }),
    };
  }
  if (rating !== undefined) where.avgRating = { gte: rating };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderBy = sortMap[sort] || [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
  const skip = (page - 1) * limit;

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { variants: true, specs: true },
      orderBy,
      skip,
      take: limit,
    }),
  ]);

  success(res, 200, {
    products,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

exports.getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.validated.params;

  let product = await prisma.product.findFirst({
    where: { slug, status: 'active' },
    include: { variants: true, specs: true },
  });

  if (!product) {
    product = await prisma.product.findUnique({
      where: { id: slug },
      include: { variants: true, specs: true },
    });
  }

  if (!product) throw new ApiError(404, 'Product not found');
  success(res, 200, { product });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const { variants, specs, ...data } = req.validated.body;

  const product = await prisma.product.create({
    data: {
      ...data,
      slug: makeSlug(data.name),
      variants: {
        create: variants.map((variant) => ({
          ...variant,
          images: variant.images ?? [],
        })),
      },
      specs: { create: specs },
    },
    include: { variants: true, specs: true },
  });

  success(res, 201, { product }, 'Product created');
});

exports.uploadProductImages = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: { orderBy: { id: 'asc' }, take: 1 } },
  });
  if (!product) throw new ApiError(404, 'Product not found');
  if (!product.variants[0]) throw new ApiError(400, 'Add a variant before uploading images');

  const urls = await Promise.all(req.files.map((file) => uploadToCloudinary(file.buffer)));

  await prisma.productVariant.update({
    where: { id: product.variants[0].id },
    data: { images: { push: urls } },
  });

  success(res, 200, { images: urls }, 'Images uploaded');
});

exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    where: { status: 'active', isFeatured: true },
    include: { variants: true, specs: true },
    orderBy: { createdAt: 'desc' },
    take: 8,
  });

  success(res, 200, { products });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { variants, specs, ...data } = req.validated.body;

  const product = await prisma.$transaction(async (tx) => {
    const scalar = { ...data };
    if (scalar.name) scalar.slug = makeSlug(scalar.name);

    await tx.product.update({ where: { id }, data: scalar });

    if (specs) {
      await tx.productSpec.deleteMany({ where: { productId: id } });
      if (specs.length > 0) {
        await tx.productSpec.createMany({
          data: specs.map((spec) => ({ ...spec, productId: id })),
        });
      }
    }

    if (variants) {
      const skus = variants.map((variant) => variant.sku);
      await tx.productVariant.deleteMany({
        where: { productId: id, sku: { notIn: skus } },
      });

      for (const variant of variants) {
        const { sku, ...rest } = variant;
        await tx.productVariant.upsert({
          where: { productId_sku: { productId: id, sku } },
          create: { productId: id, sku, ...rest, images: rest.images ?? [] },
          update: { ...rest, images: rest.images ?? [] },
        });
      }
    }

    return tx.product.findUnique({
      where: { id },
      include: { variants: true, specs: true },
    });
  });

  success(res, 200, { product }, 'Product updated');
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  await prisma.product.delete({ where: { id } });
  success(res, 200, null, 'Product deleted');
});

exports.getProductById = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true, specs: true },
  });
  if (!product) throw new ApiError(404, 'Product not found');

  success(res, 200, { product });
});
