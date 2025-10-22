import { prisma } from "@/lib/prisma";

/**
 * Admin Review Queries
 *
 * Queries pour les admins pour review les activités suspectes
 */

/**
 * Get all suspicious invitations requiring review
 */
export async function getSuspiciousInvitations(params?: {
  limit?: number;
  offset?: number;
  reviewed?: boolean;
}) {
  const where = {
    isSuspicious: true,
    ...(params?.reviewed !== undefined && {
      reviewedAt: params.reviewed ? { not: null } : null,
    }),
  };

  const [invitations, total] = await Promise.all([
    prisma.traderInvitation.findMany({
      where,
      include: {
        trader: {
          select: {
            id: true,
            name: true,
            email: true,
            traderProfile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: params?.limit ?? 50,
      skip: params?.offset ?? 0,
    }),
    prisma.traderInvitation.count({ where }),
  ]);

  return {
    invitations,
    total,
    hasMore: total > (params?.offset ?? 0) + invitations.length,
  };
}

/**
 * Get all unresolved fraud logs
 */
export async function getUnresolvedFraudLogs(params?: {
  limit?: number;
  offset?: number;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  type?: string;
}) {
  const where = {
    resolved: false,
    ...(params?.severity && { severity: params.severity }),
    ...(params?.type && { type: params.type }),
  };

  const [logs, total] = await Promise.all([
    prisma.fraudLog.findMany({
      where,
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: params?.limit ?? 50,
      skip: params?.offset ?? 0,
    }),
    prisma.fraudLog.count({ where }),
  ]);

  return {
    logs,
    total,
    hasMore: total > (params?.offset ?? 0) + logs.length,
  };
}

/**
 * Get fraud logs for a specific trader
 */
export async function getTraderFraudLogs(traderId: string) {
  return prisma.fraudLog.findMany({
    where: { traderId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Mark invitation as reviewed
 */
export async function markInvitationReviewed(params: {
  invitationId: string;
  reviewedBy: string;
  clearSuspicion?: boolean;
}) {
  return prisma.traderInvitation.update({
    where: { id: params.invitationId },
    data: {
      reviewedAt: new Date(),
      reviewedBy: params.reviewedBy,
      ...(params.clearSuspicion && {
        isSuspicious: false,
        suspiciousReason: null,
      }),
    },
  });
}

/**
 * Mark fraud log as resolved
 */
export async function markFraudLogResolved(params: {
  fraudLogId: string;
  resolvedBy: string;
}) {
  return prisma.fraudLog.update({
    where: { id: params.fraudLogId },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: params.resolvedBy,
    },
  });
}

/**
 * Get fraud overview statistics
 */
export async function getFraudOverviewStats() {
  const [
    totalFraudLogs,
    unresolvedFraudLogs,
    suspiciousInvitations,
    unreviewedInvitations,
    fraudLogsBySeverity,
    fraudLogsByType,
  ] = await Promise.all([
    prisma.fraudLog.count(),
    prisma.fraudLog.count({ where: { resolved: false } }),
    prisma.traderInvitation.count({ where: { isSuspicious: true } }),
    prisma.traderInvitation.count({
      where: { isSuspicious: true, reviewedAt: null },
    }),
    prisma.fraudLog.groupBy({
      by: ["severity"],
      _count: true,
      where: { resolved: false },
    }),
    prisma.fraudLog.groupBy({
      by: ["type"],
      _count: true,
      where: { resolved: false },
    }),
  ]);

  const severityBreakdown = fraudLogsBySeverity.reduce(
    (acc, item) => {
      acc[item.severity] = item._count;
      return acc;
    },
    {} as Record<string, number>,
  );

  const typeBreakdown = fraudLogsByType.reduce(
    (acc, item) => {
      acc[item.type] = item._count;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    totalFraudLogs,
    unresolvedFraudLogs,
    suspiciousInvitations,
    unreviewedInvitations,
    severityBreakdown,
    typeBreakdown,
  };
}

/**
 * Get traders with most fraud alerts
 */
export async function getTradersWithMostFraud(limit = 10) {
  const logs = await prisma.fraudLog.groupBy({
    by: ["traderId"],
    _count: true,
    where: {
      traderId: { not: null },
      resolved: false,
    },
    orderBy: {
      _count: {
        traderId: "desc",
      },
    },
    take: limit,
  });

  // Get trader details
  const tradersData = await Promise.all(
    logs.map(async (log) => {
      if (!log.traderId) return null;

      const trader = await prisma.user.findUnique({
        where: { id: log.traderId },
        select: {
          id: true,
          name: true,
          email: true,
          traderProfile: {
            select: {
              displayName: true,
            },
          },
        },
      });

      return {
        trader,
        fraudCount: log._count,
      };
    }),
  );

  return tradersData.filter((t) => t !== null);
}
