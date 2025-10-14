import { Button } from "@/components/ui/button";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrganizationCryptoPayments } from "./_components/organization-crypto-payments";
import { OrganizationCryptoSubscription } from "./_components/organization-crypto-subscription";

export default async function OrganizationDetailPage(
  props: PageProps<"/admin/organizations/[orgId]">,
) {
  await getRequiredAdmin();
  const params = await props.params;

  const organization = await prisma.organization.findUnique({
    where: {
      id: params.orgId,
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              planName: true,
              planExpiresAt: true,
            },
          },
        },
      },
      subscription: true,
    },
  });

  if (!organization) {
    notFound();
  }

  return (
    <Layout size="lg">
      <LayoutHeader>
        <div className="flex items-center gap-2">
          <Link href="/admin/organizations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Organizations
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <LayoutTitle>{organization.name}</LayoutTitle>
        </div>
        <LayoutDescription>
          Manage {organization.name}'s crypto subscription and payment history
        </LayoutDescription>
      </LayoutHeader>
      <LayoutActions />

      <LayoutContent>
        <div className="space-y-6">
          <OrganizationCryptoSubscription organization={organization} />
          <OrganizationCryptoPayments organizationId={organization.id} />
        </div>
      </LayoutContent>
    </Layout>
  );
}
