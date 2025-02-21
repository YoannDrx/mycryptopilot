import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { CreatePageDialog } from "./_components/create-page-dialog";
import { PagesList } from "./_components/pages-list";

export default function PagesPage() {
  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>Review Pages</LayoutTitle>
        <LayoutDescription>
          Create and manage your review pages
        </LayoutDescription>
      </LayoutHeader>
      <LayoutActions>
        <CreatePageDialog />
      </LayoutActions>
      <LayoutContent>
        <PagesList />
      </LayoutContent>
    </Layout>
  );
}
