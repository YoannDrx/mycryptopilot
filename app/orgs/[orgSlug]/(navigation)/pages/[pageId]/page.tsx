import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { prisma } from "@/lib/prisma";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import type { PageParams } from "@/types/next";
import { notFound } from "next/navigation";
import { PageEditor } from "../_components/page-editor";

export default async function EditPagePage(
  props: PageParams<{ pageId: string }>,
) {
  const { org } = await getRequiredCurrentOrgCache();
  const params = await props.params;

  const page = await prisma.reviewPage.findUnique({
    where: {
      id: params.pageId,
      organizationId: org.id,
    },
  });

  if (!page) {
    notFound();
  }

  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>{page.name}</LayoutTitle>
        <LayoutDescription>
          Customize your review page and preview it in real-time
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <PageEditor page={page} />
      </LayoutContent>
    </Layout>
  );
}
