import {
  BookingStage,
  BookingStatus,
  PrismaClient,
  ProjectStatus,
  SessionStatus,
  SessionType
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { customAlphabet } from 'nanoid';

const prisma = new PrismaClient();

const nanoId = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);
const accessCode = customAlphabet('0123456789', 6);

const permissions = [
  { name: 'dashboard:view', description: 'View dashboard metrics' },
  { name: 'users:manage', description: 'Manage platform users' },
  { name: 'roles:manage', description: 'Manage roles and permissions' },
  { name: 'projects:read', description: 'View photography projects' },
  { name: 'projects:write', description: 'Create and update projects' },
  { name: 'sessions:read', description: 'View shooting sessions' },
  { name: 'sessions:write', description: 'Create and update shooting sessions' },
  { name: 'audit:view', description: 'View audit log entries' },
  { name: 'bookings:read', description: 'View booking inquiries' },
  { name: 'bookings:manage', description: 'Manage bookings and workflow' },
  { name: 'photographers:read', description: 'Browse photographer roster' },
  { name: 'photographers:manage', description: 'Maintain photographer profiles' },
  { name: 'services:read', description: 'View service catalogue' },
  { name: 'services:manage', description: 'Manage service catalogue' },
  { name: 'portfolio:read', description: 'View portfolio showcase' },
  { name: 'portfolio:manage', description: 'Curate portfolio showcase' },
  { name: 'content:manage', description: 'Manage marketing content & settings' }
];

const roles = [
  {
    name: 'admin',
    description: 'Full access to every feature',
    permissions: permissions.map((permission) => permission.name)
  },
  {
    name: 'editor',
    description: 'Manage bookings, content and production',
    permissions: [
      'dashboard:view',
      'projects:read',
      'projects:write',
      'sessions:read',
      'sessions:write',
      'bookings:read',
      'bookings:manage',
      'photographers:read',
      'photographers:manage',
      'services:read',
      'services:manage',
      'portfolio:read',
      'portfolio:manage',
      'content:manage'
    ]
  },
  {
    name: 'viewer',
    description: 'Read-only access to monitor progress',
    permissions: [
      'dashboard:view',
      'projects:read',
      'sessions:read',
      'bookings:read',
      'photographers:read',
      'services:read',
      'portfolio:read'
    ]
  }
];

const users = [
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
] as const;

const photographers = [
  {
    name: '简浩 · Jianhao',
    slug: 'jianhao',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
    bio: '简浩是简浩影视的创始人兼首席摄影总监，擅长以电影叙事手法记录人物故事。15年创作经验，作品屡获国际婚礼纪录摄影奖项。',
    tagline: '以电影质感记录每段动人故事',
    specialties: ['婚礼摄影', '纪实影像', '电影调色'],
    experienceYears: 15,
    accolades: ['WPPI 国际婚礼摄影大奖', 'AsiaWPA 金奖', '纽约婚礼电影节最佳影像'],
    socialLinks: {
      instagram: 'https://www.instagram.com/jianhao',
      wechat: 'jianhao-studio'
    },
    isFeatured: true
  },
  {
    name: '林可 · Lynn',
    slug: 'lynn',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e3',
    bio: '林可擅长时尚大片和商业广告视觉，服务过宝马、华为等知名品牌，以大胆的光影营造出独特的高级质感。',
    tagline: '构建品牌与视觉的高级对话',
    specialties: ['商业广告', '时尚大片', '创意光影'],
    experienceYears: 9,
    accolades: ['OneShow 青年创意奖', 'TIFA 时尚摄影大奖'],
    socialLinks: {
      behance: 'https://www.behance.net/lynnphoto',
      instagram: 'https://www.instagram.com/lynnvision'
    },
    isFeatured: true
  },
  {
    name: '宋晨 · Mason',
    slug: 'mason',
    avatarUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
    bio: '资深旅拍摄影师，足迹遍布50+城市，擅长捕捉自然光影和真实情绪，为情侣定制独一无二的旅拍体验。',
    tagline: '追光而行，定格旅途的悸动',
    specialties: ['旅拍', '情侣写真', '自然光影'],
    experienceYears: 7,
    accolades: ['PPAC 亚太摄影协会旅拍金奖'],
    socialLinks: {
      instagram: 'https://www.instagram.com/mason.travels'
    },
    isFeatured: false
  }
];

const services = [
  {
    name: '星光婚礼影像全案',
    slug: 'wedding-deluxe',
    summary: '从前期策划到后期电影级剪辑的一站式婚礼影像服务',
    description:
      '专业导演统筹，双机位拍摄搭配航拍，实时导播控台。后期提供电影级调色与独家定制影集。适合高端婚礼、大型仪式或目的地婚礼。',
    priceFrom: 52800,
    duration: 12,
    deliverables: ['12小时拍摄', '婚礼快剪', '主片电影', '动态花絮', '精修照片200张'],
    isPopular: true
  },
  {
    name: '品牌故事视觉大片',
    slug: 'brand-story',
    summary: '以电影叙事打造品牌故事，融合广告大片与纪录短片',
    description:
      '品牌调研+脚本创作+场景搭建+拍摄执行+后期合成，全链路打造品牌视觉资产。适用于新品发布、品牌升级、年度形象影片。',
    priceFrom: 68800,
    duration: 20,
    deliverables: ['分镜脚本', '幕后花絮', '1支主片', '多语言字幕', 'KV定帧'],
    isPopular: true
  },
  {
    name: '目的地旅拍纪实',
    slug: 'travel-journal',
    summary: '轻量旅拍团队随行记录，捕捉旅途与爱情的真实闪光',
    description:
      '双摄影师+造型师随行服务，根据旅途安排灵活拍摄。提供路线规划建议及服装搭配指引，适合旅拍婚纱、求婚、周年纪念。',
    priceFrom: 26800,
    duration: 8,
    deliverables: ['行前策划会议', '精修照片120张', '旅拍影像MV', '社交媒体剪辑'],
    isPopular: false
  }
];

const portfolioItems = [
  {
    title: '海岛星光婚礼 · Sanya Aurora',
    slug: 'sanya-aurora-wedding',
    coverImageUrl: 'https://images.unsplash.com/photo-1520854221050-0f4caff449fb',
    galleryImages: [
      'https://images.unsplash.com/photo-1520854221050-0f4caff449fb',
      'https://images.unsplash.com/photo-1519741497674-611481863552',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee'
    ],
    description: '以电影叙事手法记录的海岛婚礼大片，捕捉落日晚霞与星光夜景。',
    location: '中国 · 三亚',
    categories: ['婚礼', '目的地'],
    featured: true,
    photographerSlug: 'jianhao'
  },
  {
    title: '光影之境 · Aurora Cosmetics 2024',
    slug: 'aurora-cosmetics-2024',
    coverImageUrl: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5',
    galleryImages: [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
      'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f'
    ],
    description: '为国际美妆品牌打造的高端商业视觉大片，结合虚拟影棚与实景拍摄。',
    location: '中国 · 广州',
    categories: ['商业', '时尚'],
    featured: true,
    photographerSlug: 'lynn'
  },
  {
    title: '京都告白旅拍 · The Vow in Kyoto',
    slug: 'kyoto-travel-shoot',
    coverImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9',
    galleryImages: [
      'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e'
    ],
    description: '旅拍团队与新人走访京都私房景点，记录日式和风与自然光影下的浪漫瞬间。',
    location: '日本 · 京都',
    categories: ['旅拍', '情侣'],
    featured: false,
    photographerSlug: 'mason'
  }
];

const testimonials = [
  {
    name: 'Iris & Ethan',
    title: '婚礼新人',
    message:
      '从策划到现场，团队提供的专业程度远超预期。影片上映时所有人都被感动到了，我们会永远珍藏这份礼物。',
    rating: 5,
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e2'
  },
  {
    name: 'Aurora Cosmetics',
    title: '品牌市场总监',
    message:
      '团队深入理解品牌调性，最终交付的影像极具视觉冲击力，让新品发布会大获成功。',
    rating: 5,
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d'
  },
  {
    name: 'Lena & Marc',
    title: '旅拍客人',
    message:
      '旅拍过程中摄影师帮我们排解了很多紧张情绪，照片与影片都自然又高级，强烈推荐！',
    rating: 5,
    avatarUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429'
  }
];

const faqs = [
  {
    question: '如何预订拍摄档期？',
    answer: '填写线上预约表单后，顾问会在24小时内与您联系确认需求与档期，并安排试拍或线上沟通。',
    sortOrder: 1
  },
  {
    question: '是否提供旅拍服务？',
    answer: '我们支持全球旅拍，会根据目的地提供定制化行程建议与服务报价。',
    sortOrder: 2
  },
  {
    question: '成片交付周期多久？',
    answer: '婚礼类项目通常在6-8周交付，商业项目根据内容复杂度约3-6周，可提供加急服务。',
    sortOrder: 3
  }
];

const defaultProgress = [
  { stage: BookingStage.INQUIRY, label: '收到预约需求', sortOrder: 1 },
  { stage: BookingStage.CONSULTATION, label: '定制方案沟通', sortOrder: 2 },
  { stage: BookingStage.SHOOTING, label: '拍摄执行', sortOrder: 3 },
  { stage: BookingStage.EDITING, label: '后期剪辑', sortOrder: 4 },
  { stage: BookingStage.DELIVERY, label: '成片交付', sortOrder: 5 }
];

async function resetDatabase() {
  await prisma.bookingProgress.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.photographer.deleteMany();
  await prisma.service.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.session.deleteMany();
  await prisma.project.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
}

async function createRBAC() {
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
}

async function createUsers() {
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
              connect: { name: role }
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
        metadata: { email: createdUser.email, roles: seedUser.roles }
      }
    });
  }
}

async function createProductionData(adminId: string) {
  const createdPhotographers = await prisma.$transaction(
    photographers.map((photographer) =>
      prisma.photographer.create({
        data: {
          ...photographer,
          socialLinks: photographer.socialLinks as any
        }
      })
    )
  );

  const serviceRecords = await prisma.$transaction(
    services.map((service) =>
      prisma.service.create({
        data: service
      })
    )
  );

  for (const item of portfolioItems) {
    const photographer = createdPhotographers.find((p) => p.slug === item.photographerSlug);
    await prisma.portfolioItem.create({
      data: {
        title: item.title,
        slug: item.slug,
        coverImageUrl: item.coverImageUrl,
        galleryImages: item.galleryImages,
        description: item.description,
        location: item.location,
        categories: item.categories,
        featured: item.featured,
        photographer: photographer ? { connect: { id: photographer.id } } : undefined
      }
    });
  }

  await prisma.testimonial.createMany({ data: testimonials });
  await prisma.faq.createMany({ data: faqs });

  await prisma.siteSetting.create({
    data: {
      key: 'homepage.hero',
      value: {
        title: '简浩影视 · JIANHAO STUDIO',
        subtitle: '电影级影像打造品牌与爱情故事',
        description:
          '我们是一支横跨婚礼、商业与旅拍的影像团队，用镜头讲述动人故事。15年经验，1000+场次实战，服务客户覆盖全球城市。',
        ctaPrimary: '预约创意顾问',
        ctaSecondary: '查看作品集',
        background:
          'https://images.unsplash.com/photo-1520854221050-0f4caff449fb?auto=format&fit=crop&w=1600&q=80'
      }
    }
  });

  await prisma.siteSetting.create({
    data: {
      key: 'homepage.metrics',
      value: {
        experienceYears: 15,
        globalCities: 38,
        satisfaction: 99,
        awards: 32
      }
    }
  });

  await prisma.siteSetting.create({
    data: {
      key: 'homepage.features',
      value: [
        {
          title: '电影级影像语言',
          description: '导演制统筹 + 电影机拍摄 + 电影级调色，让每支作品具备高端质感。'
        },
        {
          title: '全流程服务体系',
          description: '从创意策划、现场执行到成片交付，一体化团队协作，效率更高。'
        },
        {
          title: '多维度交付资产',
          description: '视频、照片、社交媒体短内容、品牌素材一并交付，实现最大传播价值。'
        }
      ]
    }
  });

  // Create sample projects & sessions
  const projectWedding = await prisma.project.create({
    data: {
      title: '星光映画婚礼大片',
      client: '林 & 陈',
      status: ProjectStatus.IN_PROGRESS,
      budget: 52000,
      location: '上海星空礼堂',
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      notes: '高端婚礼，现场需要增设无人机航拍和实时导播。',
      ownerId: adminId,
      sessions: {
        create: [
          {
            title: '婚礼彩排',
            sessionType: SessionType.EVENT,
            status: SessionStatus.SCHEDULED,
            scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12),
            location: '上海星空礼堂',
            ownerId: adminId
          },
          {
            title: '婚礼正片拍摄',
            sessionType: SessionType.WEDDING,
            status: SessionStatus.SCHEDULED,
            scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
            location: '上海星空礼堂',
            ownerId: adminId
          }
        ]
      }
    }
  });

  await prisma.project.create({
    data: {
      title: 'Aurora Cosmetics 2024 视觉大片',
      client: 'Aurora Cosmetics',
      status: ProjectStatus.PLANNING,
      budget: 86000,
      location: '广州影棚2号',
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      notes: '打造2024春季新品视觉主画面与社交内容包。',
      ownerId: adminId,
      sessions: {
        create: [
          {
            title: '创意脚本研讨',
            sessionType: SessionType.COMMERCIAL,
            status: SessionStatus.DELIVERED,
            scheduledDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
            deliveryDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
            location: '远程会议室',
            description: '完成创意脚本定稿与场景分镜讨论',
            ownerId: adminId
          },
          {
            title: '棚拍执行',
            sessionType: SessionType.COMMERCIAL,
            status: SessionStatus.SCHEDULED,
            scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 28),
            location: '广州影棚2号',
            ownerId: adminId
          }
        ]
      }
    }
  });

  await prisma.auditLog.createMany({
    data: [
      {
        action: 'project.created',
        entity: 'Project',
        entityId: projectWedding.id,
        actorId: adminId,
        metadata: { title: projectWedding.title, client: projectWedding.client }
      }
    ]
  });

  const bookingCodes: { reference: string; code: string }[] = [];
  const serviceWedding = serviceRecords.find((service) => service.slug === 'wedding-deluxe');
  const serviceBrand = serviceRecords.find((service) => service.slug === 'brand-story');
  const photographerWedding = createdPhotographers.find((p) => p.slug === 'jianhao');
  const photographerCommercial = createdPhotographers.find((p) => p.slug === 'lynn');

  const bookingsData = [
    {
      clientName: '张楠',
      clientEmail: 'zhangnan@example.com',
      clientPhone: '+86 139 8888 1111',
      eventDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
      venue: '上海衡山路12号',
      status: BookingStatus.PROPOSAL_SENT,
      note: '希望婚礼影片带有电影感，保留父亲致辞片段。',
      serviceId: serviceWedding?.id,
      photographerId: photographerWedding?.id
    },
    {
      clientName: 'Aurora Cosmetics',
      clientEmail: 'marketing@aurora.com',
      clientPhone: '+86 10 8888 6666',
      eventDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25),
      venue: '广州影棚2号',
      status: BookingStatus.CONFIRMED,
      note: '品牌年度大片，希望结合虚拟拍摄技术，拍摄需要48小时。',
      serviceId: serviceBrand?.id,
      photographerId: photographerCommercial?.id
    }
  ];

  for (const booking of bookingsData) {
    const reference = nanoId();
    const code = accessCode();
    const accessCodeHash = await bcrypt.hash(code, 10);

    const createdBooking = await prisma.booking.create({
      data: {
        reference,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        clientPhone: booking.clientPhone,
        eventDate: booking.eventDate,
        venue: booking.venue,
        status: booking.status,
        note: booking.note,
        service: booking.serviceId ? { connect: { id: booking.serviceId } } : undefined,
        photographer: booking.photographerId ? { connect: { id: booking.photographerId } } : undefined,
        actorId: adminId,
        accessCodeHash
      }
    });

    for (const progress of defaultProgress) {
      await prisma.bookingProgress.create({
        data: {
          bookingId: createdBooking.id,
          stage: progress.stage,
          label: progress.label,
          sortOrder: progress.sortOrder,
          completedAt:
            progress.stage === BookingStage.INQUIRY
              ? createdBooking.createdAt
              : progress.stage === BookingStage.CONSULTATION && booking.status !== BookingStatus.INQUIRY
                ? new Date()
                : undefined,
          updatedById: adminId
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        action: 'booking.created',
        entity: 'Booking',
        entityId: createdBooking.id,
        actorId: adminId,
        metadata: {
          reference: createdBooking.reference,
          clientName: createdBooking.clientName,
          status: createdBooking.status
        }
      }
    });

    bookingCodes.push({ reference, code });
  }

  console.table(bookingCodes.map((entry) => ({
    reference: entry.reference,
    accessCode: entry.code
  })));
}

async function main() {
  console.log('🌱 Seeding database for Jianhao Studio...');

  await resetDatabase();
  await createRBAC();
  await createUsers();

  const adminUser = await prisma.user.findFirst({ where: { email: users[0].email } });

  if (!adminUser) {
    throw new Error('Admin user not created');
  }

  await createProductionData(adminUser.id);

  console.log('✅ Seed completed. 上表显示了示例预约的 reference 与访问口令，方便前端演示。');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
