-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'DELIVERED', 'ARCHIVED');
CREATE TYPE "SessionType" AS ENUM ('WEDDING', 'COMMERCIAL', 'PORTRAIT', 'EVENT', 'TRAVEL');
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'EDITING', 'DELIVERED', 'CANCELLED');
CREATE TYPE "BookingStatus" AS ENUM ('INQUIRY', 'PROPOSAL_SENT', 'CONFIRMED', 'SHOOTING', 'EDITING', 'DELIVERED', 'CANCELLED');
CREATE TYPE "BookingStage" AS ENUM ('INQUIRY', 'CONSULTATION', 'SHOOTING', 'EDITING', 'DELIVERY');

-- Core identity tables
CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Role" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Permission" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT
);

CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("userId", "roleId"),
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE
);

CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("roleId", "permissionId"),
    FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE,
    FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE
);

-- Platform activity tables
CREATE TABLE "AuditLog" (
    "id" TEXT PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    FOREIGN KEY ("actorId") REFERENCES "User"("id")
);

CREATE TABLE "Project" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "status" "ProjectStatus" DEFAULT 'PLANNING',
    "budget" DOUBLE PRECISION,
    "location" TEXT,
    "scheduledAt" TIMESTAMP WITH TIME ZONE,
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT,
    FOREIGN KEY ("ownerId") REFERENCES "User"("id")
);

CREATE TABLE "Session" (
    "id" TEXT PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sessionType" "SessionType" NOT NULL,
    "status" "SessionStatus" DEFAULT 'SCHEDULED',
    "scheduledDate" TIMESTAMP WITH TIME ZONE,
    "deliveryDate" TIMESTAMP WITH TIME ZONE,
    "location" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT,
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
    FOREIGN KEY ("ownerId") REFERENCES "User"("id")
);

CREATE TABLE "RefreshToken" (
    "id" TEXT PRIMARY KEY,
    "token" TEXT NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP WITH TIME ZONE,
    "userId" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Marketing & content tables
CREATE TABLE "Photographer" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "avatarUrl" TEXT,
    "bio" TEXT NOT NULL,
    "tagline" TEXT,
    "specialties" TEXT[] NOT NULL,
    "experienceYears" INTEGER DEFAULT 0,
    "accolades" TEXT[] NOT NULL,
    "socialLinks" JSONB,
    "isFeatured" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Service" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceFrom" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "deliverables" TEXT[] NOT NULL,
    "isPopular" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PortfolioItem" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "coverImageUrl" TEXT NOT NULL,
    "galleryImages" TEXT[] NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "shotDate" TIMESTAMP WITH TIME ZONE,
    "categories" TEXT[] NOT NULL,
    "featured" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "photographerId" TEXT,
    FOREIGN KEY ("photographerId") REFERENCES "Photographer"("id")
);

CREATE TABLE "Testimonial" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "message" TEXT NOT NULL,
    "rating" INTEGER DEFAULT 5,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Faq" (
    "id" TEXT PRIMARY KEY,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "SiteSetting" (
    "key" TEXT PRIMARY KEY,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    FOREIGN KEY ("updatedBy") REFERENCES "User"("id")
);

-- Booking tables
CREATE TABLE "Booking" (
    "id" TEXT PRIMARY KEY,
    "reference" TEXT NOT NULL UNIQUE,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT,
    "eventDate" TIMESTAMP WITH TIME ZONE,
    "venue" TEXT,
    "status" "BookingStatus" DEFAULT 'INQUIRY',
    "note" TEXT,
    "serviceId" TEXT,
    "photographerId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "accessCodeHash" TEXT NOT NULL,
    FOREIGN KEY ("serviceId") REFERENCES "Service"("id"),
    FOREIGN KEY ("photographerId") REFERENCES "Photographer"("id"),
    FOREIGN KEY ("actorId") REFERENCES "User"("id")
);

CREATE TABLE "BookingProgress" (
    "id" TEXT PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "stage" "BookingStage" NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "completedAt" TIMESTAMP WITH TIME ZONE,
    "note" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE,
    FOREIGN KEY ("updatedById") REFERENCES "User"("id"),
    UNIQUE ("bookingId", "stage")
);

-- Indices
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog" ("entity");
CREATE INDEX "AuditLog_actor_idx" ON "AuditLog" ("actorId");
CREATE INDEX "Project_status_idx" ON "Project" ("status");
CREATE INDEX "Session_project_idx" ON "Session" ("projectId");
CREATE INDEX "Session_status_idx" ON "Session" ("status");
CREATE INDEX "Photographer_active_idx" ON "Photographer" ("isActive");
CREATE INDEX "Service_active_idx" ON "Service" ("isActive");
CREATE INDEX "PortfolioItem_featured_idx" ON "PortfolioItem" ("featured");
CREATE INDEX "Booking_status_idx" ON "Booking" ("status");
CREATE INDEX "Booking_service_idx" ON "Booking" ("serviceId");
CREATE INDEX "BookingProgress_booking_idx" ON "BookingProgress" ("bookingId", "sortOrder");
