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
import type { PageParams } from "@/types/next";
import Link from "next/link";
import { confirmAccountDeletionAction } from "../delete-account.action";

export default async function RoutePage(props: PageParams<{}>) {
  const token = props.searchParams.token;
  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>Confirm account deletion</LayoutTitle>
      </LayoutHeader>
      <LayoutContent>
        <Card>
          <CardHeader>
            <CardTitle>
              Are you sure you want to delete your account ?
            </CardTitle>
            <CardDescription>
              By clicking on the button below, you confirm that you want to
              delete your account.
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

                  await confirmAccountDeletionAction({
                    token: String(token),
                  });
                }}
              >
                Delete account
              </SubmitButton>
            </form>
          </CardFooter>
        </Card>
      </LayoutContent>
    </Layout>
  );
}
