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
        <LayoutTitle>Settings</LayoutTitle>
        <LayoutDescription>
          This is a modern form for your application. Feel free to edit it as
          you like.
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
          ]}
        />
        <div className="w-full flex-1">{props.children}</div>
      </LayoutContent>
    </Layout>
  );
}
