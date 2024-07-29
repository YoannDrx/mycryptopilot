"use server";

import { ActionError, authAction } from "@/lib/actions/safe-actions";
import { sendEmail } from "@/lib/mail/sendEmail";
import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { stripe } from "@/lib/stripe";
import { SiteConfig } from "@/site-config";
import AccountDeletionAskedEmail from "@email/AccountDeletionAskedEmail.email";
import ConfirmationAccountDeletedEmail from "@email/ConfirmationAccountDeleted.email";
import { nanoid } from "nanoid";
import { z } from "zod";

export const askForAccountDeletionAction = authAction.action(
  async ({ ctx }) => {
    const userId = ctx.user.id;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        organization: {
          where: {
            role: "OWNER",
          },
          select: {
            organization: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new ActionError("You don't have an account!");
    }

    const token = await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        data: {
          deleteAccount: true,
        },
        token: nanoid(32),
      },
    });

    await sendEmail({
      from: SiteConfig.email.from,
      subject: "[Action required] Confirm your account deletion",
      to: user.email,
      react: AccountDeletionAskedEmail({
        email: user.email ?? "",
        organizationsToDelete: user.organization?.map(
          (o) => o.organization.name,
        ),
        confirmUrl: `${getServerUrl()}/account/delete/confirm?token=${token.token}`,
      }),
    });
  },
);

const TokenSchema = z.object({
  deleteAccount: z.boolean(),
});

export const confirmAccountDeletionAction = authAction
  .schema(
    z.object({
      token: z.string(),
    }),
  )
  .action(async ({ parsedInput: { token }, ctx }) => {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        token,
      },
    });

    if (!verificationToken) {
      throw new ActionError("Invalid token");
    }

    const tokenData = TokenSchema.parse(String(verificationToken.data));

    if (!tokenData.deleteAccount) {
      throw new ActionError("Invalid token");
    }

    if (verificationToken.identifier !== ctx.user.email) {
      throw new ActionError("Invalid token");
    }

    // first delete all organizations linked to the user
    const organizationsToDelete = await prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId: ctx.user.id,
            role: "OWNER",
          },
        },
      },
    });

    for await (const organization of organizationsToDelete) {
      if (!organization.stripeCustomerId) continue;

      const subscriptions = await stripe.subscriptions.list({
        customer: organization.stripeCustomerId,
      });

      for (const subscription of subscriptions.data) {
        await stripe.subscriptions.cancel(subscription.id);
      }
    }

    await prisma.organization.deleteMany({
      where: {
        id: {
          in: organizationsToDelete.map((o) => o.id),
        },
      },
    });

    await prisma.user.delete({
      where: {
        id: ctx.user.id,
      },
    });

    await prisma.verificationToken.delete({
      where: {
        token,
      },
    });

    await sendEmail({
      from: SiteConfig.email.from,
      subject: "Your account has been deleted",
      to: ctx.user.email,
      react: ConfirmationAccountDeletedEmail(),
    });
  });
