import { SettingsNavigation } from "@/features/layout/SettingsNavigation";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import type { LayoutParams } from "@/types/next";

export default async function RouteLayout(
  props: LayoutParams<{ productId: string; organizationId: string }>,
) {
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
          links={[
            {
              href: `/${props.params.organizationId}/settings`,
              label: "General",
            },
            {
              href: `/${props.params.organizationId}/settings/members`,
              label: "Members",
            },
            {
              href: `/${props.params.organizationId}/settings/billing`,
              label: "Billing",
            },
          ]}
        />
        <div className="w-full flex-1">{props.children}</div>
      </LayoutContent>
    </Layout>
  );
}
