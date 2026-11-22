const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { prisma } = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshCookie,
} = require('../utils/generateToken');
const { success } = require('../utils/ApiResponse');
const jwt = require('jsonwebtoken');
const {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require('../services/email.service');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validated.body;

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing?.isVerified) {
    throw new ApiError(400, 'Email already registered');
  }

  const verifyToken = crypto.randomBytes(32).toString('hex');
  const verifyUrl = `${process.env.CLIENT_URL}/auth/verify-email?token=${verifyToken}`;

  let user;
  if (existing) {
    // The account was created before but never verified (for example, the
    // verification email failed to send). Let the user retry instead of
    // blocking them with "Email already registered".
    user = await prisma.user.update({
      where: { id: existing.id },
      data: { verifyToken },
    });
  } else {
    const hashed = await bcrypt.hash(password, 12);
    user = await prisma.user.create({
      data: { name, email, password: hashed, verifyToken },
    });
  }

  try {
    await sendVerificationEmail(user, verifyUrl);
  } catch (err) {
    console.error('[register] Verification email failed:', err.message);

    // Don't leave behind an account the user can never verify.
    if (!existing) {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    }

    const reason =
      process.env.NODE_ENV === 'production'
        ? 'Please try again in a moment.'
        : err.message;

    throw new ApiError(
      502,
      `We could not send the verification email. ${reason}`
    );
  }

  success(
    res,
    existing ? 200 : 201,
    null,
    existing
      ? 'Verification email resent. Please check your inbox.'
      : 'Registered! Please verify your email'
  );
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.validated.query;

  const user = await prisma.user.findFirst({ where: { verifyToken: token } });
  if (!user) throw new ApiError(400, 'Invalid or expired verification token');

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, verifyToken: null },
  });

  try {
    await sendWelcomeEmail(user);
  } catch (err) {
    console.error('[verifyEmail] Welcome email failed:', err.message);
  }

  success(res, 200, null, 'Email verified successfully. You can now log in.');
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      role: true,
      isVerified: true,
    },
  });

  if (!user?.password || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isVerified) {
    throw new ApiError(403, 'Please verify your email before logging in');
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id },
  });

  setRefreshCookie(res, refreshToken);
  success(
    res,
    200,
    {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
    },
    'Login Successful'
  );
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) throw new ApiError(401, 'No refresh token');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.userId !== decoded.id) {
    throw new ApiError(401, 'Invalid refresh Token');
  }

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) throw new ApiError(401, 'User not found');

  const newAccessToken = generateAccessToken(user.id, user.role);
  success(res, 200, {
    accessToken: newAccessToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token, userId: req.user.id } });
  }

  res.clearCookie('refreshToken');
  success(res, 200, null, 'Logged out');
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.validated.body;
  const genericMsg = 'If that email exists, a reset link has been sent';

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return success(res, 200, null, genericMsg);

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashedToken,
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${rawToken}`;

  try {
    await sendPasswordResetEmail(user, resetUrl);
  } catch (err) {
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: null, resetTokenExpiry: null },
    });
    throw new ApiError(500, 'Failed to send reset email. Please try again.');
  }

  success(res, 200, null, genericMsg);
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.validated.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: { gt: new Date() },
    },
  });
  if (!user) throw new ApiError(400, 'Invalid or expired reset token');

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(password, 12),
        resetToken: null,
        resetTokenExpiry: null,
      },
    }),
    prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
  ]);

  success(res, 200, null, 'Password reset successfully. Please log in.');
});
