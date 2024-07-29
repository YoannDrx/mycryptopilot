"use server";

import { authAction, organizationAction } from "@/lib/actions/safe-actions";
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

export const updateOrganizationDetailsAction = organizationAction
  .schema(OrganizationDetailsFormSchema)
  .metadata({
    roles: ["OWNER"],
  })
  .action(async ({ parsedInput, ctx }) => {
    const updatedOrganization = await prisma.organization.update({
      where: {
        id: ctx.organization.id,
      },
      data: parsedInput,
    });

    return updatedOrganization;
  });

export const inviteUserInOrganizationAction = organizationAction
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
          organizationId: ctx.organization.id,
        }),
      },
    });

    await sendEmail({
      to: email,
      subject: `Invitation to join ${ctx.organization.name}`,
      react: OrganizationInvitationEmail({
        token: verificationToken.token,
        organizationId: ctx.organization.id,
        organizationName: ctx.organization.name,
      }),
    });

    return { identifier: verificationToken.identifier };
  });
