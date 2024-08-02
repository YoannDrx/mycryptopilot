import { getRequiredCurrentOrganizationCache } from "@/lib/react/cache";
import type { PageParams } from "@/types/next";
import { OrganizationDetailsForm } from "./(details)/OrganizationDetailsForm";

export default async function RoutePage(props: PageParams<{}>) {
  const { org: organization } = await getRequiredCurrentOrganizationCache([
    "ADMIN",
  ]);
  return <OrganizationDetailsForm defaultValues={organization} />;
}
