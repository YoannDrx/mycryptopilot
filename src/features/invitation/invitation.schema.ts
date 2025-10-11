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
