import { Response } from 'express';

import { AuthRequest } from '../../middleware/auth.js';
import { success } from '../../utils/http.js';
import { getOverview } from './stats.service.js';

export async function overviewHandler(_req: AuthRequest, res: Response) {
  const data = await getOverview();
  return success(res, data, 'Overview stats fetched');
}
