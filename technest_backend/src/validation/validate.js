const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

/**
 * Usage:
 *   router.post('/', validate({ body: registerSchema }), handler)
 *   router.get('/', validate({ query: productQuerySchema }), handler)
 *
 * Parsed values are available on req.validated.{body,query,params}. Body is
 * also written back to req.body for compatibility. Query/params are not
 * reassigned because Express 5 exposes req.query as a getter.
 */
const validate = (schemas) => (req, res, next) => {
  try {
    const validated = {};

    if (schemas.body) validated.body = schemas.body.parse(req.body ?? {});
    if (schemas.query) validated.query = schemas.query.parse(req.query ?? {});
    if (schemas.params) validated.params = schemas.params.parse(req.params ?? {});

    req.validated = validated;
    if (validated.body) req.body = validated.body;

    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.issues
        .map((issue) => `${issue.path.join('.') || 'field'}: ${issue.message}`)
        .join('; ');
      return next(new ApiError(400, message));
    }
    next(err);
  }
};

module.exports = validate;
