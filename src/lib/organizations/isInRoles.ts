import { OrganizationMembershipRole } from "@prisma/client";

export const isInRoles = (
  rolesA: OrganizationMembershipRole[],
  rolesB: OrganizationMembershipRole[],
) => {
  return rolesA.some((role) => rolesB.includes(role));
};
