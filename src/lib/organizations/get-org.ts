import { headers } from "next/headers";
import { unauthorized } from "next/navigation";
import { auth } from "../auth";
import type { AuthPermission, AuthRole } from "../auth/auth-permissions";
import { getSession } from "../auth/auth-user";
import { prisma } from "../prisma";
import { isInRoles } from "./is-in-roles";

type OrgParams = {
  roles?: AuthRole[];
  permissions?: AuthPermission;
  currentOrgId?: string;
  currentOrgSlug?: string;
};

const getOrg = async (params?: OrgParams) => {
  const user = await getSession();

  if (user?.session.activeOrganizationId) {
    return auth.api.getFullOrganization({
      headers: await headers(),
      query: {
        organizationId: user.session.activeOrganizationId ?? undefined,
      },
    });
  }

  if (params?.currentOrgId) {
    await auth.api.setActiveOrganization({
      headers: await headers(),
      body: {
        organizationId: params.currentOrgId,
      },
    });

    return getOrg();
  }

  if (params?.currentOrgSlug) {
    await auth.api.setActiveOrganization({
      headers: await headers(),
      body: {
        organizationSlug: params.currentOrgSlug,
      },
    });

    return getOrg();
  }

  const firstOrg = await prisma.organization.findFirst({
    where: {
      members: {
        some: { userId: user?.session.userId },
      },
    },
  });

  if (firstOrg) {
    await auth.api.setActiveOrganization({
      headers: await headers(),
      body: { organizationId: firstOrg.id },
    });

    return getOrg();
  }

  return null;
};

export const getCurrentOrg = async (params?: OrgParams) => {
  const user = await getSession();

  if (!user) {
    return null;
  }

  const org = await getOrg(params);

  if (!org) {
    return null;
  }

  const memberRoles = org.members
    .filter((member) => member.userId === user.session.userId)
    .map((member) => member.role);

  if (memberRoles.length === 0 || !isInRoles(memberRoles, params?.roles)) {
    return null;
  }

  if (params?.permissions) {
    const hasPermission = await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permission: params.permissions,
      },
    });

    if (!hasPermission.success) {
      return null;
    }
  }

  const subscriptions = await auth.api.listActiveSubscriptions({
    headers: await headers(),
    query: {
      referenceId: org.id,
    },
  });

  const currentSubscription = subscriptions.find(
    (s) =>
      s.referenceId === org.id &&
      (s.status === "active" || s.status === "trialing"),
  );

  const OWNER = org.members.find((m) => m.role === "owner");

  return {
    ...org,
    user: user.user,
    email: (OWNER?.user.email ?? null) as string | null,
    memberRoles: memberRoles,
    subscription: currentSubscription ?? null,
  };
};

export type CurrentOrgPayload = NonNullable<
  Awaited<ReturnType<typeof getCurrentOrg>>
>;

export const getRequiredCurrentOrg = async (params?: OrgParams) => {
  const result = await getCurrentOrg(params);

  if (!result) {
    unauthorized();
  }

  return result;
};
