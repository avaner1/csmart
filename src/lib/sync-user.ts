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
      await matchBookOfBusiness(existing.id, fullName).catch(() => null);
    }
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

  await matchBookOfBusiness(user.id, fullName).catch(() => null);

  return prisma.user.findUnique({ where: { id: user.id } });
}
