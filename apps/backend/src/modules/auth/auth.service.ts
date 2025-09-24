import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { RegisterInput, LoginInput, RefreshInput } from './auth.schema.js';

function generateAccessToken(userId: string, email: string) {
  return jwt.sign({ sub: userId, email }, env.jwtAccessSecret, { expiresIn: env.jwtExpiresIn });
}

function generateRefreshToken(userId: string) {
  const token = jwt.sign({ sub: userId, type: 'refresh' }, env.jwtRefreshSecret, {
    expiresIn: env.refreshExpiresIn
  });
  return token;
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error('Email already registered');
  }

  const passwordHash = await bcrypt.hash(input.password, env.saltRounds);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      displayName: input.displayName,
      passwordHash,
      roles: {
        create: {
          role: {
            connect: { name: 'viewer' }
          }
        }
      }
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'auth.register',
      entity: 'User',
      entityId: user.id,
      metadata: { email: user.email }
    }
  });

  return user;
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
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

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id);

  const decodedRefresh = jwt.decode(refreshToken) as { exp: number };

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      expiresAt: new Date(decodedRefresh.exp * 1000),
      userId: user.id
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'auth.login',
      entity: 'User',
      entityId: user.id,
      metadata: { email: user.email }
    }
  });

  const roles = user.roles.map((r) => r.role.name);
  const permissions = user.roles.flatMap((role) =>
    role.role.permissions.map((perm) => perm.permission.name)
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      roles,
      permissions
    }
  };
}

export async function refreshTokens(input: RefreshInput) {
  try {
    const decoded = jwt.verify(input.refreshToken, env.jwtRefreshSecret) as { sub: string };
    const stored = await prisma.refreshToken.findUnique({ where: { token: input.refreshToken } });
    if (!stored || stored.revokedAt) {
      throw new Error('Refresh token revoked');
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) {
      throw new Error('User not found for refresh token');
    }

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);
    const decodedRefresh = jwt.decode(refreshToken) as { exp: number };

    await prisma.refreshToken.update({
      where: { token: input.refreshToken },
      data: { revokedAt: new Date() }
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        expiresAt: new Date(decodedRefresh.exp * 1000),
        userId: decoded.sub
      }
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

export async function logoutUser(refreshToken?: string) {
  if (!refreshToken) {
    return;
  }

  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { revokedAt: new Date() }
  });
}
