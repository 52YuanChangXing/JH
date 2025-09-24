import { Response } from 'express';
import createError from 'http-errors';

import { success } from '../../utils/http.js';
import { AuthRequest } from '../../middleware/auth.js';
import { loginSchema, refreshSchema, registerSchema } from './auth.schema.js';
import { loginUser, logoutUser, refreshTokens, registerUser } from './auth.service.js';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 1000 * 60 * 60
};

export async function registerHandler(req: AuthRequest, res: Response) {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }
  const user = await registerUser(result.data);
  return success(res, { id: user.id, email: user.email, displayName: user.displayName }, 'Registered', 201);
}

export async function loginHandler(req: AuthRequest, res: Response) {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }
  const { accessToken, refreshToken, user } = await loginUser(result.data);
  res.cookie('access_token', accessToken, cookieOptions);
  res.cookie('refresh_token', refreshToken, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 7 });
  return success(res, { user, accessToken, refreshToken }, 'Logged in');
}

export async function refreshHandler(req: AuthRequest, res: Response) {
  const payload = {
    refreshToken: req.cookies.refresh_token ?? req.body.refreshToken
  };
  const result = refreshSchema.safeParse(payload);
  if (!result.success) {
    throw createError(400, 'Refresh token missing');
  }
  const tokens = await refreshTokens(result.data);
  res.cookie('access_token', tokens.accessToken, cookieOptions);
  res.cookie('refresh_token', tokens.refreshToken, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 7 });
  return success(res, tokens, 'Tokens refreshed');
}

export async function logoutHandler(req: AuthRequest, res: Response) {
  const refreshToken = req.cookies.refresh_token ?? req.body.refreshToken;
  await logoutUser(refreshToken);
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  return success(res, { loggedOut: true }, 'Logged out');
}

export async function meHandler(req: AuthRequest, res: Response) {
  if (!req.user) {
    throw createError(401, 'Authentication required');
  }
  return success(res, { user: req.user }, 'Current user');
}
