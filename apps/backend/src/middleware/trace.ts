import { NextFunction, Request, Response } from 'express';
import { nanoid } from 'nanoid';

export function trace(req: Request, res: Response, next: NextFunction) {
  const traceId = req.headers['x-request-id']?.toString() || nanoid();
  req.headers['x-request-id'] = traceId;
  res.setHeader('x-trace-id', traceId);
  next();
}
