import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function syncUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const existing = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (existing) return existing;

  return prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      name:
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
        "Unknown",
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      image: clerkUser.imageUrl,
    },
  });
}
