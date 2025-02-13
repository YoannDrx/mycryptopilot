import { requiredAuth } from "@/lib/auth/helper";
import type { LayoutParams } from "@/types/next";
import type { Metadata } from "next";
import { AccountNavigation } from "./account-navigation";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your account settings.",
};

export default async function RouteLayout(props: LayoutParams) {
  const user = await requiredAuth();

  return (
    <div>
      <AccountNavigation emailVerified={Boolean(user.emailVerified)}>
        {props.children}
      </AccountNavigation>
    </div>
  );
}
