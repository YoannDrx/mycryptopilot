import { prisma } from "@/lib/prisma";
import { PageConfigSchema } from "../../orgs/[orgSlug]/(navigation)/pages/_schema/page-config.schema";

export async function getPageById(id: string) {
  const page = await prisma.reviewPage.findUnique({
    where: {
      id,
    },
  });

  if (!page) {
    return null;
  }

  const safeConfig = PageConfigSchema.safeParse(page.config);

  if (!safeConfig.success) {
    return null;
  }

  return {
    ...page,
    config: safeConfig.data,
  };
}
