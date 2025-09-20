import { Response } from 'express';

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  message?: string;
  traceId?: string;
};

export function success<T>(res: Response, data: T, message = 'Success', status = 200) {
  return res.status(status).json({ data, message } satisfies ApiResponse<T>);
}

export function failure(res: Response, error: string, status = 400, traceId?: string) {
  return res.status(status).json({ error, message: 'Request failed', traceId } satisfies ApiResponse<null>);
}
