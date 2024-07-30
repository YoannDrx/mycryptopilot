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
      <LayoutContent>{props.children}</LayoutContent>
    </Layout>
  );
}
