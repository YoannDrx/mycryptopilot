"use server";

import { authAction, orgAction } from "@/lib/actions/safe-actions";
import { sendEmail } from "@/lib/mail/sendEmail";
import { prisma } from "@/lib/prisma";
import OrganizationInvitationEmail from "@email/OrganizationInvitationEmail.email";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  OrganizationDetailsFormSchema,
  OrganizationMemberFormSchema,
} from "./settings.schema";

export const updateOrganizationMemberAction = authAction
  .schema(
    z.union([OrganizationDetailsFormSchema, OrganizationMemberFormSchema]),
  )
  .action(async ({ parsedInput: input }) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Update the data from the server and return the fresh data
    return input;
  });

export const updateOrganizationDetailsAction = orgAction
  .schema(OrganizationDetailsFormSchema)
  .metadata({
    roles: ["OWNER"],
  })
  .action(async ({ parsedInput, ctx }) => {
    const updatedOrganization = await prisma.organization.update({
      where: {
        id: ctx.org.id,
      },
      data: parsedInput,
    });

    return updatedOrganization;
  });

export const inviteUserInOrganizationAction = orgAction
  .metadata({
    roles: ["OWNER", "ADMIN"],
  })
  .schema(
    z.object({
      email: z.string().email(),
    }),
  )
  .action(async ({ parsedInput: { email }, ctx }) => {
    const verificationToken = await prisma.verificationToken.create({
      data: {
        identifier: email,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        token: nanoid(32),
        data: JSON.stringify({
          orgId: ctx.org.id,
        }),
      },
    });

    await sendEmail({
      to: email,
      subject: `Invitation to join ${ctx.org.name}`,
      react: OrganizationInvitationEmail({
        token: verificationToken.token,
        orgId: ctx.org.id,
        organizationName: ctx.org.name,
      }),
    });

    return { identifier: verificationToken.identifier };
  });
