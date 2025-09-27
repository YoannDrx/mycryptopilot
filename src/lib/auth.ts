import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, emailOTP, organization } from "better-auth/plugins";
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
          await setupResendCustomer(user);

          const emailName = user.email.slice(0, 8);
          try {
            await auth.api.createOrganization({
              body: {
                name: `${emailName}'s org`, // required
                slug: generateSlug(emailName), // required
                logo: `${getServerUrl()}/images/org-logo.png`,
                userId: user.id,
              },
            });
          } catch (err) {
            logger.error("Failed to create org", { err });
          }
        },
      },
    },
    account: {
      create: {
        after: async (account, _req) => {
          try {
            // Update user avatar when connecting with social provider
            const user = await prisma.user.findUnique({
              where: { id: account.userId },
            });

            if (user && !user.image) {
              let avatarUrl = null;

              // Extract avatar URL from provider-specific data
              if (account.providerId === "github" && account.accountId) {
                // GitHub stores the username in account.accountId
                avatarUrl = `https://github.com/${account.accountId}.png`;
              } else if (account.providerId === "google") {
                // For Google, check if we have avatar data in the idToken or other fields
                // The idToken might contain the picture URL
                if (account.idToken) {
                  try {
                    const decodedToken = JSON.parse(
                      Buffer.from(
                        account.idToken.split(".")[1],
                        "base64",
                      ).toString(),
                    );
                    avatarUrl = decodedToken.picture;
                  } catch {
                    // If we can't decode the token, try using accountId as fallback
                    avatarUrl = account.accountId;
                  }
                } else {
                  avatarUrl = account.accountId;
                }
              } else if (account.providerId === "discord") {
                // For Discord, we need to construct the avatar URL using the user ID and avatar hash
                // The format is: https://cdn.discordapp.com/avatars/{userId}/{avatar}.png
                if (account.accountId && account.id) {
                  // accountId might contain the Discord user ID, id might contain avatar hash
                  avatarUrl = `https://cdn.discordapp.com/avatars/${account.accountId}/${account.id}.png`;
                } else {
                  avatarUrl = account.accountId;
                }
              }

              if (avatarUrl) {
                await prisma.user.update({
                  where: { id: account.userId },
                  data: { image: avatarUrl },
                });
                logger.info("Updated user avatar from social provider", {
                  userId: account.userId,
                  provider: account.providerId,
                  avatarUrl,
                });
              }
            }
          } catch (error) {
            logger.error("Failed to update user avatar from social provider", {
              error,
            });
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
    // Warning: always last plugin
    nextCookies(),
  ],
});
