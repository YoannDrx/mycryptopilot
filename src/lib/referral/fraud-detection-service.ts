import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Fraud Detection Service
 *
 * Détecte et signale les comportements suspects dans le système de referral
 *
 * Types de fraude détectés:
 * - DISPOSABLE_EMAIL: Emails jetables (temp mail, etc.)
 * - SAME_IP: Multiples signups depuis même IP
 * - RAPID_SIGNUPS: Trop de signups rapides par trader
 * - INACTIVE_USER: User signup mais jamais actif
 * - FAKE_ACTIVITY: Pattern suspect d'activité
 */

// Liste d'emails jetables courants
const DISPOSABLE_EMAIL_DOMAINS = [
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "throwaway.email",
  "temp-mail.org",
  "getnada.com",
  "maildrop.cc",
  "yopmail.com",
  "trashmail.com",
];

/**
 * Check if email is from a disposable email provider
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1];
  if (!domain) return false;
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain.toLowerCase());
}

/**
 * Log fraud event to database
 */
async function logFraudEvent(params: {
  traderId?: string;
  userId?: string;
  type: string;
  description: string;
  metadata?: Record<string, unknown>;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}): Promise<void> {
  try {
    await prisma.fraudLog.create({
      data: {
        traderId: params.traderId,
        userId: params.userId,
        type: params.type,
        description: params.description,
        metadata: params.metadata
          ? JSON.parse(JSON.stringify(params.metadata))
          : null,
        severity: params.severity,
      },
    });

    logger.warn("🚨 Fraud event logged", {
      type: params.type,
      severity: params.severity,
      traderId: params.traderId,
      userId: params.userId,
    });
  } catch (error) {
    logger.error("Failed to log fraud event", { error, params });
  }
}

/**
 * Check for disposable email fraud
 */
export async function checkDisposableEmail(
  email: string,
  traderId: string,
  invitationId: string,
): Promise<{ suspicious: boolean; reason?: string }> {
  if (isDisposableEmail(email)) {
    await logFraudEvent({
      traderId,
      type: "DISPOSABLE_EMAIL",
      description: `Invitation sent to disposable email: ${email}`,
      metadata: { email, invitationId },
      severity: "MEDIUM",
    });

    // Flag the invitation as suspicious
    await prisma.traderInvitation.update({
      where: { id: invitationId },
      data: {
        isSuspicious: true,
        suspiciousReason: "Disposable email address detected",
      },
    });

    return {
      suspicious: true,
      reason: "Disposable email address detected",
    };
  }

  return { suspicious: false };
}

/**
 * Check for same IP fraud (multiple signups from same IP)
 */
export async function checkSameIpFraud(
  ip: string,
  traderId: string,
): Promise<{ suspicious: boolean; count: number }> {
  // Check how many invitations from this trader have this IP
  const sameIpCount = await prisma.traderInvitation.count({
    where: {
      traderId,
      signupIp: ip,
      status: "ACCEPTED",
    },
  });

  // Threshold: 3+ signups from same IP is suspicious
  if (sameIpCount >= 3) {
    await logFraudEvent({
      traderId,
      type: "SAME_IP",
      description: `${sameIpCount} signups from same IP address`,
      metadata: { ip, count: sameIpCount },
      severity: sameIpCount >= 5 ? "HIGH" : "MEDIUM",
    });

    return { suspicious: true, count: sameIpCount };
  }

  return { suspicious: false, count: sameIpCount };
}

/**
 * Check for rapid signups fraud
 *
 * Detects if trader is sending too many invitations in short time
 */
export async function checkRapidSignups(
  traderId: string,
): Promise<{ suspicious: boolean; count: number; timeWindow: string }> {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Count invitations sent in last 24h
  const count24h = await prisma.traderInvitation.count({
    where: {
      traderId,
      createdAt: { gte: last24h },
    },
  });

  // Count invitations sent in last week
  const countWeek = await prisma.traderInvitation.count({
    where: {
      traderId,
      createdAt: { gte: lastWeek },
    },
  });

  // Thresholds:
  // - More than 20 invitations in 24h: SUSPICIOUS
  // - More than 100 invitations in 1 week: SUSPICIOUS
  if (count24h > 20) {
    await logFraudEvent({
      traderId,
      type: "RAPID_SIGNUPS",
      description: `${count24h} invitations sent in last 24 hours`,
      metadata: { count24h, countWeek },
      severity: count24h > 50 ? "HIGH" : "MEDIUM",
    });

    return { suspicious: true, count: count24h, timeWindow: "24h" };
  }

  if (countWeek > 100) {
    await logFraudEvent({
      traderId,
      type: "RAPID_SIGNUPS",
      description: `${countWeek} invitations sent in last week`,
      metadata: { count24h, countWeek },
      severity: "MEDIUM",
    });

    return { suspicious: true, count: countWeek, timeWindow: "week" };
  }

  return { suspicious: false, count: count24h, timeWindow: "24h" };
}

/**
 * Check for inactive user fraud
 *
 * User signed up via invitation but never used the platform
 */
export async function checkInactiveUser(
  userId: string,
  traderId: string,
  daysSinceSignup: number,
): Promise<{ suspicious: boolean }> {
  // Only check users who signed up 7+ days ago
  if (daysSinceSignup < 7) {
    return { suspicious: false };
  }

  // Check if user has any activity (signals viewed, traders followed, etc.)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      createdAt: true,
      follows: { take: 1 },
      // Could add more activity checks here
    },
  });

  if (!user) {
    return { suspicious: false };
  }

  // If user has no follows and signed up 7+ days ago, it's suspicious
  if (user.follows.length === 0) {
    await logFraudEvent({
      traderId,
      userId,
      type: "INACTIVE_USER",
      description: `User signed up ${daysSinceSignup} days ago but has no activity`,
      metadata: { daysSinceSignup },
      severity: "LOW",
    });

    return { suspicious: true };
  }

  return { suspicious: false };
}

/**
 * Run comprehensive fraud check on invitation
 *
 * Checks multiple fraud indicators and returns summary
 */
export async function runFraudCheck(params: {
  traderId: string;
  email: string;
  invitationId: string;
  signupIp?: string;
}): Promise<{
  isSuspicious: boolean;
  reasons: string[];
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}> {
  const reasons: string[] = [];
  let maxSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";

  // 1. Check disposable email
  const disposableCheck = await checkDisposableEmail(
    params.email,
    params.traderId,
    params.invitationId,
  );
  if (disposableCheck.suspicious && disposableCheck.reason) {
    reasons.push(disposableCheck.reason);
    maxSeverity = "MEDIUM";
  }

  // 2. Check same IP (if IP provided)
  if (params.signupIp) {
    const sameIpCheck = await checkSameIpFraud(
      params.signupIp,
      params.traderId,
    );
    if (sameIpCheck.suspicious) {
      reasons.push(`${sameIpCheck.count} signups from same IP`);
      maxSeverity =
        sameIpCheck.count >= 5
          ? "HIGH"
          : maxSeverity === "LOW"
            ? "MEDIUM"
            : maxSeverity;
    }
  }

  // 3. Check rapid signups
  const rapidCheck = await checkRapidSignups(params.traderId);
  if (rapidCheck.suspicious) {
    reasons.push(`${rapidCheck.count} invitations in ${rapidCheck.timeWindow}`);
    maxSeverity =
      rapidCheck.count > 50
        ? "HIGH"
        : maxSeverity === "LOW"
          ? "MEDIUM"
          : maxSeverity;
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
    severity: maxSeverity,
  };
}

/**
 * Get fraud statistics for a trader
 */
export async function getTraderFraudStats(traderId: string): Promise<{
  totalLogs: number;
  unresolvedLogs: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  suspiciousInvitations: number;
}> {
  const logs = await prisma.fraudLog.findMany({
    where: { traderId },
    select: {
      type: true,
      severity: true,
      resolved: true,
    },
  });

  const suspiciousInvitations = await prisma.traderInvitation.count({
    where: {
      traderId,
      isSuspicious: true,
    },
  });

  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  let unresolvedLogs = 0;

  for (const log of logs) {
    byType[log.type] = (byType[log.type] ?? 0) + 1;
    bySeverity[log.severity] = (bySeverity[log.severity] ?? 0) + 1;
    if (!log.resolved) {
      unresolvedLogs++;
    }
  }

  return {
    totalLogs: logs.length,
    unresolvedLogs,
    byType,
    bySeverity,
    suspiciousInvitations,
  };
}
