"use server";

import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import { z } from "zod";

const verifyTraderSchema = z.object({
  traderId: z.string(),
});

const rejectTraderSchema = z.object({
  traderId: z.string(),
  reason: z.string().optional(),
});

/**
 * Get all traders with stats for admin
 */
export const getTradersWithStats = async ({
  page = 1,
  pageSize = 10,
  search,
  verified,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  verified?: "all" | "verified" | "pending";
}) => {
  await getRequiredAdmin();

  const whereClause: Prisma.TraderProfileWhereInput = {};

  // Search filter
  if (search) {
    whereClause.OR = [
      { displayName: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Verified filter
  if (verified === "verified") {
    whereClause.verified = true;
  } else if (verified === "pending") {
    whereClause.verified = false;
  }

  const traders = await prisma.traderProfile.findMany({
    where: whereClause,
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const total = await prisma.traderProfile.count({
    where: whereClause,
  });

  // Get followers count and signals count for each trader
  const tradersWithStats = await Promise.all(
    traders.map(async (trader) => {
      const [followersCount, signalsCount] = await Promise.all([
        prisma.follow.count({
          where: {
            traderId: trader.userId,
            status: "ACTIVE",
          },
        }),
        prisma.signal.count({
          where: {
            traderId: trader.userId,
          },
        }),
      ]);

      return {
        ...trader,
        followersCount,
        signalsCount,
      };
    }),
  );

  const totalPages = Math.ceil(total / pageSize);

  return {
    traders: tradersWithStats,
    total,
    totalPages,
  };
};

/**
 * Admin action: Verify a trader
 */
export async function verifyTraderAction(
  data: z.infer<typeof verifyTraderSchema>,
) {
  await getRequiredAdmin();

  const { traderId } = verifyTraderSchema.parse(data);

  const updated = await prisma.traderProfile.update({
    where: { id: traderId },
    data: {
      verified: true,
      verifiedAt: new Date(),
    },
  });

  return {
    success: true,
    trader: updated,
  };
}

/**
 * Admin action: Reject/unverify a trader
 */
export async function rejectTraderAction(
  data: z.infer<typeof rejectTraderSchema>,
) {
  await getRequiredAdmin();

  const { traderId, reason } = rejectTraderSchema.parse(data);

  const updated = await prisma.traderProfile.update({
    where: { id: traderId },
    data: {
      verified: false,
      verifiedAt: null,
    },
  });

  // TODO: Send email to trader with rejection reason if provided

  return {
    success: true,
    trader: updated,
    reason,
  };
}

/**
 * Admin action: Delete a trader profile
 */
export async function deleteTraderAction(traderId: string) {
  await getRequiredAdmin();

  // This will cascade delete all signals
  await prisma.traderProfile.delete({
    where: { id: traderId },
  });

  return {
    success: true,
  };
}
