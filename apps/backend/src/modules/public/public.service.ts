import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { createPublicBooking, getPublicBookingProgress } from '../bookings/bookings.service.js';
import { PublicBookingInput } from '../bookings/bookings.schema.js';
import { publicPortfolioFilterSchema, publicPhotographerFilterSchema } from './public.schema.js';

export async function getLandingContent() {
  const [hero, metrics, features, services, photographers, testimonials, faqs, portfolio] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: 'homepage.hero' } }),
    prisma.siteSetting.findUnique({ where: { key: 'homepage.metrics' } }),
    prisma.siteSetting.findUnique({ where: { key: 'homepage.features' } }),
    prisma.service.findMany({ where: { isActive: true }, orderBy: { isPopular: 'desc' }, take: 6 }),
    prisma.photographer.findMany({
      where: { isActive: true },
      orderBy: { isFeatured: 'desc' },
      take: 6,
      include: {
        portfolioItems: {
          select: { id: true, title: true, coverImageUrl: true },
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      }
    }),
    prisma.testimonial.findMany({ orderBy: { createdAt: 'desc' }, take: 6 }),
    prisma.faq.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.portfolioItem.findMany({
      where: { featured: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { photographer: { select: { id: true, name: true, avatarUrl: true } } }
    })
  ]);

  return {
    hero: hero?.value,
    metrics: metrics?.value,
    features: features?.value,
    services,
    photographers,
    testimonials,
    faqs,
    featuredPortfolio: portfolio
  };
}

export async function listPublicPhotographers(query: unknown) {
  const result = publicPhotographerFilterSchema.parse(query);
  return prisma.photographer.findMany({
    where: {
      isActive: true,
      ...(result.featured !== undefined ? { isFeatured: result.featured } : {})
    },
    orderBy: { createdAt: 'desc' },
    include: {
      portfolioItems: {
        select: { id: true, title: true, coverImageUrl: true, slug: true },
        orderBy: { createdAt: 'desc' },
        take: 6
      }
    }
  });
}

export async function listPublicServices() {
  return prisma.service.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
}

export async function listPublicPortfolio(query: unknown) {
  const result = publicPortfolioFilterSchema.parse(query);
  const skip = (result.page - 1) * result.pageSize;
  const where: Prisma.PortfolioItemWhereInput = {
    ...(result.category ? { categories: { has: result.category } } : {}),
    ...(result.photographer ? { photographer: { slug: result.photographer } } : {})
  };

  const [total, items] = await Promise.all([
    prisma.portfolioItem.count({ where }),
    prisma.portfolioItem.findMany({
      where,
      skip,
      take: result.pageSize,
      orderBy: { createdAt: 'desc' },
      include: { photographer: { select: { id: true, name: true, avatarUrl: true } } }
    })
  ]);

  return {
    data: items,
    pagination: {
      total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: Math.ceil(total / result.pageSize)
    }
  };
}

export async function createPublicBookingRequest(input: PublicBookingInput) {
  return createPublicBooking(input);
}

export async function getPublicProgress(reference: string, code: string) {
  return getPublicBookingProgress(reference, code);
}
