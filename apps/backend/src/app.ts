import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';

import { errorHandler, notFound } from './middleware/error-handler.js';
import { trace } from './middleware/trace.js';
import { router as apiRouter } from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(trace);
  app.use(helmet());
  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan('dev'));

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
  });

  app.use('/docs', apiRouter.docs);
  app.use('/api/v1', apiRouter.api);

  app.use('/static', express.static(path.resolve('public')));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
