import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { CreateUserInput, QueryUserInput, UpdateUserInput } from './users.schema.js';

export async function listUsers(params: QueryUserInput) {
  const skip = (params.page - 1) * params.pageSize;
  const where = params.search
    ? {
        OR: [
          { email: { contains: params.search, mode: 'insensitive' } },
          { displayName: { contains: params.search, mode: 'insensitive' } }
        ]
      }
    : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: params.pageSize,
      include: {
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return {
    data: users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      roles: user.roles.map((r) => r.role.name),
      createdAt: user.createdAt
    })),
    pagination: {
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(total / params.pageSize)
    }
  };
}

export async function createUser(input: CreateUserInput, actorId: string) {
  const passwordHash = await bcrypt.hash(input.password, env.saltRounds);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      roles: {
        create: input.roles.map((role) => ({
          role: {
            connect: { name: role }
          }
        }))
      }
    },
    include: {
      roles: {
        include: { role: true }
      }
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'user.created',
      entity: 'User',
      entityId: user.id,
      actorId,
      metadata: { email: user.email, roles: input.roles }
    }
  });

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    roles: user.roles.map((r) => r.role.name)
  };
}

export async function updateUser(userId: string, input: UpdateUserInput, actorId: string) {
  const data: Record<string, unknown> = {};
  if (input.displayName) {
    data.displayName = input.displayName;
  }
  if (input.password) {
    data.passwordHash = await bcrypt.hash(input.password, env.saltRounds);
  }

  await prisma.user.update({
    where: { id: userId },
    data
  });

  if (input.roles) {
    await prisma.userRole.deleteMany({ where: { userId } });
    if (input.roles.length > 0) {
      const roles = await prisma.role.findMany({ where: { name: { in: input.roles } } });
      await prisma.userRole.createMany({
        data: roles.map((role) => ({
          userId,
          roleId: role.id
        }))
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      action: 'user.updated',
      entity: 'User',
      entityId: userId,
      actorId,
      metadata: input
    }
  });

  const final = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: { role: true }
      }
    }
  });

  if (!final) {
    throw new Error('User not found after update');
  }

  return {
    id: final.id,
    email: final.email,
    displayName: final.displayName,
    roles: final.roles.map((r) => r.role.name)
  };
}

export async function deleteUser(userId: string, actorId: string) {
  await prisma.userRole.deleteMany({ where: { userId } });
  await prisma.refreshToken.deleteMany({ where: { userId } });
  const deleted = await prisma.user.delete({ where: { id: userId } });
  await prisma.auditLog.create({
    data: {
      action: 'user.deleted',
      entity: 'User',
      entityId: userId,
      actorId,
      metadata: { email: deleted.email }
    }
  });
  return deleted;
}
