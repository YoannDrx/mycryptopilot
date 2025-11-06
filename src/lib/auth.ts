import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import {
  admin,
  emailOTP,
  lastLoginMethod,
  multiSession,
} from "better-auth/plugins";

import { sendEmail } from "@/lib/mail/send-email";
import { SiteConfig } from "@/site-config";
import MarkdownEmail from "@email/markdown.email";
import { setupResendCustomer } from "./auth/auth-config-setup";
import { sendDiscordInviteEmail } from "./discord/invitations";
import { env } from "./env";
import { logger } from "./logger";
import { prisma } from "./prisma";
import { getServerUrl } from "./server-url";
type SocialProvidersType = Parameters<typeof betterAuth>[0]["socialProviders"];

export const SocialProviders: SocialProvidersType = {};

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  SocialProviders.github = {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  };
}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  SocialProviders.google = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  };
}

if (env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET) {
  SocialProviders.discord = {
    clientId: env.DISCORD_CLIENT_ID,
    clientSecret: env.DISCORD_CLIENT_SECRET,
    prompt: "consent",
  };
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: getServerUrl(),
  session: {
    expiresIn: 60 * 60 * 24 * 20, // 20 days
    updateAge: 60 * 60 * 24 * 7, // Refresh session every 7 days
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user, _req) => {
          // Initialize user with FREE plan (MyCryptoPilot default)
          // Note: Trial activation via referral is handled separately in the landing page flow
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                planName: "free",
                // planExpiresAt is null for free plan (no expiration)
                // trialEndsAt and trialPlan will be set by activateReferralTrial if user came from invite
              },
            });
            logger.info(`User ${user.id} initialized with FREE plan`);
          } catch (err) {
            logger.error("Failed to initialize user plan", {
              err,
              userId: user.id,
            });
          }

          // Setup Resend customer (non-blocking)
          void setupResendCustomer(user).catch((err) => {
            logger.error("Failed to setup Resend customer", { err });
          });

          // Send Discord invite email on first connection only (non-blocking)
          void (async () => {
            try {
              // Check if this is the first connection
              const userData = await prisma.user.findUnique({
                where: { id: user.id },
                select: { isFirstConnection: true },
              });

              if (userData?.isFirstConnection) {
                const userName = user.name || user.email.split("@")[0];
                await sendDiscordInviteEmail(user.email, userName);

                // Mark as no longer first connection
                await prisma.user.update({
                  where: { id: user.id },
                  data: { isFirstConnection: false },
                });

                logger.info(
                  `Discord invite email sent to ${user.email} (user: ${user.id}) - first connection`,
                );
              } else {
                logger.info(
                  `Skipping Discord invite email for ${user.email} (user: ${user.id}) - not first connection`,
                );
              }
            } catch (err) {
              logger.error("Failed to send Discord invite email", { err });
            }
          })();

          // ============================================
          // Create UserSubscription (Big Bang - Issue #77)
          // ============================================
          try {
            await prisma.userSubscription.create({
              data: {
                userId: user.id,
                plan: "free",
                status: "active",
                periodEnd: null, // Free plan has no expiration
              },
            });
            logger.info(`UserSubscription created for user ${user.id}`);
          } catch (err) {
            logger.error("Failed to create UserSubscription", {
              err,
              userId: user.id,
            });
            // Don't throw - user creation should not fail
          }
        },
      },
      delete: {
        before: async (user: { id: string }) => {
          // Better Auth provides basic user, fetch full user data from DB
          const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              email: true,
              name: true,
              discordId: true,
            },
          });

          if (!fullUser) {
            logger.error(`[USER DELETE] User ${user.id} not found in database`);
            throw new Error(`User ${user.id} not found`);
          }

          // Handle complete user deletion
          // This hook is called AFTER email confirmation, right before DB deletion
          logger.info(
            `[USER DELETE] Starting deletion flow for user ${fullUser.id}`,
          );

          // 1. Remove Discord access (if linked) - non-blocking
          if (fullUser.discordId) {
            const { removeUserFromDiscord } = await import(
              "./discord/user-management"
            );
            void removeUserFromDiscord(fullUser.discordId).catch((err) => {
              logger.error(
                `[USER DELETE] Failed to remove Discord access for user ${fullUser.id}`,
                { err },
              );
            });
          }

          // 2. Invalidate all sessions (logout) - critical, must complete
          logger.info(
            `[USER DELETE] Invalidating all sessions for user ${user.id}`,
          );
          await prisma.session.deleteMany({
            where: { userId: user.id },
          });

          // 3. Send goodbye email - non-blocking
          const { sendGoodbyeEmail } = await import("./mail/goodbye-email");
          void sendGoodbyeEmail(fullUser.email, fullUser.name).catch((err) => {
            logger.error(
              `[USER DELETE] Failed to send goodbye email to ${fullUser.email}`,
              { err },
            );
          });

          logger.info(
            `✅ [USER DELETE] Pre-deletion tasks completed for user ${user.id}`,
          );
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          // Send Discord invite email on first login (OAuth flow)
          // This handles the case where user logs in with OAuth for the first time
          void (async () => {
            try {
              const user = await prisma.user.findUnique({
                where: { id: session.userId },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  isFirstConnection: true,
                },
              });

              if (user?.isFirstConnection) {
                const userName = user.name || user.email.split("@")[0];
                await sendDiscordInviteEmail(user.email, userName);

                // Mark as no longer first connection
                await prisma.user.update({
                  where: { id: user.id },
                  data: { isFirstConnection: false },
                });

                logger.info(
                  `Discord invite email sent to ${user.email} (user: ${user.id}) - first login`,
                );
              }
            } catch (err) {
              logger.error("Failed to send Discord invite email on login", {
                err,
              });
            }
          })();
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          logger.info(
            `[DISCORD DEBUG] account.create.after hook triggered - providerId: ${account.providerId}, accountId: ${account.accountId}, userId: ${account.userId}`,
          );

          // Si l'utilisateur se connecte via Discord OAuth, sauvegarder son Discord ID
          if (account.providerId === "discord" && account.accountId) {
            try {
              logger.info(
                `[DISCORD DEBUG] Attempting to update user ${account.userId} with discordId ${account.accountId}`,
              );

              await prisma.user.update({
                where: { id: account.userId },
                data: { discordId: account.accountId },
              });

              logger.info(
                `✅ Discord ID ${account.accountId} automatically linked to user ${account.userId}`,
              );

              // Assigner le rôle Discord automatiquement (non-bloquant)
              // Ne pas bloquer si Discord n'est pas configuré (environnement de test)
              if (env.DISCORD_BOT_TOKEN && env.DISCORD_GUILD_ID) {
                const { assignRoleToUser } = await import("./discord/roles");
                const user = await prisma.user.findUnique({
                  where: { id: account.userId },
                  select: { planName: true },
                });

                if (user) {
                  const planName = (user.planName ?? "free") as
                    | "free"
                    | "pro"
                    | "ultra";
                  // Exécuter de manière non-bloquante pour éviter de ralentir l'auth
                  void assignRoleToUser(account.accountId, planName).then(
                    () => {
                      logger.info(
                        `Assigned Discord role ${planName.toUpperCase()} to user ${account.userId}`,
                      );
                    },
                  );
                }
              }
            } catch (err) {
              logger.error("Failed to save Discord ID", { err });
            }
          }
        },
      },
    },
  },
  advanced: {
    cookiePrefix: SiteConfig.appId,
    storeIPAddress: true, // Store user IP addresses in sessions
    useSecureCookies: env.NODE_ENV === "production",
  },
  trustedOrigins: [getServerUrl()],
  trustProxy: true, // Required to read IP from X-Forwarded-For header (Vercel, proxies)
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: MarkdownEmail({
          preview: `Reset your password for ${SiteConfig.title}`,
          markdown: `
          Hello,

          You requested to reset your password.

          [Click here to reset your password](${url})
          `,
        }),
      });
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ newEmail, url }) => {
        await sendEmail({
          to: newEmail,
          subject: "Change email address",
          html: MarkdownEmail({
            preview: `Change your email address for ${SiteConfig.title}`,
            markdown: `
            Hello,

            You requested to change your email address.

            [Click here to verify your new email address](${url})
            `,
          }),
        });
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, token }) => {
        const url = `${getServerUrl()}/auth/confirm-delete?token=${token}&callbackUrl=/auth/goodbye`;
        await sendEmail({
          to: user.email,
          subject: "Delete your account",
          html: MarkdownEmail({
            preview: `Delete your account from ${SiteConfig.title}`,
            markdown: `
            Hello,

            You requested to delete your account.

            [Click here to confirm account deletion](${url})
            `,
          }),
        });
      },
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        html: MarkdownEmail({
          preview: `Verify your email for ${SiteConfig.title}`,
          markdown: `
          Hello,

          Welcome to ${SiteConfig.title}! Please verify your email address.

          [Click here to verify your email](${url})
          `,
        }),
      });
    },
  },
  socialProviders: SocialProviders,
  plugins: [
    // Organization plugin removed - Big Bang (Issue #77 Phase 2)
    emailOTP({
      sendVerificationOTP: async ({ email, otp }) => {
        logger.debug("Sending OTP", { email, otp });
        await sendEmail({
          to: email,
          subject: `Your code to sign in to ${SiteConfig.title} ${otp}`,
          html: MarkdownEmail({
            preview: `Your code to sign in to ${SiteConfig.title}`,
            markdown: `
            Hello,

            Your code to sign in: **${otp}**

            [Or click here to sign in automatically](${getServerUrl()}/auth/signin/otp?email=${email}&otp=${otp})
            `,
          }),
        });
      },
    }),
    admin({}),
    lastLoginMethod({}),
    multiSession({
      maximumSessions: 5, // Allow up to 5 simultaneous sessions (different Discord accounts, etc.)
    }),
    // Warning: always last plugin
    nextCookies(),
  ],
});
