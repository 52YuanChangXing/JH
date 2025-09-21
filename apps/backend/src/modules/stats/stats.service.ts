import { BookingStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export async function getOverview() {
  const [
    projectCount,
    sessionCount,
    inProgressCount,
    deliveredCount,
    bookingCount,
    confirmedBookings,
    recentAudit
  ] = await Promise.all([
    prisma.project.count(),
    prisma.session.count(),
    prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.session.count({ where: { status: 'DELIVERED' } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.SHOOTING] } } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        actor: { select: { displayName: true, email: true } }
      }
    })
  ]);

  const [budgetAggregate, revenuePipeline] = await Promise.all([
    prisma.project.aggregate({
      _sum: { budget: true },
      _avg: { budget: true }
    }),
    prisma.booking.groupBy({
      by: ['status'],
      _count: { status: true }
    })
  ]);

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

  const upcomingBookings = await prisma.booking.findMany({
    where: {
      OR: [
        { status: BookingStatus.CONFIRMED },
        { status: BookingStatus.SHOOTING },
        { status: BookingStatus.PROPOSAL_SENT }
      ]
    },
    orderBy: { eventDate: 'asc' },
    take: 5,
    include: {
      service: { select: { name: true } },
      photographer: { select: { name: true } }
    }
  });

  return {
    metrics: {
      projectCount,
      sessionCount,
      inProgressCount,
      deliveredCount,
      totalBudget: budgetAggregate._sum.budget ?? 0,
      avgBudget: budgetAggregate._avg.budget ?? 0,
      bookingCount,
      confirmedBookings
    },
    bookingPipeline: revenuePipeline,
    recentAudit,
    upcomingSessions,
    upcomingBookings
  };
}
