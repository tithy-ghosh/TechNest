const crypto = require('crypto');
const { prisma } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/ApiResponse');
const {
  sendSubscriptionConfirmEmail,
  sendSubscriptionWelcomeEmail,
} = require('../services/email.service');

const makeToken = () => crypto.randomBytes(32).toString('hex');

exports.subscribe = asyncHandler(async (req, res) => {
  const { email, name } = req.validated.body;

  const existing = await prisma.subscriber.findUnique({ where: { email } });

  if (existing?.isConfirmed) {
    return success(res, 200, null, 'You are already subscribed!');
  }

  if (existing) {
    const confirmToken = existing.confirmToken ?? makeToken();
    if (!existing.confirmToken) {
      await prisma.subscriber.update({
        where: { id: existing.id },
        data: { confirmToken },
      });
    }

    const confirmUrl = `${process.env.CLIENT_URL}/newsletter/confirm?token=${confirmToken}`;
    await sendSubscriptionConfirmEmail(email, name ?? existing.name, confirmUrl);
    return success(
      res,
      200,
      null,
      'Confirmation email resent. Please check your inbox.'
    );
  }

  const confirmToken = makeToken();
  const unsubscribeToken = makeToken();

  await prisma.subscriber.create({
    data: {
      email,
      name: name ?? null,
      confirmToken,
      unsubscribeToken,
    },
  });

  const confirmUrl = `${process.env.CLIENT_URL}/newsletter/confirm?token=${confirmToken}`;

  try {
    await sendSubscriptionConfirmEmail(email, name, confirmUrl);
  } catch (err) {
    console.error('[subscribe] Confirmation email failed:', err.message);
  }

  success(
    res,
    201,
    null,
    'Almost there! Check your email to confirm your subscription.'
  );
});

exports.confirmSubscription = asyncHandler(async (req, res) => {
  const { token } = req.validated.query;

  const subscriber = await prisma.subscriber.findFirst({
    where: { confirmToken: token },
  });
  if (!subscriber) {
    throw new ApiError(400, 'Invalid or expired confirmation link');
  }

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: { isConfirmed: true, confirmToken: null },
  });

  try {
    await sendSubscriptionWelcomeEmail(subscriber.email, subscriber.name);
  } catch (err) {
    console.error('[confirmSubscription] Welcome email failed:', err.message);
  }

  success(res, 200, null, 'Subscription confirmed! Welcome to TechNest.');
});

exports.unsubscribe = asyncHandler(async (req, res) => {
  const { token } = req.validated.query;

  const subscriber = await prisma.subscriber.findUnique({
    where: { unsubscribeToken: token },
    select: { id: true },
  });
  if (!subscriber) throw new ApiError(400, 'Invalid unsubscribe link');

  await prisma.subscriber.delete({ where: { id: subscriber.id } });

  success(res, 200, null, 'You have been unsubscribed successfully.');
});
