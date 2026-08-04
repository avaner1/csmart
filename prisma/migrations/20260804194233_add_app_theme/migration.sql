-- CreateTable
CREATE TABLE "AppTheme" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppTheme_pkey" PRIMARY KEY ("id")
);
