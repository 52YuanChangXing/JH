import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import {
  CreatePhotographerInput,
  PhotographerFilterInput,
  UpdatePhotographerInput
} from './photographers.schema.js';

export async function listPhotographers(input: PhotographerFilterInput) {
  const skip = (input.page - 1) * input.pageSize;
  const where: Prisma.PhotographerWhereInput = {
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search, mode: 'insensitive' } },
            { bio: { contains: input.search, mode: 'insensitive' } }
          ]
        }
      : {}),
    ...(input.featured !== undefined ? { isFeatured: input.featured } : {})
  };

  const [total, photographers] = await Promise.all([
    prisma.photographer.count({ where }),
    prisma.photographer.findMany({
      where,
      skip,
      take: input.pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        portfolioItems: {
          select: { id: true, title: true, slug: true, coverImageUrl: true },
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      }
    })
  ]);

  return {
    data: photographers,
    pagination: {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.ceil(total / input.pageSize)
    }
  };
}

export async function createPhotographer(input: CreatePhotographerInput, actorId: string) {
  const photographer = await prisma.photographer.create({
    data: {
      ...input,
      socialLinks: input.socialLinks as Prisma.InputJsonValue
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'photographer.created',
      entity: 'Photographer',
      entityId: photographer.id,
      actorId,
      metadata: { name: photographer.name, slug: photographer.slug }
    }
  });

  return photographer;
}

export async function updatePhotographer(
  id: string,
  input: UpdatePhotographerInput,
  actorId: string
) {
  const photographer = await prisma.photographer.update({
    where: { id },
    data: {
      ...input,
      ...(input.socialLinks ? { socialLinks: input.socialLinks as Prisma.InputJsonValue } : {})
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'photographer.updated',
      entity: 'Photographer',
      entityId: id,
      actorId,
      metadata: { name: photographer.name, isFeatured: photographer.isFeatured }
    }
  });

  return photographer;
}

export async function deletePhotographer(id: string, actorId: string) {
  const photographer = await prisma.photographer.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      action: 'photographer.deleted',
      entity: 'Photographer',
      entityId: id,
      actorId,
      metadata: { name: photographer.name }
    }
  });

  return photographer;
}
