const { ZodError } = require('zod');

function formatZodError(error) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

function validateBody(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.validated = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: formatZodError(err),
        });
      }
      return res.status(400).json({ error: 'Invalid payload' });
    }
  };
}

module.exports = { validateBody };
