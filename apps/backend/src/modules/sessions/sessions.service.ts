import { prisma } from '../../lib/prisma.js';
import { CreateSessionInput, SessionFilterInput, UpdateSessionInput } from './sessions.schema.js';

function parseDate(value?: string) {
  return value ? new Date(value) : undefined;
}

export async function listSessions(input: SessionFilterInput) {
  const skip = (input.page - 1) * input.pageSize;
  const where = {
    ...(input.projectId ? { projectId: input.projectId } : {}),
    ...(input.status ? { status: input.status } : {})
  };

  const [total, sessions] = await Promise.all([
    prisma.session.count({ where }),
    prisma.session.findMany({
      where,
      skip,
      take: input.pageSize,
      orderBy: { scheduledDate: 'desc' },
      include: {
        project: { select: { id: true, title: true } },
        owner: { select: { id: true, displayName: true } }
      }
    })
  ]);

  return {
    data: sessions,
    pagination: {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.ceil(total / input.pageSize)
    }
  };
}

export async function getSession(id: string) {
  return prisma.session.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, title: true } },
      owner: { select: { id: true, displayName: true } }
    }
  });
}

export async function createSession(input: CreateSessionInput, actorId: string) {
  const session = await prisma.session.create({
    data: {
      title: input.title,
      projectId: input.projectId,
      sessionType: input.sessionType,
      status: input.status,
      scheduledDate: parseDate(input.scheduledDate),
      deliveryDate: parseDate(input.deliveryDate),
      location: input.location,
      description: input.description,
      ownerId: actorId
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'session.created',
      entity: 'Session',
      entityId: session.id,
      actorId,
      metadata: input
    }
  });

  return session;
}

export async function updateSession(id: string, input: UpdateSessionInput, actorId: string) {
  const session = await prisma.session.update({
    where: { id },
    data: {
      ...input,
      scheduledDate: parseDate(input.scheduledDate),
      deliveryDate: parseDate(input.deliveryDate)
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'session.updated',
      entity: 'Session',
      entityId: id,
      actorId,
      metadata: input
    }
  });

  return session;
}

export async function deleteSession(id: string, actorId: string) {
  const session = await prisma.session.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      action: 'session.deleted',
      entity: 'Session',
      entityId: id,
      actorId,
      metadata: { title: session.title }
    }
  });
  return session;
}
