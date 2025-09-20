import { prisma } from '../../lib/prisma.js';

export async function getOverview() {
  const [projectCount, sessionCount, inProgressCount, deliveredCount, recentAudit] = await Promise.all([
    prisma.project.count(),
    prisma.session.count(),
    prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.session.count({ where: { status: 'DELIVERED' } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        actor: { select: { displayName: true, email: true } }
      }
    })
  ]);

  const budgetAggregate = await prisma.project.aggregate({
    _sum: { budget: true },
    _avg: { budget: true }
  });

  const upcomingSessions = await prisma.session.findMany({
    where: {
      scheduledDate: { gte: new Date() }
    },
    take: 5,
    orderBy: { scheduledDate: 'asc' },
    include: {
      project: { select: { title: true } }
    }
  });

  return {
    metrics: {
      projectCount,
      sessionCount,
      inProgressCount,
      deliveredCount,
      totalBudget: budgetAggregate._sum.budget ?? 0,
      avgBudget: budgetAggregate._avg.budget ?? 0
    },
    recentAudit,
    upcomingSessions
  };
}
