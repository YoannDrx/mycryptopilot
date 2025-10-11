import { z } from "zod";

/**
 * Schema for inviting a follower by email
 */
export const InviteFollowerSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .toLowerCase()
    .transform((val) => val.trim()),
});

export type InviteFollowerType = z.infer<typeof InviteFollowerSchema>;

/**
 * Schema for accepting an invitation by token
 */
export const AcceptInvitationSchema = z.object({
  token: z.string().min(32, "Invalid invitation token"),
});

export type AcceptInvitationType = z.infer<typeof AcceptInvitationSchema>;

/**
 * Schema for deleting an invitation
 */
export const DeleteInvitationSchema = z.object({
  invitationId: z.string().cuid("Invalid invitation ID"),
});

export type DeleteInvitationType = z.infer<typeof DeleteInvitationSchema>;

/**
 * Schema for resending an invitation
 */
export const ResendInvitationSchema = z.object({
  invitationId: z.string().cuid("Invalid invitation ID"),
});

export type ResendInvitationType = z.infer<typeof ResendInvitationSchema>;
