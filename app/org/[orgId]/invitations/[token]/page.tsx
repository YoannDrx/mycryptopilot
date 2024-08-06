import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingButton } from "@/features/form/SubmitButton";
import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { auth } from "@/lib/auth/helper";
import { combineWithParentMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import type { PageParams } from "@/types/next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

const TokenSchema = z.object({
  orgId: z.string(),
});

export const generateMetadata = combineWithParentMetadata({
  title: "Invitation",
  description: "You receive an invitation to join an organization.",
});

export default async function RoutePage(
  props: PageParams<{ orgId: string; token: string }>,
) {
  const organization = await prisma.organization.findUnique({
    where: {
      id: props.params.orgId,
    },
  });

  if (!organization) {
    return "Organization not found";
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: {
      token: props.params.token,
    },
  });

  if (!verificationToken) {
    return "Verification token not found";
  }

  const user = await auth();

  if (!user) {
    return (
      <Layout>
        <LayoutHeader>
          <LayoutTitle>
            You've been invited to join {organization.name}
          </LayoutTitle>
        </LayoutHeader>
        <LayoutContent>
          <Card>
            <CardHeader>
              <CardTitle>
                You need to be authenticated to join {organization.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                className={buttonVariants({ size: "lg" })}
                href={`/auth/signin?callbackUrl=${getServerUrl()}/org/${organization.id}/invitations/${props.params.token}`}
              >
                Sign in
              </Link>
            </CardContent>
          </Card>
        </LayoutContent>
      </Layout>
    );
  }

  if (verificationToken.identifier !== user.email) {
    return "Invalid token";
  }

  const tokenData = TokenSchema.parse(verificationToken.data);

  if (tokenData.orgId !== organization.id) {
    return "Invalid token";
  }

  // check if user is already a member
  const membership = await prisma.organizationMembership.findFirst({
    where: {
      organizationId: organization.id,
      userId: user.id,
    },
  });

  if (membership) {
    redirect(`/${organization.id}`);
  }

  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>
          You've been invited to join {organization.name}
        </LayoutTitle>
      </LayoutHeader>
      <LayoutContent>
        <Card>
          <CardHeader>
            <CardTitle>One last step to join {organization.name}</CardTitle>
            <CardDescription>
              By clicking on the button below, you agree to join{" "}
              {organization.name} as a member.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <LoadingButton
                formAction={async () => {
                  "use server";
                  await prisma.organizationMembership.create({
                    data: {
                      organizationId: organization.id,
                      userId: user.id,
                      role: "MEMBER",
                    },
                  });
                  await prisma.verificationToken.delete({
                    where: {
                      token: props.params.token,
                    },
                  });
                  redirect(`/org/${organization.id}`);
                }}
              >
                Join {organization.name}
              </LoadingButton>
            </form>
          </CardContent>
        </Card>
      </LayoutContent>
    </Layout>
  );
}
