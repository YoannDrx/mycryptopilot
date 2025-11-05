/* eslint-disable no-console */
import { prisma } from "@/lib/prisma";
import { activateSubscription } from "@/lib/subscription/subscription-manager";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";

const PLAN: MyCryptoPilotPlanName = "ultra";

async function upgrade(plan: MyCryptoPilotPlanName) {
  const [, , emailArg, daysArg] = process.argv;

  if (!emailArg) {
    console.error(
      "Usage: pnpm tsx scripts/upgrade-to-ultra.ts <user-email> [daysGranted=30]",
    );
    process.exit(1);
  }

  // daysArg can be undefined at runtime despite ESLint thinking otherwise
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const daysGranted = Number.parseInt(daysArg ?? "30", 10);
  if (Number.isNaN(daysGranted) || daysGranted <= 0) {
    console.error("`daysGranted` must be a positive integer (default 30).");
    process.exit(1);
  }

  console.log(`🔎 Searching user by email: ${emailArg}`);

  const user = await prisma.user.findUnique({
    where: { email: emailArg },
    select: {
      id: true,
      email: true,
      name: true,
      planName: true,
      planExpiresAt: true,
    },
  });

  if (!user) {
    console.error(`User not found: ${emailArg}`);
    process.exit(1);
  }

  console.log("👤 Current plan:", {
    planName: user.planName,
    planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
  });

  const result = await activateSubscription({
    userId: user.id,
    plan,
    daysGranted,
    source: "admin",
  });

  if (!result.success) {
    console.error("❌ Upgrade failed:", result.error ?? "Unknown error");
    process.exit(1);
  }

  console.log("✅ Subscription upgraded!", {
    userId: user.id,
    email: user.email,
    plan,
    periodEnd: result.periodEnd?.toISOString() ?? null,
  });
}

upgrade(PLAN)
  .catch((error) => {
    console.error("❌ Unexpected error while upgrading plan:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
