import { prisma } from '../../lib/prisma.js';
import { AuditFilterInput } from './audit.schema.js';

export async function listAuditLogs(input: AuditFilterInput) {
  const skip = (input.page - 1) * input.pageSize;
  const where = {
    ...(input.action ? { action: { contains: input.action, mode: 'insensitive' } } : {}),
    ...(input.actor ? { actor: { displayName: { contains: input.actor, mode: 'insensitive' } } } : {})
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: input.pageSize,
      include: {
        actor: { select: { id: true, displayName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return {
    data: logs,
    pagination: {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.ceil(total / input.pageSize)
    }
  };
}
