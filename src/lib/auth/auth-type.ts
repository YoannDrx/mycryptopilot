import type {
  Session as BetterAuthSession,
  User as BetterAuthUser,
} from "better-auth/types";

/**
 * Better Auth Organization Plugin Types
 *
 * These types are defined explicitly due to type inference issues
 * with InferAPI in Better Auth 1.3.8
 *
 * @see https://www.better-auth.com/docs/plugins/organization
 */

export type AuthOrganization = {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
  createdAt: Date;
  metadata: string | null;
};

export type AuthMember = {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: Date;
};

export type AuthInvitation = {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  expiresAt: Date;
  inviterId: string;
};

// Extended Session with organization support
export type AuthSession = BetterAuthSession & {
  activeOrganizationId: string | null;
};

// Extended User with role and discordId
export type AuthUser = BetterAuthUser & {
  role?: string;
  discordId?: string | null;
};

// Organization with members
export type AuthFullOrganization = AuthOrganization & {
  members: AuthMember[];
  invitations?: AuthInvitation[];
};
