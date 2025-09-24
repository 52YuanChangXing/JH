import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import {
  CreatePortfolioInput,
  PortfolioFilterInput,
  UpdatePortfolioInput
} from './portfolio.schema.js';

function parseDate(value?: string) {
  return value ? new Date(value) : undefined;
}

export async function listPortfolio(input: PortfolioFilterInput) {
  const skip = (input.page - 1) * input.pageSize;
  const where: Prisma.PortfolioItemWhereInput = {
    ...(input.search
      ? {
          OR: [
            { title: { contains: input.search, mode: 'insensitive' } },
            { description: { contains: input.search, mode: 'insensitive' } }
          ]
        }
      : {}),
    ...(input.category ? { categories: { has: input.category } } : {}),
    ...(input.photographerId ? { photographerId: input.photographerId } : {}),
    ...(input.featured !== undefined ? { featured: input.featured } : {})
  };

  const [total, items] = await Promise.all([
    prisma.portfolioItem.count({ where }),
    prisma.portfolioItem.findMany({
      where,
      skip,
      take: input.pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        photographer: { select: { id: true, name: true, avatarUrl: true } }
      }
    })
  ]);

  return {
    data: items,
    pagination: {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.ceil(total / input.pageSize)
    }
  };
}

export async function createPortfolioItem(input: CreatePortfolioInput, actorId: string) {
  const item = await prisma.portfolioItem.create({
    data: {
      title: input.title,
      slug: input.slug,
      coverImageUrl: input.coverImageUrl,
      galleryImages: input.galleryImages,
      description: input.description,
      location: input.location,
      shotDate: parseDate(input.shotDate),
      categories: input.categories,
      featured: input.featured ?? false,
      photographer: input.photographerId ? { connect: { id: input.photographerId } } : undefined
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'portfolio.created',
      entity: 'PortfolioItem',
      entityId: item.id,
      actorId,
      metadata: { title: item.title, featured: item.featured }
    }
  });

  return item;
}

export async function updatePortfolioItem(id: string, input: UpdatePortfolioInput, actorId: string) {
  const item = await prisma.portfolioItem.update({
    where: { id },
    data: {
      ...input,
      ...(input.shotDate ? { shotDate: parseDate(input.shotDate) } : {}),
      ...(input.photographerId
        ? { photographer: { connect: { id: input.photographerId } } }
        : input.photographerId === null
          ? { photographer: { disconnect: true } }
          : {})
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'portfolio.updated',
      entity: 'PortfolioItem',
      entityId: id,
      actorId,
      metadata: { title: item.title, featured: item.featured }
    }
  });

  return item;
}

export async function deletePortfolioItem(id: string, actorId: string) {
  const item = await prisma.portfolioItem.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      action: 'portfolio.deleted',
      entity: 'PortfolioItem',
      entityId: id,
      actorId,
      metadata: { title: item.title }
    }
  });

  return item;
}
