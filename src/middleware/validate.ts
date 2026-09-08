import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';

interface RequestSchemas {
  body?: ZodType;
  params?: ZodType;
}

/**
 * Validates a request against zod schemas before the controller runs, so a
 * handler only ever sees data that already holds up.
 *
 * `parse` throws a ZodError rather than returning a result, which lets the
 * central error handler translate it into a 400 -- the same route every other
 * failure takes. No error handling belongs here.
 *
 * The parsed value replaces the raw one, so controllers receive coerced types
 * (real Dates, real numbers) with unknown keys already rejected.
 *
 * Deliberately no `query` support: Express 5 exposes `req.query` through a
 * getter with no setter, so assigning to it throws at runtime. Query
 * validation has to hand its result on some other way.
 */
export const validate = (schemas: RequestSchemas): RequestHandler => {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (schemas.params) {
      request.params = schemas.params.parse(request.params) as typeof request.params;
    }
    if (schemas.body) {
      request.body = schemas.body.parse(request.body);
    }
    next();
  };
};
