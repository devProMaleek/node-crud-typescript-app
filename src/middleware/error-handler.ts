import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { HttpError } from '../errors/http-error.js';

/** MongoDB signals a unique-index violation with this driver error code. */
const DUPLICATE_KEY = 11000;

const isDuplicateKeyError = (error: unknown): error is { keyValue?: Record<string, unknown> } =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === DUPLICATE_KEY;

/**
 * Express's body parser throws errors that already carry an HTTP status --
 * malformed JSON is 400, an oversized payload is 413. The `expose` flag is the
 * http-errors convention for "this message is safe to show the client".
 */
const isStatusCarryingError = (
  error: unknown,
): error is { status: number; message: string; expose?: boolean } =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof (error as { status: unknown }).status === 'number';

/**
 * Runs when no route matched. Without it, Express answers unknown paths with
 * its own HTML page, which is jarring for an API that otherwise speaks JSON.
 */
export const notFoundHandler = (request: Request, _response: Response, next: NextFunction) => {
  next(new HttpError(404, `Cannot ${request.method} ${request.originalUrl}`));
};

/**
 * The single place that turns a thrown error into an HTTP response.
 *
 * Express recognises error middleware by its FOUR parameters -- drop `next`
 * and Express silently treats this as an ordinary handler that never runs.
 * That is why `next` is present even though the happy path never calls it.
 */
export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
) => {
  // If the response has already started streaming we cannot change the status
  // code, so hand back to Express to close the connection.
  if (response.headersSent) return next(error);

  // 1. We threw this ourselves and already decided the status.
  if (error instanceof HttpError) {
    return response.status(error.status).json({
      error: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
  }

  // 2. The request failed validation at the route boundary. Report every
  //    problem at once, addressed to whoever wrote the request.
  if (error instanceof ZodError) {
    return response.status(400).json({
      error: 'Validation failed',
      details: error.issues.map((issue) => ({
        field: issue.path.join('.') || '(body)',
        message: issue.message,
      })),
    });
  }

  // 3. An ObjectId that reached Mongoose unchecked. Requests are validated
  //    before the controller now, so this is a backstop for ids cast anywhere
  //    else -- a field in a body, a query written by hand.
  if (error instanceof mongoose.Error.CastError) {
    return response.status(400).json({
      error: `Invalid value for '${error.path}'`,
      details: { received: error.value },
    });
  }

  // 4. The body failed schema validation. Report every bad field at once so
  //    the client can fix them in one go rather than one request per mistake.
  if (error instanceof mongoose.Error.ValidationError) {
    return response.status(400).json({
      error: 'Validation failed',
      details: Object.values(error.errors).map((e) => ({ field: e.path, message: e.message })),
    });
  }

  // 5. A unique index rejected the write -- the resource already exists.
  //    409 Conflict says "your request was well-formed but clashes with state".
  if (isDuplicateKeyError(error)) {
    const field = Object.keys(error.keyValue ?? {})[0] ?? 'field';
    return response.status(409).json({
      error: `An employee with that ${field} already exists`,
      details: error.keyValue,
    });
  }

  // 6. Thrown by Express itself before our code ran: malformed JSON body,
  //    payload too large, unsupported media type. These already know their
  //    status; we only repeat the message when `expose` says it is safe.
  if (isStatusCarryingError(error) && error.status >= 400 && error.status < 500) {
    return response.status(error.status).json({
      error: error.expose ? error.message : 'Bad request',
    });
  }

  // 7. Genuinely unexpected. Log the real thing for us, return something
  //    generic to the client -- internal messages can leak schema or paths.
  console.error('Unhandled error:', error);
  return response.status(500).json({ error: 'Internal server error' });
};
