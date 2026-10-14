import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

/**
 * Middleware factory for validating incoming requests with Zod schemas.
 * Validates request body, query parameters, or route parameters.
 */
export function validateRequest(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Assign parsed & sanitized values back
      req.body = parsed.body ?? req.body;
      req.query = parsed.query ?? req.query;
      req.params = parsed.params ?? req.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: "Validation Error",
            details: error.errors.map((e) => ({
              path: e.path.join("."),
              message: e.message,
            })),
          },
        });
        return;
      }
      next(error);
    }
  };
}
