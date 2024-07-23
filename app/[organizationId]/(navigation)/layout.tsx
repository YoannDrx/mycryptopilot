import type { LayoutParams } from "@/types/next";
import { OrganizationNavigation } from "./_navigation/OrganizationNavigation";

export default async function RouteLayout(props: LayoutParams<{}>) {
  return <OrganizationNavigation>{props.children}</OrganizationNavigation>;
}
