import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { getTraderProfileByUserId } from "@/features/trader/trader-queries";
import {
  countActiveSignalsByTrader,
  countTotalSignalsByTrader,
} from "@/features/signal/signal-queries";
import { prisma } from "@/lib/prisma";
import {
  BarChart3,
  DollarSign,
  PlusCircle,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { TraderSignalsList } from "./_components/trader-signals-list";
import { redirect } from "next/navigation";
import { ReferralLinkCard } from "@/components/nowts/referral-link-card";
import { InviteFollowerDialog } from "@/components/nowts/invite-follower-dialog";
import { InvitationsTable } from "@/components/nowts/invitations-table";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Trader Dashboard - MyCryptoPilot",
  description: "Manage your trading signals and track your performance",
};

export default async function TraderDashboardPage() {
  const org = await getRequiredCurrentOrgCache();
  const user = await getRequiredUser();

  // Fetch trader profile
  const traderProfile = await getTraderProfileByUserId(user.id);

  if (!traderProfile) {
    // Redirect to become trader page if no profile
    redirect("/account/become-trader");
  }

  // Fetch followers count
  const followersCount = await prisma.follow.count({
    where: {
      traderId: user.id,
      status: "ACTIVE",
    },
  });

  // Fetch signals count
  const activeSignalsCount = await countActiveSignalsByTrader(user.id);
  const totalSignalsCount = await countTotalSignalsByTrader(user.id);

  // Fetch trader stats from profile
  const stats = traderProfile.statsJson as {
    winrate?: number;
    payoff?: number;
    totalSignals?: number;
  } | null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Trader Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Create signals and manage your trading profile
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/trader/signals/new">
              <PlusCircle className="mr-2 size-4" />
              Create Signal
            </Link>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Followers</CardTitle>
              <Users className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{followersCount}</div>
              <p className="text-muted-foreground text-xs">
                {followersCount === 0
                  ? "No followers yet"
                  : "Growing your audience"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Signals
              </CardTitle>
              <BarChart3 className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSignalsCount}</div>
              <p className="text-muted-foreground text-xs">
                {totalSignalsCount} total published
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <TrendingUp className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.winrate ? `${stats.winrate.toFixed(1)}%` : "--%"}
              </div>
              <p className="text-muted-foreground text-xs">
                {stats?.winrate ? "Based on closed signals" : "No data yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-muted-foreground text-xs">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link Card */}
        <ReferralLinkCard
          traderId={user.id}
          traderName={traderProfile.displayName}
        />

        {/* Trader Status Card */}
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary">Trader Status</Badge>
              Not Verified
            </CardTitle>
            <CardDescription>
              Complete your profile and publish quality signals to get verified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="bg-background">
                  1/3
                </Badge>
                <span>Complete your trader profile</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="bg-background">
                  0/10
                </Badge>
                <span>Publish 10+ quality signals</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="bg-background">
                  0/5
                </Badge>
                <span>Get 5+ followers</span>
              </div>
            </div>
            <Button asChild className="mt-4" variant="outline">
              <Link href={`/orgs/${org.slug}/account/become-trader`}>
                Complete Profile
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="signals" className="space-y-4">
          <TabsList>
            <TabsTrigger value="signals">My Signals</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          {/* Signals Tab */}
          <TabsContent value="signals" className="space-y-4">
            <TraderSignalsList traderId={user.id} />
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Follower Invitations</CardTitle>
                    <CardDescription>
                      Invite people to follow you and receive your trading signals
                    </CardDescription>
                  </div>
                  <InviteFollowerDialog />
                </div>
              </CardHeader>
              <CardContent>
                <Suspense
                  fallback={
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  }
                >
                  <InvitationsTable traderId={user.id} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Your trading track record</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm font-medium">Win Rate</span>
                    <span className="text-2xl font-bold">--%</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm font-medium">Profit Factor</span>
                    <span className="text-2xl font-bold">-.-</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm font-medium">Max Drawdown</span>
                    <span className="text-2xl font-bold">--%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Trades</span>
                    <span className="text-2xl font-bold">0</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Follower Growth</CardTitle>
                  <CardDescription>Track your audience growth</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                    <Users className="mb-4 size-12 opacity-20" />
                    <p className="mb-2 font-medium">No follower data yet</p>
                    <p className="text-sm">
                      Start publishing signals to attract followers
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Performance Chart</CardTitle>
                  <CardDescription>Your equity curve over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                    <BarChart3 className="mb-4 size-12 opacity-20" />
                    <p className="mb-2 font-medium">
                      Not enough data to display chart
                    </p>
                    <p className="text-sm">
                      Complete at least 10 trades to see your performance chart
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>This Month</CardTitle>
                  <CardDescription>Revenue from subscriptions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$0.00</div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    0 active subscribers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Last Month</CardTitle>
                  <CardDescription>Previous month revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$0.00</div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    0 subscribers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All Time</CardTitle>
                  <CardDescription>Total earnings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$0.00</div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Since account creation
                  </p>
                </CardContent>
              </Card>

              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>Revenue History</CardTitle>
                  <CardDescription>Monthly revenue breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                    <DollarSign className="mb-4 size-12 opacity-20" />
                    <p className="mb-2 font-medium">No revenue data yet</p>
                    <p className="text-sm">
                      Get followers to start earning from your signals
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your trading profile</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Button
              asChild
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
            >
              <Link href={`/orgs/${org.slug}/dashboard/trader/signals/new`}>
                <PlusCircle className="size-6" />
                <span>Create Signal</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
            >
              <Link href={`/orgs/${org.slug}/signals`}>
                <BarChart3 className="size-6" />
                <span>Browse Signals</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
            >
              <Link href={`/orgs/${org.slug}/account/become-trader`}>
                <TrendingUp className="size-6" />
                <span>Edit Profile</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
