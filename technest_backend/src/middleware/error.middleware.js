const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, next) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target;
      return res.status(409).json({
        success: false,
        data: null,
        message: target ? `A record with this ${target} already exists` : 'A record with this value already exists',
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, data: null, message: 'Record not found' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'This record is still referenced by other data',
      });
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ success: false, data: null, message: 'Invalid data supplied' });
  }

  if (err.name === 'ZodError') {
    const message = err.issues
      .map((issue) => `${issue.path.join('.') || 'field'}: ${issue.message}`)
      .join('; ');
    return res.status(400).json({ success: false, data: null, message });
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';
  if (!err.isOperational) console.error('[Error]', err);
  res.status(statusCode).json({ success: false, data: null, message });
};

module.exports = { errorHandler };
