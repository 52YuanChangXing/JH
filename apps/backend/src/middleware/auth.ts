import { NextFunction, Request, Response } from 'express';
import createError from 'http-errors';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.access_token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(createError(401, 'Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret) as { sub: string; email: string };
    req.user = { id: decoded.sub, email: decoded.email, roles: [], permissions: [] };
    return next();
  } catch (error) {
    return next(createError(401, 'Invalid or expired token'));
  }
}

export async function enrichUser(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next();
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  if (!dbUser) {
    return next(createError(401, 'User not found'));
  }

  const roles = dbUser.roles.map((userRole) => userRole.role.name);
  const permissions = dbUser.roles.flatMap((userRole) =>
    userRole.role.permissions.map((rp) => rp.permission.name)
  );

  req.user = {
    id: dbUser.id,
    email: dbUser.email,
    roles,
    permissions
  };

  return next();
}

export function authorize(required: string | string[]) {
  const requiredPermissions = Array.isArray(required) ? required : [required];

  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError(401, 'Authentication required'));
    }

    const hasPermission = requiredPermissions.every((permission) =>
      req.user?.permissions.includes(permission)
    );

    if (!hasPermission) {
      return next(createError(403, 'Insufficient permissions'));
    }

    return next();
  };
}
