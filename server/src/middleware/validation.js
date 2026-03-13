import { z } from 'zod';

// --- Report validation schema ---
export const reportSchema = z.object({
  latitude: z.number().min(29).max(34).describe('Must be within Jordan'),
  longitude: z.number().min(34).max(40).describe('Must be within Jordan'),
  report_type: z.enum(['fire', 'smoke', 'logging', 'desertification', 'pollution', 'wildlife', 'other', 'unknown']).default('unknown'),
  description: z.string().max(1000).optional().default(''),
});

// --- Generic validation middleware factory ---
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    req.body = result.data; // Use parsed+sanitized data
    next();
  };
}

// --- Param ID validation ---
export function validateId(req, res, next) {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid ID parameter' });
  }
  req.params.id = id;
  next();
}
