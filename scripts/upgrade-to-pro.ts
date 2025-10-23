/* eslint-disable no-console */
import { prisma } from "@/lib/prisma";

async function upgradeUserToPro() {
  const email = "yoann.andrieux@gmail.com";

  console.log(`Searching for user: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      planName: true,
      planExpiresAt: true,
    },
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  console.log("Current user:", user);

  // Update to PRO plan with 90 days expiry
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // +90 days

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      planName: "pro",
      planExpiresAt: expiresAt,
    },
  });

  console.log("\n✅ User upgraded to PRO!");
  console.log({
    id: updated.id,
    email: updated.email,
    planName: updated.planName,
    planExpiresAt: updated.planExpiresAt?.toISOString(),
  });
}

upgradeUserToPro()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
