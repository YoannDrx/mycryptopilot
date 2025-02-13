import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { BaseLayout } from "@/features/layout/base-layout";
import { Layout } from "@/features/page/layout";
import { Rabbit } from "lucide-react";
import Link from "next/link";

export default async function RoutePage() {
  return (
    <BaseLayout>
      <Layout>
        <Alert>
          <Rabbit className="size-4" />
          <div>
            <Typography variant="large">
              It looks like you are not logged in. Please sign in to access your
              account settings.
            </Typography>
            <Link
              href="/auth/signin"
              className={buttonVariants({
                className: "mt-2",
              })}
            >
              Sign in
            </Link>
          </div>
        </Alert>
      </Layout>
    </BaseLayout>
  );
}
