import { BookingStage, BookingStatus, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { customAlphabet } from 'nanoid';
import { prisma } from '../../lib/prisma.js';
import {
  BookingFilterInput,
  CreateBookingInput,
  PublicBookingInput,
  UpdateBookingInput,
  UpdateBookingProgressInput
} from './bookings.schema.js';

const referenceId = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);
const accessCodeGenerator = customAlphabet('0123456789', 6);

const defaultProgressTemplate: { stage: BookingStage; label: string; sortOrder: number }[] = [
  { stage: BookingStage.INQUIRY, label: '收到预约需求', sortOrder: 1 },
  { stage: BookingStage.CONSULTATION, label: '定制方案沟通', sortOrder: 2 },
  { stage: BookingStage.SHOOTING, label: '拍摄执行', sortOrder: 3 },
  { stage: BookingStage.EDITING, label: '后期剪辑', sortOrder: 4 },
  { stage: BookingStage.DELIVERY, label: '成片交付', sortOrder: 5 }
];

const bookingInclude = {
  service: true,
  photographer: true,
  progress: { orderBy: { sortOrder: 'asc' } }
} satisfies Prisma.BookingInclude;

function parseDate(value?: string) {
  return value ? new Date(value) : undefined;
}

export async function listBookings(input: BookingFilterInput) {
  const skip = (input.page - 1) * input.pageSize;
  const where: Prisma.BookingWhereInput = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.serviceId ? { serviceId: input.serviceId } : {}),
    ...(input.photographerId ? { photographerId: input.photographerId } : {}),
    ...(input.search
      ? {
          OR: [
            { clientName: { contains: input.search, mode: 'insensitive' } },
            { clientEmail: { contains: input.search, mode: 'insensitive' } },
            { reference: { contains: input.search, mode: 'insensitive' } }
          ]
        }
      : {}),
    ...(input.from || input.to
      ? {
          eventDate: {
            ...(input.from ? { gte: new Date(input.from) } : {}),
            ...(input.to ? { lte: new Date(input.to) } : {})
          }
        }
      : {})
  };

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      skip,
      take: input.pageSize,
      orderBy: { createdAt: 'desc' },
      include: bookingInclude
    })
  ]);

  return {
    data: bookings,
    pagination: {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.ceil(total / input.pageSize)
    }
  };
}

export async function getBooking(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: bookingInclude
  });
}

export async function getBookingByReference(reference: string) {
  return prisma.booking.findUnique({
    where: { reference },
    include: bookingInclude
  });
}

function mapCreateData(input: CreateBookingInput | PublicBookingInput) {
  return {
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    clientPhone: input.clientPhone,
    eventDate: parseDate(input.eventDate),
    venue: input.venue,
    note: input.note,
    serviceId: input.serviceId,
    photographerId: input.photographerId
  } satisfies Prisma.BookingUncheckedCreateInput;
}

async function ensureProgress(bookingId: string, actorId?: string, status?: BookingStatus) {
  for (const progress of defaultProgressTemplate) {
    await prisma.bookingProgress.upsert({
      where: { bookingId_stage: { bookingId, stage: progress.stage } },
      create: {
        bookingId,
        stage: progress.stage,
        label: progress.label,
        sortOrder: progress.sortOrder,
        completedAt:
          progress.stage === BookingStage.INQUIRY
            ? new Date()
            : progress.stage === BookingStage.CONSULTATION && status && status !== BookingStatus.INQUIRY
              ? new Date()
              : undefined,
        updatedById: actorId
      },
      update: {}
    });
  }
}

export async function createBooking(input: CreateBookingInput, actorId: string) {
  const reference = referenceId();
  const code = input.accessCode ?? accessCodeGenerator();
  const accessCodeHash = await bcrypt.hash(code, 10);

  const booking = await prisma.booking.create({
    data: {
      reference,
      ...mapCreateData(input),
      status: input.status ?? BookingStatus.INQUIRY,
      actorId,
      accessCodeHash
    },
    include: bookingInclude
  });

  await ensureProgress(booking.id, actorId, booking.status);

  await prisma.auditLog.create({
    data: {
      action: 'booking.created',
      entity: 'Booking',
      entityId: booking.id,
      actorId,
      metadata: { reference: booking.reference, status: booking.status }
    }
  });

  return { booking: await getBooking(booking.id), accessCode: code };
}

export async function updateBooking(id: string, input: UpdateBookingInput, actorId: string) {
  const booking = await prisma.booking.update({
    where: { id },
    data: {
      ...mapCreateData(input),
      ...(input.status ? { status: input.status } : {})
    },
    include: bookingInclude
  });

  await ensureProgress(id, actorId, booking.status);

  await prisma.auditLog.create({
    data: {
      action: 'booking.updated',
      entity: 'Booking',
      entityId: id,
      actorId,
      metadata: { status: booking.status, serviceId: booking.serviceId }
    }
  });

  return booking;
}

export async function updateBookingProgress(
  id: string,
  input: UpdateBookingProgressInput,
  actorId: string
) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return null;
  }

  for (const item of input.progress) {
    await prisma.bookingProgress.upsert({
      where: { bookingId_stage: { bookingId: id, stage: item.stage } },
      create: {
        bookingId: id,
        stage: item.stage,
        label: defaultProgressTemplate.find((p) => p.stage === item.stage)?.label ?? '进度更新',
        sortOrder: defaultProgressTemplate.find((p) => p.stage === item.stage)?.sortOrder ?? 99,
        completedAt: item.completed ? new Date() : undefined,
        note: item.note,
        updatedById: actorId
      },
      update: {
        completedAt: item.completed === undefined ? undefined : item.completed ? new Date() : null,
        note: item.note,
        updatedById: actorId
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      action: 'booking.progress.updated',
      entity: 'Booking',
      entityId: id,
      actorId,
      metadata: input.progress
    }
  });

  return getBooking(id);
}

export async function createPublicBooking(input: PublicBookingInput) {
  const reference = referenceId();
  const code = accessCodeGenerator();
  const accessCodeHash = await bcrypt.hash(code, 10);

  const booking = await prisma.booking.create({
    data: {
      reference,
      ...mapCreateData(input),
      status: BookingStatus.INQUIRY,
      accessCodeHash
    }
  });

  await ensureProgress(booking.id, undefined, booking.status);

  await prisma.auditLog.create({
    data: {
      action: 'booking.public.created',
      entity: 'Booking',
      entityId: booking.id,
      metadata: { reference: booking.reference, clientName: booking.clientName }
    }
  });

  return { reference, accessCode: code };
}

export async function getPublicBookingProgress(reference: string, code: string) {
  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: bookingInclude
  });

  if (!booking) {
    return null;
  }

  const valid = await bcrypt.compare(code, booking.accessCodeHash);
  if (!valid) {
    return false;
  }

  return booking;
}
