import { SettingsNavigation } from "@/features/layout/SettingsNavigation";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { combineWithParentMetadata } from "@/lib/metadata";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import type { LayoutParams } from "@/types/next";

export const generateMetadata = combineWithParentMetadata({
  title: "Settings",
  description: "Manage your organization settings.",
});

export default async function RouteLayout(
  props: LayoutParams<{ productId: string; orgId: string }>,
) {
  const { roles } = await getRequiredCurrentOrgCache();
  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>Organization</LayoutTitle>
        <LayoutDescription>
          The organization is the hub for your billing, members, and more.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent className="mt-8 flex items-start gap-4 max-lg:flex-col">
        <SettingsNavigation
          roles={roles}
          links={[
            {
              href: `/org/${props.params.orgId}/settings`,
              label: "General",
              roles: ["ADMIN"],
            },
            {
              href: `/org/${props.params.orgId}/settings/members`,
              label: "Members",
              roles: ["ADMIN"],
            },
            {
              href: `/org/${props.params.orgId}/settings/billing`,
              label: "Billing",
              roles: ["ADMIN"],
            },
            {
              href: `/org/${props.params.orgId}/settings/danger`,
              label: "Danger Zone",
              roles: ["OWNER"],
            },
          ]}
        />
        <div className="mb-12 w-full flex-1">{props.children}</div>
      </LayoutContent>
    </Layout>
  );
}
