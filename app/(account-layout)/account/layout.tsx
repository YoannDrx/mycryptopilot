import { SettingsNavigation } from "@/features/layout/SettingsNavigation";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { requiredAuth } from "@/lib/auth/helper";
import type { LayoutParams } from "@/types/next";

export default async function RouteLayout(
  props: LayoutParams<{ productId: string; organizationId: string }>,
) {
  const user = await requiredAuth();
  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>
          {user.name ? `${user.name}'s` : "Your"} Settings
        </LayoutTitle>
        <LayoutDescription>
          Edit your personal information and account details.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent className="mt-8 flex items-start gap-4 max-lg:flex-col">
        <SettingsNavigation
          links={[
            {
              href: `/account`,
              label: "General",
            },
            {
              href: `/account/email`,
              label: "Email",
            },
            {
              href: `/account/delete`,
              label: "Delete account",
            },
          ]}
        />
        <div className="w-full flex-1">{props.children}</div>
      </LayoutContent>
    </Layout>
  );
}
