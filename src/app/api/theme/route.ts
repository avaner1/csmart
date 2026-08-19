import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getOrCreateTheme() {
  let theme = await prisma.appTheme.findFirst();
  if (!theme) {
    theme = await prisma.appTheme.create({ data: {} });
  }
  return theme;
}

export async function GET() {
  const theme = await getOrCreateTheme();
  return NextResponse.json({ theme });
}

export async function PUT(request: NextRequest) {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const theme = await getOrCreateTheme();

  const updated = await prisma.appTheme.update({
    where: { id: theme.id },
    data: {
      accentColor: body.accentColor,
      cardBackground: body.cardBackground,
      cardBorder: body.cardBorder,
      sidebarBackground: body.sidebarBackground,
      pageBackground: body.pageBackground,
      primaryText: body.primaryText,
      secondaryText: body.secondaryText,
      cardBorderRadius: body.cardBorderRadius,
      cardSpacing: body.cardSpacing,
      sidebarWidth: body.sidebarWidth,
      fontSize: body.fontSize,
      badgeStyle: body.badgeStyle,
      animationsEnabled: body.animationsEnabled,
      showUrgencyColors: body.showUrgencyColors,
    },
  });

  return NextResponse.json({ theme: updated });
}
