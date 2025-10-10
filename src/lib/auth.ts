import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import {
  admin,
  emailOTP,
  lastLoginMethod,
  organization,
} from "better-auth/plugins";
import { ac, roles } from "./auth/auth-permissions";

import { sendEmail } from "@/lib/mail/send-email";
import { SiteConfig } from "@/site-config";
import MarkdownEmail from "@email/markdown.email";
import { setupResendCustomer } from "./auth/auth-config-setup";
import { env } from "./env";
import { generateSlug } from "./format/id";
import { logger } from "./logger";
import { prisma } from "./prisma";
import { getServerUrl } from "./server-url";
import { stripe } from "./stripe";
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
          // Setup Resend customer (non-blocking)
          void setupResendCustomer(user).catch((err) => {
            logger.error("Failed to setup Resend customer", { err });
          });

          // Create organization with retry (critical but should not block user creation)
          // Better Auth hooks should never throw - log errors instead
          const maxRetries = 3;
           
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              // eslint-disable-next-line no-await-in-loop
              await auth.api.createOrganization({
                body: {
                  name: `Account`, // Simplified name for MyCryptoPilot - this is a personal account, not a shared org
                  slug: generateSlug(user.id), // Use user ID for unique slug
                  logo: `${getServerUrl()}/images/account-logo.png`,
                  userId: user.id,
                  keepCurrentActiveOrganization: false,
                },
              });
              logger.info(`Organization created for user ${user.id}`);
              break; // Success, exit loop
            } catch (err) {
              logger.error(
                `Failed to create organization for user ${user.id} (attempt ${attempt}/${maxRetries})`,
                { err },
              );
              if (attempt < maxRetries) {
                // Wait before retry (exponential backoff)
                // eslint-disable-next-line no-await-in-loop
                await new Promise((resolve) =>
                  setTimeout(resolve, 100 * Math.pow(2, attempt)),
                );
              } else {
                // Last attempt failed - log critical error but don't throw
                logger.error(
                  `CRITICAL: Failed to create organization after ${maxRetries} attempts for user ${user.id}`,
                );
              }
            }
          }
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
  },
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
    organization({
      ac: ac,
      roles: roles,
      organizationLimit: 5,
      membershipLimit: 10,
      autoCreateOrganizationOnSignUp: true,

      organizationCreation: {
        async afterCreate(data) {
          const stripeCustomer = await stripe.customers.create({
            email: data.user.email,
            name: data.organization.name,
            metadata: {
              organizationId: data.organization.id,
            },
          });
          await prisma.organization.update({
            where: { id: data.organization.id },
            data: { stripeCustomerId: stripeCustomer.id },
          });
        },
      },
      async sendInvitationEmail({ id, email }) {
        const inviteLink = `${getServerUrl()}/orgs/accept-invitation/${id}`;
        await sendEmail({
          to: email,
          subject: "You are invited to join an organization",
          html: MarkdownEmail({
            preview: `Join an organization on ${SiteConfig.title}`,
            markdown: `
            Hello,

            You have been invited to join an organization on ${SiteConfig.title}.

            [Click here to accept the invitation](${inviteLink})
            `,
          }),
        });
      },
    }),
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
    // Warning: always last plugin
    nextCookies(),
  ],
});
