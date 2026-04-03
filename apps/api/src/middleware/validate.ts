import type { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export function validate<T>(schema: z.ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body) as unknown;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: err.errors,
        });
        return;
      }
      next(err);
    }
  };
}
