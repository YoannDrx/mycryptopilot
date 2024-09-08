"use server";

import { orgAction } from "@/lib/actions/safe-actions";
import { sendEmail } from "@/lib/mail/sendEmail";
import { deleteOrganizationQuery } from "@/query/org/org-delete.query";
import { SiteConfig } from "@/site-config";
import OrgConfirmDeletionEmail from "@email/OrgConfirmDeletion.email";

export const organizationDeleteAction = orgAction
  .metadata({ roles: ["OWNER"] })
  .action(async ({ ctx }) => {
    await deleteOrganizationQuery(ctx.org.id);

    await sendEmail({
      from: SiteConfig.email.from,
      subject: `Your organization has been deleted (${ctx.org.slug})`,
      to: ctx.user.email,
      react: OrgConfirmDeletionEmail({
        org: ctx.org.name,
      }),
    });
  });
