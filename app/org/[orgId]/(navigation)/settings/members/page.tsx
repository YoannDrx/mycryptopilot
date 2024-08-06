import { combineWithParentMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import type { PageParams } from "@/types/next";
import { OrgMembersForm } from "./OrgMembersForm";

export const generateMetadata = combineWithParentMetadata({
  title: "Members",
  description: "Manage your organization members.",
});

export default async function RoutePage(props: PageParams<{}>) {
  const { org } = await getRequiredCurrentOrgCache(["ADMIN"]);
  const members = await prisma.organizationMembership.findMany({
    where: {
      organizationId: org.id,
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

  const invitations = await prisma.verificationToken.findMany({
    where: {
      identifier: {
        endsWith: `-invite-${org.id}`,
      },
      expires: {
        gt: new Date(),
      },
    },
    select: {
      data: true,
    },
  });

  const invitedEmail = invitations
    .map((i) => (i?.data as { email?: string })?.email)
    .filter(Boolean) as string[];

  return (
    <OrgMembersForm
      defaultValues={{
        members: members.map((m) => ({ role: m.role, id: m.user.id })),
      }}
      members={members.map((m) => ({ role: m.role, ...m.user }))}
      invitedEmail={invitedEmail}
    />
  );
}
