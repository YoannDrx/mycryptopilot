import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubmitButton } from "@/features/form/SubmitButton";
import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { combineWithParentMetadata } from "@/lib/metadata";
import type { PageParams } from "@/types/next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { orgConfirmDeletionAction } from "../delete-org.action";

export const generateMetadata = combineWithParentMetadata({
  title: "Confirm deletion",
  description: "One last step to delete your organization.",
});

export default async function RoutePage(props: PageParams) {
  const token = props.searchParams.token;
  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>Confirm organization deletion</LayoutTitle>
      </LayoutHeader>
      <LayoutContent>
        <Card>
          <CardHeader>
            <CardTitle>
              Are you sure you want to delete your organization ?
            </CardTitle>
            <CardDescription>
              By clicking on the button below, you confirm that you want to
              delete your organization.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-end gap-2">
            <Link
              href="/organizations"
              className={buttonVariants({ variant: "outline" })}
            >
              Cancel
            </Link>
            <form>
              <SubmitButton
                formAction={async () => {
                  "use server";

                  await orgConfirmDeletionAction({
                    token: String(token),
                  });

                  redirect("/org");
                }}
              >
                Delete organization
              </SubmitButton>
            </form>
          </CardFooter>
        </Card>
      </LayoutContent>
    </Layout>
  );
}
