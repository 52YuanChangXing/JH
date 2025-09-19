import { prisma } from '../../lib/prisma.js';
import { CreateProjectInput, ProjectFilterInput, UpdateProjectInput } from './projects.schema.js';

function parseDate(value?: string) {
  return value ? new Date(value) : undefined;
}

export async function listProjects(input: ProjectFilterInput) {
  const skip = (input.page - 1) * input.pageSize;
  const where = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.search
      ? {
          OR: [
            { title: { contains: input.search, mode: 'insensitive' } },
            { client: { contains: input.search, mode: 'insensitive' } }
          ]
        }
      : {})
  };

  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      skip,
      take: input.pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, displayName: true } },
        sessions: true
      }
    })
  ]);

  return {
    data: projects,
    pagination: {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.ceil(total / input.pageSize)
    }
  };
}

export async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, displayName: true } },
      sessions: true
    }
  });
}

export async function createProject(input: CreateProjectInput, actorId: string) {
  const project = await prisma.project.create({
    data: {
      title: input.title,
      client: input.client,
      status: input.status,
      budget: input.budget,
      location: input.location,
      scheduledAt: parseDate(input.scheduledAt),
      notes: input.notes,
      ownerId: actorId
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'project.created',
      entity: 'Project',
      entityId: project.id,
      actorId,
      metadata: input
    }
  });

  return project;
}

export async function updateProject(id: string, input: UpdateProjectInput, actorId: string) {
  const project = await prisma.project.update({
    where: { id },
    data: {
      ...input,
      scheduledAt: parseDate(input.scheduledAt)
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'project.updated',
      entity: 'Project',
      entityId: id,
      actorId,
      metadata: input
    }
  });

  return project;
}

export async function deleteProject(id: string, actorId: string) {
  await prisma.session.deleteMany({ where: { projectId: id } });
  const project = await prisma.project.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      action: 'project.deleted',
      entity: 'Project',
      entityId: id,
      actorId,
      metadata: { title: project.title }
    }
  });

  return project;
}
