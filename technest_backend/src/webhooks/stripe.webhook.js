const stripe = require('../config/stripe');
const { prisma } = require('../config/db');
const { sendOrderConfirmationEmail } = require('../services/email.service');

exports.handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[stripeWebhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type !== 'payment_intent.succeeded') {
    return res.json({ received: true });
  }

  const intent = event.data.object;
  const orderId = intent.metadata?.orderId;
  if (!orderId) {
    console.error('[stripeWebhook] payment_intent.succeeded without orderId metadata');
    return res.json({ received: true });
  }

  const order = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({
      where: { id: orderId },
      include: { user: true, items: true },
    });

    if (!current) {
      console.error(`[stripeWebhook] No order found for id ${orderId}`);
      return null;
    }

    // Idempotency: Stripe retries events. Only the transaction that moves the
    // order out of `pending` is allowed to touch stock/coupons/cart.
    const claimed = await tx.order.updateMany({
      where: { id: current.id, status: 'pending' },
      data: { status: 'confirmed' },
    });
    if (claimed.count === 0) return null;

    await tx.orderStatusHistory.create({
      data: {
        orderId: current.id,
        status: 'confirmed',
        note: 'Payment received',
      },
    });

    for (const item of current.items) {
      if (!item.productId || !item.variantSku) continue;

      const changed = await tx.productVariant.updateMany({
        where: {
          productId: item.productId,
          sku: item.variantSku,
          stock: { gte: item.quantity },
        },
        data: { stock: { decrement: item.quantity } },
      });

      if (changed.count === 0) {
        throw new Error(
          `Out of stock while confirming order ${current.id}: ${item.variantSku}`
        );
      }

      await tx.product.update({
        where: { id: item.productId },
        data: { soldCount: { increment: item.quantity } },
      });
    }

    if (current.userId) {
      await tx.cart.deleteMany({ where: { userId: current.userId } });
    }

    if (current.couponCode) {
      await tx.coupon.updateMany({
        where: { code: current.couponCode },
        data: { usesCount: { increment: 1 } },
      });
    }

    return tx.order.findUnique({
      where: { id: current.id },
      include: { user: true, items: true },
    });
  });

  if (order) {
    const recipient = order.user ?? (order.guestEmail
      ? { email: order.guestEmail, name: 'Customer' }
      : null);

    if (recipient) {
      sendOrderConfirmationEmail(recipient, order).catch((err) =>
        console.error('[stripeWebhook] Confirmation email failed:', err.message)
      );
    }
  }

  res.json({ received: true });
};
