import { Prisma } from '@prisma/client';
import createError from 'http-errors';
import { prisma } from '../../lib/prisma.js';
import { faqSchema, siteSettingSchema, testimonialSchema, updateFaqSchema, updateTestimonialSchema } from './content.schema.js';

export async function listSiteSettings(keys?: string[]) {
  const where = keys ? { key: { in: keys } } : undefined;
  const settings = await prisma.siteSetting.findMany({ where });
  return settings;
}

export async function upsertSiteSetting(input: { key: string; value: unknown }, actorId: string) {
  siteSettingSchema.parse(input);
  const setting = await prisma.siteSetting.upsert({
    where: { key: input.key },
    create: { key: input.key, value: input.value as Prisma.InputJsonValue, updatedBy: actorId },
    update: { value: input.value as Prisma.InputJsonValue, updatedBy: actorId }
  });

  await prisma.auditLog.create({
    data: {
      action: 'content.setting.updated',
      entity: 'SiteSetting',
      entityId: setting.key,
      actorId,
      metadata: { key: setting.key }
    }
  });

  return setting;
}

export async function listTestimonials() {
  return prisma.testimonial.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createTestimonial(input: unknown, actorId: string) {
  const data = testimonialSchema.parse(input);
  const testimonial = await prisma.testimonial.create({ data });

  await prisma.auditLog.create({
    data: {
      action: 'content.testimonial.created',
      entity: 'Testimonial',
      entityId: testimonial.id,
      actorId,
      metadata: { name: testimonial.name }
    }
  });

  return testimonial;
}

export async function updateTestimonial(id: string, input: unknown, actorId: string) {
  const data = updateTestimonialSchema.parse(input);
  const testimonial = await prisma.testimonial.update({ where: { id }, data });

  await prisma.auditLog.create({
    data: {
      action: 'content.testimonial.updated',
      entity: 'Testimonial',
      entityId: id,
      actorId,
      metadata: { name: testimonial.name }
    }
  });

  return testimonial;
}

export async function deleteTestimonial(id: string, actorId: string) {
  const testimonial = await prisma.testimonial.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      action: 'content.testimonial.deleted',
      entity: 'Testimonial',
      entityId: id,
      actorId,
      metadata: { name: testimonial.name }
    }
  });

  return testimonial;
}

export async function listFaqs() {
  return prisma.faq.findMany({ orderBy: { sortOrder: 'asc' } });
}

export async function createFaq(input: unknown, actorId: string) {
  const data = faqSchema.parse(input);
  const faq = await prisma.faq.create({ data });

  await prisma.auditLog.create({
    data: {
      action: 'content.faq.created',
      entity: 'Faq',
      entityId: faq.id,
      actorId,
      metadata: { question: faq.question }
    }
  });

  return faq;
}

export async function updateFaq(id: string, input: unknown, actorId: string) {
  const data = updateFaqSchema.parse(input);
  const faq = await prisma.faq.update({ where: { id }, data });

  await prisma.auditLog.create({
    data: {
      action: 'content.faq.updated',
      entity: 'Faq',
      entityId: id,
      actorId,
      metadata: { question: faq.question }
    }
  });

  return faq;
}

export async function deleteFaq(id: string, actorId: string) {
  const faq = await prisma.faq.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      action: 'content.faq.deleted',
      entity: 'Faq',
      entityId: id,
      actorId,
      metadata: { question: faq.question }
    }
  });

  return faq;
}

export async function getRequiredSetting(key: string) {
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  if (!setting) {
    throw createError(404, `配置 ${key} 不存在`);
  }
  return setting;
}
