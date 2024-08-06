import { orgMetadata } from "@/lib/metadata";
import type { LayoutParams, PageParams } from "@/types/next";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: PageParams<{ orgId: string }>): Promise<Metadata> {
  console.log({ params });
  return orgMetadata(params.orgId);
}

export default async function RouteLayout(
  props: LayoutParams<{ orgId: string }>,
) {
  return <>{props.children}</>;
}
