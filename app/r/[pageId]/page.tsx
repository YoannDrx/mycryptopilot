import type { PageParams } from "@/types/next";
import { notFound } from "next/navigation";
import { ReviewForm } from "../_components/review-form";
import { getPageById } from "../_queries/get-page-by-id.query";

export default async function ReviewPage(
  props: PageParams<{ pageId: string }>,
) {
  const params = await props.params;
  const page = await getPageById(params.pageId);

  if (!page) {
    notFound();
  }

  return <ReviewForm config={page.config} pageId={page.id} />;
}
