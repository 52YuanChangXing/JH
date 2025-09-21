import { Router } from 'express';
import { authorize } from '../../middleware/auth.js';
import {
  createPortfolioHandler,
  deletePortfolioHandler,
  listPortfolioHandler,
  updatePortfolioHandler
} from './portfolio.controller.js';

export const portfolioRouter = Router();

portfolioRouter.get('/', listPortfolioHandler);
portfolioRouter.post('/', authorize('portfolio:manage'), createPortfolioHandler);
portfolioRouter.patch('/:id', authorize('portfolio:manage'), updatePortfolioHandler);
portfolioRouter.delete('/:id', authorize('portfolio:manage'), deletePortfolioHandler);
