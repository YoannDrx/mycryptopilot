import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UserActions } from "./_components/user-actions";
import { UserCryptoPayments } from "./_components/user-crypto-payments";
import { UserSessions } from "./_components/user-sessions";
import { UserDetailsCard } from "../../_components/user-details-card";
import { UserSubscriptionManagement } from "./_components/user-subscription-management";

export default async function RoutePage(props: {
  params: Promise<{ userId: string }>;
}) {
  const params = await props.params;
  await getRequiredAdmin();

  const userData = await prisma.user.findUnique({
    where: {
      id: params.userId,
    },
    include: {
      userSubscription: true,
      traderProfile: true,
    },
  });

  if (!userData) {
    notFound();
  }

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>User Details</LayoutTitle>
        <LayoutDescription>
          View and manage user information and subscription
        </LayoutDescription>
      </LayoutHeader>
      <LayoutActions>
        <UserActions user={userData} />
      </LayoutActions>

      <LayoutContent className="flex flex-col gap-4">
        <UserDetailsCard user={userData} />

        <UserSubscriptionManagement user={userData} />

        <UserCryptoPayments userId={userData.id} />

        {userData.traderProfile && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Trader Profile</CardTitle>
                  <CardDescription>User is a verified trader</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Status:</span>{" "}
                  <Badge
                    variant={
                      userData.traderProfile.verified ? "default" : "secondary"
                    }
                  >
                    {userData.traderProfile.verified ? "Verified" : "Pending"}
                  </Badge>
                </div>
                <div className="text-muted-foreground text-sm">
                  Bio: {userData.traderProfile.bio ?? "No bio"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <UserSessions userId={userData.id} />
      </LayoutContent>
    </Layout>
  );
}
