/* eslint-disable no-console */
import { prisma } from "../src/lib/prisma";

async function main() {
  const email = "yoann.andrieux@gmail.com";

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, planName: true },
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  console.log("Current user:", user);

  // Update to ULTRA plan (expires in 90 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      planName: "ultra",
      planExpiresAt: expiresAt,
    },
  });

  console.log("\n✅ User upgraded to ULTRA!");
  console.log("New plan:", updated.planName);
  console.log("Expires:", updated.planExpiresAt?.toISOString());
}

void main();
