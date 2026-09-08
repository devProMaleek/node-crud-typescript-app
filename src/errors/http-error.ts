/**
 * An error that already knows which HTTP status it deserves.
 *
 * Throw this from a controller when the situation is a client problem you
 * detected yourself -- "no employee with that id" -- rather than an exception
 * bubbling up from a library. The central error handler reads `status` off it
 * instead of guessing.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export const notFound = (message = 'Resource not found') => new HttpError(404, message);
