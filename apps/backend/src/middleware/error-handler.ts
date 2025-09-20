import { NextFunction, Request, Response } from 'express';
import createError from 'http-errors';
import { failure } from '../utils/http.js';

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(createError(404, `Route ${req.originalUrl} not found`));
}

export function errorHandler(err: createError.HttpError, req: Request, res: Response, _next: NextFunction) {
  const status = err.status ?? 500;
  const traceId = req.headers['x-request-id']?.toString();
  if (status >= 500) {
    console.error(err);
  }
  return failure(res, err.message || 'Internal Server Error', status, traceId);
}
