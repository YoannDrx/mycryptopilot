"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/mail/resend";
import { SiteConfig } from "@/site-config";
import { randomBytes } from "crypto";
import { checkUserHasTraderProfile } from "../trader/trader-queries";
import {
  getInvitationByToken,
  hasActiveInvitation,
} from "./invitation-queries";
import {
  AcceptInvitationSchema,
  DeleteInvitationSchema,
  InviteFollowerSchema,
  ResendInvitationSchema,
} from "./invitation.schema";
import { followTraderAction } from "../follow/follow.action";
import { isActionSuccessful } from "@/lib/actions/actions-utils";
import { TraderInvitationEmail } from "@email/trader-invitation";

/**
 * Action to invite a follower by email
 *
 * Creates invitation and sends email with magic link
 * Only traders can invite followers
 */
export const inviteFollowerByEmailAction = authAction
  .inputSchema(InviteFollowerSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    // Check if user is a trader
    const isTrader = await checkUserHasTraderProfile(user.id);

    if (!isTrader) {
      throw new ActionError(
        "You need to be a trader to invite followers. Create your trader profile first.",
      );
    }

    // Check if email is already invited
    const alreadyInvited = await hasActiveInvitation(
      user.id,
      parsedInput.email,
    );

    if (alreadyInvited) {
      throw new ActionError(
        "This email has already been invited and the invitation is still pending.",
      );
    }

    // Generate secure token (32 bytes = 64 hex chars)
    const token = randomBytes(32).toString("hex");

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Get trader profile for email
    const traderProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        traderProfile: {
          select: {
            displayName: true,
          },
        },
      },
    });

    const traderName =
      traderProfile?.traderProfile?.displayName ??
      traderProfile?.name ??
      "Trader";

    // Create invitation
    const invitation = await prisma.traderInvitation.create({
      data: {
        traderId: user.id,
        email: parsedInput.email,
        token,
        expiresAt,
        status: "PENDING",
      },
    });

    // Send email via Resend
    const invitationUrl = `${SiteConfig.appUrl}/invite/accept/${token}`;

    try {
      await resend.emails.send({
        from: SiteConfig.email.from,
        to: parsedInput.email,
        subject: `${traderName} invited you to follow them on MyCryptoPilot`,
        react: TraderInvitationEmail({
          traderName,
          invitationUrl,
        }),
      });
    } catch {
      // If email fails, delete the invitation
      await prisma.traderInvitation.delete({
        where: { id: invitation.id },
      });

      throw new ActionError(
        "Failed to send invitation email. Please try again later.",
      );
    }

    return {
      success: true,
      message: `Invitation sent to ${parsedInput.email}`,
      invitationId: invitation.id,
    };
  });

/**
 * Action to accept an invitation by token
 *
 * Validates token and automatically follows the trader
 */
export const acceptInvitationByTokenAction = authAction
  .inputSchema(AcceptInvitationSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    // Get invitation
    const invitation = await getInvitationByToken(parsedInput.token);

    if (!invitation) {
      throw new ActionError(
        "This invitation is invalid, expired, or has already been used.",
      );
    }

    // Check if user is trying to accept their own invitation
    if (invitation.traderId === user.id) {
      throw new ActionError("You cannot accept your own invitation.");
    }

    // Automatically follow the trader
    const followResult = await followTraderAction({
      traderId: invitation.traderId,
    });

    if (!isActionSuccessful(followResult)) {
      throw new ActionError(
        followResult.serverError ?? "Failed to follow trader",
      );
    }

    // Mark invitation as accepted
    await prisma.traderInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    const traderName =
      invitation.trader.traderProfile?.displayName ?? invitation.trader.name;

    // Get user's org slug for redirection
    const userMember = await prisma.member.findFirst({
      where: { userId: user.id },
      include: {
        organization: {
          select: {
            slug: true,
          },
        },
      },
    });

    const orgSlug = userMember?.organization.slug ?? "org-slug-default";

    return {
      success: true,
      message: `You're now following ${traderName}!`,
      traderId: invitation.traderId,
      traderName,
      orgSlug,
    };
  });

/**
 * Action to delete an invitation
 *
 * Only the trader who created the invitation can delete it
 */
export const deleteInvitationAction = authAction
  .inputSchema(DeleteInvitationSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    // Get invitation
    const invitation = await prisma.traderInvitation.findUnique({
      where: { id: parsedInput.invitationId },
    });

    if (!invitation) {
      throw new ActionError("Invitation not found");
    }

    // Check ownership
    if (invitation.traderId !== user.id) {
      throw new ActionError("You can only delete your own invitations");
    }

    // Delete invitation
    await prisma.traderInvitation.delete({
      where: { id: parsedInput.invitationId },
    });

    return {
      success: true,
      message: "Invitation deleted successfully",
    };
  });

/**
 * Action to resend an invitation
 *
 * Creates a new token and resends the email
 */
export const resendInvitationAction = authAction
  .inputSchema(ResendInvitationSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    // Get invitation
    const invitation = await prisma.traderInvitation.findUnique({
      where: { id: parsedInput.invitationId },
      include: {
        trader: {
          select: {
            name: true,
            traderProfile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!invitation) {
      throw new ActionError("Invitation not found");
    }

    // Check ownership
    if (invitation.traderId !== user.id) {
      throw new ActionError("You can only resend your own invitations");
    }

    // Check if already accepted
    if (invitation.status === "ACCEPTED") {
      throw new ActionError("This invitation has already been accepted");
    }

    // Generate new token
    const token = randomBytes(32).toString("hex");

    // Set new expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Update invitation with new token and expiration
    await prisma.traderInvitation.update({
      where: { id: parsedInput.invitationId },
      data: {
        token,
        expiresAt,
        status: "PENDING",
      },
    });

    const traderName =
      invitation.trader.traderProfile?.displayName ?? invitation.trader.name;

    // Resend email
    const invitationUrl = `${SiteConfig.appUrl}/invite/accept/${token}`;

    try {
      await resend.emails.send({
        from: SiteConfig.email.from,
        to: invitation.email,
        subject: `${traderName} invited you to follow them on MyCryptoPilot`,
        react: TraderInvitationEmail({
          traderName,
          invitationUrl,
        }),
      });
    } catch {
      throw new ActionError(
        "Failed to resend invitation email. Please try again later.",
      );
    }

    return {
      success: true,
      message: `Invitation resent to ${invitation.email}`,
    };
  });
