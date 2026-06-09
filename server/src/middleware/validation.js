import { z } from 'zod';
import { isWithinAnyCountry } from '../data/forests.js';

// --- Report validation schema ---
// Accepts coordinates from the active monitored country scope.
export const reportSchema = z.object({
  latitude: z.number().min(-5).max(42).describe('Must be within a monitored region'),
  longitude: z.number().min(-18).max(60).describe('Must be within a monitored region'),
  report_type: z.enum(['fire', 'smoke', 'logging', 'desertification', 'pollution', 'wildlife', 'dispute', 'other', 'unknown']).default('unknown'),
  description: z.string().max(1000).optional().default(''),
  user_id: z.number().int().positive().optional().nullable(),
}).refine(
  (data) => isWithinAnyCountry(data.latitude, data.longitude).valid,
  { message: 'Coordinates must be within a monitored country', path: ['latitude'] }
);

// --- Generic validation middleware factory ---
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? 'Validation failed';
      return res.status(400).json({ error: message });
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
