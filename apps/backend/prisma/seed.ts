import { PrismaClient, ProjectStatus, SessionStatus, SessionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

type SeedUser = {
  email: string;
  password: string;
  displayName: string;
  roles: string[];
};

const prisma = new PrismaClient();

const permissions = [
  { name: 'dashboard:view', description: 'View dashboard metrics' },
  { name: 'users:manage', description: 'Manage platform users' },
  { name: 'roles:manage', description: 'Manage roles and permissions' },
  { name: 'projects:read', description: 'View photography projects' },
  { name: 'projects:write', description: 'Create and update projects' },
  { name: 'sessions:read', description: 'View shooting sessions' },
  { name: 'sessions:write', description: 'Create and update shooting sessions' },
  { name: 'audit:view', description: 'View audit log entries' }
];

const roles = [
  {
    name: 'admin',
    description: 'Full access to all features',
    permissions: permissions.map((p) => p.name)
  },
  {
    name: 'editor',
    description: 'Manage projects and sessions',
    permissions: [
      'dashboard:view',
      'projects:read',
      'projects:write',
      'sessions:read',
      'sessions:write'
    ]
  },
  {
    name: 'viewer',
    description: 'View-only access to dashboard and read-only modules',
    permissions: ['dashboard:view', 'projects:read', 'sessions:read']
  }
];

const users: SeedUser[] = [
  {
    email: 'admin@jianhao.studio',
    password: 'changeme123',
    displayName: '超级管理员',
    roles: ['admin']
  },
  {
    email: 'editor@jianhao.studio',
    password: 'changeme123',
    displayName: '高级编辑',
    roles: ['editor']
  },
  {
    email: 'viewer@jianhao.studio',
    password: 'changeme123',
    displayName: '项目观察员',
    roles: ['viewer']
  }
];

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.project.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  await prisma.permission.createMany({ data: permissions });

  for (const role of roles) {
    await prisma.role.create({
      data: {
        name: role.name,
        description: role.description,
        permissions: {
          create: role.permissions.map((permissionName) => ({
            permission: { connect: { name: permissionName } }
          }))
        }
      }
    });
  }

  for (const seedUser of users) {
    const passwordHash = await bcrypt.hash(seedUser.password, 10);
    const createdUser = await prisma.user.create({
      data: {
        email: seedUser.email,
        passwordHash,
        displayName: seedUser.displayName,
        roles: {
          create: seedUser.roles.map((role) => ({
            role: {
              connect: {
                name: role
              }
            }
          }))
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'user.seeded',
        entity: 'User',
        entityId: createdUser.id,
        actorId: createdUser.id,
        metadata: {
          email: createdUser.email,
          roles: seedUser.roles
        }
      }
    });
  }

  const [admin] = await prisma.user.findMany({ where: { email: users[0].email } });

  const projectAlpha = await prisma.project.create({
    data: {
      title: '星光映画婚礼大片',
      client: '林 & 陈',
      status: ProjectStatus.IN_PROGRESS,
      budget: 48000,
      location: '上海星空礼堂',
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      notes: '高端婚礼，现场需要增设无人机航拍。',
      ownerId: admin?.id,
      sessions: {
        create: [
          {
            title: '婚礼彩排',
            sessionType: SessionType.EVENT,
            status: SessionStatus.SCHEDULED,
            scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
            location: '上海星空礼堂'
          },
          {
            title: '婚礼正片拍摄',
            sessionType: SessionType.WEDDING,
            status: SessionStatus.SCHEDULED,
            scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
            location: '上海星空礼堂'
          }
        ]
      }
    }
  });

  const projectCommercial = await prisma.project.create({
    data: {
      title: '幻彩美妆商业大片',
      client: 'Aurora Cosmetics',
      status: ProjectStatus.PLANNING,
      budget: 68000,
      location: '广州影棚2号',
      notes: '打造2024春季新品视觉主画面。',
      ownerId: admin?.id,
      sessions: {
        create: [
          {
            title: '创意脚本确认',
            sessionType: SessionType.COMMERCIAL,
            status: SessionStatus.DELIVERED,
            scheduledDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
            deliveryDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
            location: '远程会议',
            description: '完成创意脚本定稿与场景分镜讨论'
          },
          {
            title: '棚拍执行',
            sessionType: SessionType.COMMERCIAL,
            status: SessionStatus.SCHEDULED,
            scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
            location: '广州影棚2号'
          }
        ]
      }
    }
  });

  await prisma.session.create({
    data: {
      title: '旅拍踩点',
      sessionType: SessionType.TRAVEL,
      status: SessionStatus.EDITING,
      scheduledDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
      deliveryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      location: '日本京都',
      description: '旅拍素材剪辑中',
      project: { connect: { id: projectAlpha.id } },
      ownerId: admin?.id
    }
  });

  await prisma.auditLog.createMany({
    data: [
      {
        action: 'project.created',
        entity: 'Project',
        entityId: projectAlpha.id,
        metadata: { title: projectAlpha.title, client: projectAlpha.client },
        actorId: admin?.id
      },
      {
        action: 'project.created',
        entity: 'Project',
        entityId: projectCommercial.id,
        metadata: { title: projectCommercial.title, client: projectCommercial.client },
        actorId: admin?.id
      }
    ]
  });

  console.log('✅ Database seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
