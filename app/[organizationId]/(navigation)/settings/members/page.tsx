import { prisma } from "@/lib/prisma";
import { getRequiredCurrentOrganizationCache } from "@/lib/react/cache";
import type { PageParams } from "@/types/next";
import { OrganizationMembersForm } from "./OrganizationMembersForm";

export default async function RoutePage(props: PageParams<{}>) {
  const { organization } = await getRequiredCurrentOrganizationCache(["ADMIN"]);
  const members = await prisma.organizationMembership.findMany({
    where: {
      organizationId: organization.id,
    },
    select: {
      user: {
        select: {
          image: true,
          id: true,
          name: true,
          email: true,
        },
      },
      id: true,
      role: true,
    },
  });
  return (
    <OrganizationMembersForm
      defaultValues={{
        members: members.map((m) => ({ role: m.role, id: m.user.id })),
      }}
      members={members.map((m) => ({ role: m.role, ...m.user }))}
    />
  );
}
