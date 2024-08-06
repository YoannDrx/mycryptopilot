import type { LayoutParams } from "@/types/next";
import { OrgNavigation } from "./_navigation/OrgNavigation";

export default async function RouteLayout(props: LayoutParams<{}>) {
  return <OrgNavigation>{props.children}</OrgNavigation>;
}
