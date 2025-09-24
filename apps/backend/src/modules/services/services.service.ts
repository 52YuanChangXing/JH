import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { CreateServiceInput, ServiceFilterInput, UpdateServiceInput } from './services.schema.js';

export async function listServices(input: ServiceFilterInput) {
  const skip = (input.page - 1) * input.pageSize;
  const where: Prisma.ServiceWhereInput = {
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search, mode: 'insensitive' } },
            { summary: { contains: input.search, mode: 'insensitive' } }
          ]
        }
      : {}),
    ...(input.active !== undefined ? { isActive: input.active } : {})
  };

  const [total, services] = await Promise.all([
    prisma.service.count({ where }),
    prisma.service.findMany({
      where,
      skip,
      take: input.pageSize,
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return {
    data: services,
    pagination: {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.ceil(total / input.pageSize)
    }
  };
}

export async function createService(input: CreateServiceInput, actorId: string) {
  const service = await prisma.service.create({ data: input });

  await prisma.auditLog.create({
    data: {
      action: 'service.created',
      entity: 'Service',
      entityId: service.id,
      actorId,
      metadata: { name: service.name }
    }
  });

  return service;
}

export async function updateService(id: string, input: UpdateServiceInput, actorId: string) {
  const service = await prisma.service.update({ where: { id }, data: input });

  await prisma.auditLog.create({
    data: {
      action: 'service.updated',
      entity: 'Service',
      entityId: id,
      actorId,
      metadata: { name: service.name, isActive: service.isActive }
    }
  });

  return service;
}

export async function deleteService(id: string, actorId: string) {
  const service = await prisma.service.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      action: 'service.deleted',
      entity: 'Service',
      entityId: id,
      actorId,
      metadata: { name: service.name }
    }
  });

  return service;
}
