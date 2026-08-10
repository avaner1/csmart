import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { matchBookOfBusiness } from "./match-book";

export async function syncUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const fullName =
    `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
    "Unknown";

  const existing = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (existing) {
    if (!existing.autoMatchedBook) {
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
      await matchBookOfBusiness(existing.id, fullName, email).catch(() => null);
    }
    await prisma.user.update({ where: { id: existing.id }, data: { lastLoginAt: new Date() } });
    return prisma.user.findUnique({ where: { id: existing.id } });
  }

  const user = await prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      name: fullName,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      image: clerkUser.imageUrl,
    },
  });

  const userEmail = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  await matchBookOfBusiness(user.id, fullName, userEmail).catch(() => null);

  return prisma.user.findUnique({ where: { id: user.id } });
}
