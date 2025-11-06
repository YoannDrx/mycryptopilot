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
import { Users, UserPlus, Signal as SignalIcon, Clock } from "lucide-react";

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

  // Fetch trader statistics if trader profile exists
  const traderStats = userData.traderProfile
    ? await Promise.all([
        // Followers count
        prisma.follow.count({
          where: {
            traderId: userData.id,
            status: "ACTIVE",
          },
        }),
        // Following count
        prisma.follow.count({
          where: {
            userId: userData.id,
            status: "ACTIVE",
          },
        }),
        // Total signals count
        prisma.signal.count({
          where: {
            traderId: userData.id,
          },
        }),
        // Recent signals count (last 30 days)
        prisma.signal.count({
          where: {
            traderId: userData.id,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ])
    : [0, 0, 0, 0];

  const [
    followersCount,
    followingCount,
    totalSignalsCount,
    recentSignalsCount,
  ] = traderStats;

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
                  <CardDescription>
                    Trading activity and statistics
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    userData.traderProfile.verified ? "default" : "secondary"
                  }
                >
                  {userData.traderProfile.verified ? "Verified" : "Pending"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Followers */}
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <Users className="text-muted-foreground h-8 w-8" />
                  <div>
                    <p className="text-2xl font-bold">{followersCount}</p>
                    <p className="text-muted-foreground text-sm">Followers</p>
                  </div>
                </div>

                {/* Following */}
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <UserPlus className="text-muted-foreground h-8 w-8" />
                  <div>
                    <p className="text-2xl font-bold">{followingCount}</p>
                    <p className="text-muted-foreground text-sm">Following</p>
                  </div>
                </div>

                {/* Total Signals */}
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <SignalIcon className="text-muted-foreground h-8 w-8" />
                  <div>
                    <p className="text-2xl font-bold">{totalSignalsCount}</p>
                    <p className="text-muted-foreground text-sm">
                      Total Signals
                    </p>
                  </div>
                </div>

                {/* Recent Signals */}
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <Clock className="text-muted-foreground h-8 w-8" />
                  <div>
                    <p className="text-2xl font-bold">{recentSignalsCount}</p>
                    <p className="text-muted-foreground text-sm">
                      Last 30 Days
                    </p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {userData.traderProfile.bio && (
                <div>
                  <p className="mb-2 text-sm font-medium">Biography</p>
                  <p className="text-muted-foreground text-sm">
                    {userData.traderProfile.bio}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <UserSessions userId={userData.id} />
      </LayoutContent>
    </Layout>
  );
}
