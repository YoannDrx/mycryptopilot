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
import { UserSessions } from "./_components/user-sessions";
import { UserDetailsCard } from "../../_components/user-details-card";

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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>User subscription details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!userData.userSubscription ? (
              <div className="text-muted-foreground py-4 text-center">
                No active subscription (Free plan)
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          userData.userSubscription.status === "active"
                            ? "default"
                            : userData.userSubscription.status === "canceled"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {userData.userSubscription.plan.toUpperCase()}
                      </Badge>
                      <span className="text-muted-foreground text-sm">
                        {userData.userSubscription.status}
                      </span>
                    </div>
                    {userData.userSubscription.periodStart && (
                      <div className="text-muted-foreground text-sm">
                        Period:{" "}
                        {new Date(
                          userData.userSubscription.periodStart,
                        ).toLocaleDateString()}
                        {userData.userSubscription.periodEnd &&
                          ` → ${new Date(userData.userSubscription.periodEnd).toLocaleDateString()}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
