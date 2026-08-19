-- CSMart schema setup (idempotent — safe to run multiple times)

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "image" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "slackAccessToken" TEXT,
    "slackTeamName" TEXT,
    "slackConnected" BOOLEAN NOT NULL DEFAULT false,
    "googleConnected" BOOLEAN NOT NULL DEFAULT false,
    "vertical" TEXT,
    "csManager" TEXT,
    "rhoCs" TEXT,
    "autoMatchedBook" BOOLEAN NOT NULL DEFAULT false,
    "coveringFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hiddenChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_clerkId_key" ON "User"("clerkId");

-- Add columns that may not exist on older tables
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hiddenChannels" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "coveringFor" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "autoMatchedBook" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vertical" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "csManager" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "rhoCs" TEXT;

CREATE TABLE IF NOT EXISTS "SavedItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "tags" TEXT[],
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SavedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "AdminItem" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "itemType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "link" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrencePattern" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AdminItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "CsmRoster" (
    "id" TEXT NOT NULL,
    "csmName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "manager" TEXT NOT NULL,
    "rho" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "cp" TEXT NOT NULL,
    "photoUrl" TEXT,
    "notes" TEXT,
    "lastUpdated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CsmRoster_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CsmRoster_email_idx" ON "CsmRoster"("email");
CREATE INDEX IF NOT EXISTS "CsmRoster_csmName_idx" ON "CsmRoster"("csmName");

CREATE TABLE IF NOT EXISTS "CsmAccount" (
    "id" TEXT NOT NULL,
    "csmName" TEXT NOT NULL,
    "corporateBrand" TEXT NOT NULL,
    "cp" TEXT NOT NULL,
    "rosterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CsmAccount_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CsmAccount_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "CsmRoster"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "CsmAccount_csmName_idx" ON "CsmAccount"("csmName");
CREATE INDEX IF NOT EXISTS "CsmAccount_corporateBrand_idx" ON "CsmAccount"("corporateBrand");

CREATE TABLE IF NOT EXISTS "AppTheme" (
    "id" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL DEFAULT '#1DB954',
    "cardBackground" TEXT NOT NULL DEFAULT '#181818',
    "cardBorder" TEXT NOT NULL DEFAULT '#282828',
    "sidebarBackground" TEXT NOT NULL DEFAULT '#000000',
    "pageBackground" TEXT NOT NULL DEFAULT '#121212',
    "primaryText" TEXT NOT NULL DEFAULT '#FFFFFF',
    "secondaryText" TEXT NOT NULL DEFAULT '#B3B3B3',
    "cardBorderRadius" INTEGER NOT NULL DEFAULT 8,
    "cardSpacing" TEXT NOT NULL DEFAULT 'comfortable',
    "sidebarWidth" TEXT NOT NULL DEFAULT 'default',
    "fontSize" TEXT NOT NULL DEFAULT 'medium',
    "badgeStyle" TEXT NOT NULL DEFAULT 'pill',
    "animationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "showUrgencyColors" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppTheme_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HandoffNote" (
    "id" TEXT NOT NULL,
    "rosterId" TEXT NOT NULL,
    "cpName" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "tags" TEXT[],
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HandoffNote_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HandoffNote_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "CsmRoster"("id") ON DELETE CASCADE,
    CONSTRAINT "HandoffNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "HandoffNote_rosterId_idx" ON "HandoffNote"("rosterId");
CREATE INDEX IF NOT EXISTS "HandoffNote_cpName_idx" ON "HandoffNote"("cpName");
CREATE INDEX IF NOT EXISTS "HandoffNote_authorId_idx" ON "HandoffNote"("authorId");

CREATE TABLE IF NOT EXISTS "Training" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "sourceUrl" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "assignedTo" TEXT NOT NULL DEFAULT 'all',
    "category" TEXT NOT NULL DEFAULT 'product-training',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Training_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Training_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Training_dueDate_idx" ON "Training"("dueDate");
CREATE INDEX IF NOT EXISTS "Training_assignedTo_idx" ON "Training"("assignedTo");

CREATE TABLE IF NOT EXISTS "TrainingCompletion" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'not-started',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingCompletion_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TrainingCompletion_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE,
    CONSTRAINT "TrainingCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "TrainingCompletion_trainingId_userId_key" UNIQUE ("trainingId", "userId")
);
CREATE INDEX IF NOT EXISTS "TrainingCompletion_userId_idx" ON "TrainingCompletion"("userId");

CREATE TABLE IF NOT EXISTS "QuickLink" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuickLink_pkey" PRIMARY KEY ("id")
);

-- Seed default theme if none exists
INSERT INTO "AppTheme" ("id", "updatedAt")
SELECT gen_random_uuid(), CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "AppTheme" LIMIT 1);
