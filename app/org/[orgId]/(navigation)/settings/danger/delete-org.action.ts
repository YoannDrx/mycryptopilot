"use server";

import { ActionError, orgAction } from "@/lib/actions/safe-actions";
import { sendEmail } from "@/lib/mail/sendEmail";
import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { deleteOrganizationQuery } from "@/query/org/org-delete.query";
import { SiteConfig } from "@/site-config";
import OrgAskDeletionEmail from "@email/OrgAskDeletion.email";
import OrgConfirmDeletionEmail from "@email/OrgConfirmDeletion.email";
import { addHours } from "date-fns";
import { nanoid } from "nanoid";
import { z } from "zod";

export const orgAskDeletionAction = orgAction
  .metadata({ roles: ["OWNER"] })
  .action(async ({ ctx }) => {
    const token = await prisma.verificationToken.create({
      data: {
        identifier: `${ctx.user.email}-${ctx.org.id}`,
        expires: addHours(new Date(), 1),
        data: {
          deleteOrg: true,
          orgId: ctx.org.id,
        },
        token: nanoid(32),
      },
    });

    await sendEmail({
      from: SiteConfig.email.from,
      subject: "[Action required] Confirm your organization deletion",
      to: ctx.user.email,
      react: OrgAskDeletionEmail({
        org: ctx.org.name,
        confirmUrl: `${getServerUrl()}/org/${ctx.org.id}/settings/danger/confirm?token=${token.token}`,
      }),
    });
  });

const TokenSchema = z.object({
  deleteOrg: z.boolean(),
  orgId: z.string(),
});

export const orgConfirmDeletionAction = orgAction
  .metadata({ roles: ["OWNER"] })
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

    const tokenData = TokenSchema.parse(verificationToken.data);

    if (!tokenData.deleteOrg) {
      throw new ActionError("Invalid token");
    }

    if (tokenData.orgId !== ctx.org.id) {
      throw new ActionError("Invalid token");
    }

    if (verificationToken.identifier !== `${ctx.user.email}-${ctx.org.id}`) {
      throw new ActionError("Invalid token");
    }

    if (verificationToken.expires < new Date()) {
      throw new ActionError("Token expired");
    }

    await deleteOrganizationQuery(ctx.org.id);

    await sendEmail({
      from: SiteConfig.email.from,
      subject: `Your organization has been deleted (${ctx.org.id})`,
      to: ctx.user.email,
      react: OrgConfirmDeletionEmail({
        org: ctx.org.name,
      }),
    });
  });
