import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { getRequiredUser } from "@/lib/auth/auth-user";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  TrendingUp,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SignalsFeed } from "./_components/signals-feed";
import { prisma } from "@/lib/prisma";
import {
  hasUserJoinedDiscord,
  generatePermanentInvite,
} from "@/lib/discord/invitations";

export const metadata: Metadata = {
  title: "Dashboard - MyCryptoPilot",
  description: "Your trading signals feed and performance overview",
};

export default async function DashboardPage() {
  const user = await getRequiredUser();

  // Fetch user's followed traders count
  const followedTradersCount = await prisma.follow.count({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
  });

  // Fetch active signals count from followed traders
  const follows = await prisma.follow.findMany({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
    select: {
      traderId: true,
    },
  });

  let activeSignalsCount = 0;
  if (follows.length > 0) {
    activeSignalsCount = await prisma.signal.count({
      where: {
        traderId: {
          in: follows.map((f) => f.traderId),
        },
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  // Check if user has joined Discord
  const hasJoinedDiscord = await hasUserJoinedDiscord(user.discordId);
  const discordInviteUrl = !hasJoinedDiscord
    ? await generatePermanentInvite()
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back! Here's your trading activity overview.
            </p>
          </div>
          <Button asChild>
            <Link href="/traders">
              <TrendingUp className="mr-2 size-4" />
              Follow Traders
            </Link>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
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
                From traders you follow
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Traders Followed
              </CardTitle>
              <TrendingUp className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{followedTradersCount}</div>
              <p className="text-muted-foreground text-xs">
                {followedTradersCount === 0
                  ? "Start following traders to see signals"
                  : `Receiving signals from ${followedTradersCount} trader${followedTradersCount > 1 ? "s" : ""}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Plan</CardTitle>
              <BookOpen className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user.userSubscription?.plan ?? "Free"}
              </div>
              <p className="text-muted-foreground text-xs">
                {user.userSubscription?.periodEnd
                  ? `Expires ${new Date(user.userSubscription.periodEnd).toLocaleDateString()}`
                  : "Upgrade to Pro for more features"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Discord Connection Status (Phase 3.4) */}
        {process.env.DISCORD_BOT_ENABLED === "true" && (
          <Card
            className={
              hasJoinedDiscord
                ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
                : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"
            }
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle
                    className={
                      hasJoinedDiscord
                        ? "size-5 text-green-600"
                        : "size-5 text-amber-600"
                    }
                  />
                  <CardTitle className="text-base">
                    {hasJoinedDiscord
                      ? "Discord Connected"
                      : "Join our Discord"}
                  </CardTitle>
                </div>
                {hasJoinedDiscord && (
                  <Badge
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-1 size-3" />
                    Active
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {hasJoinedDiscord ? (
                <p className="text-sm text-green-700 dark:text-green-400">
                  Your Discord account is connected! You now receive trading
                  signals in real-time and have access to private channels of
                  the traders you follow. 🎉
                </p>
              ) : (
                <>
                  <p className="mb-4 text-sm text-amber-700 dark:text-amber-400">
                    Join our Discord community to receive real-time
                    notifications, access private trader channels, and connect
                    with the community!
                  </p>
                  {discordInviteUrl && (
                    <Button asChild variant="default" className="w-full">
                      <a
                        href={discordInviteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="mr-2 size-4" />
                        Join Discord
                      </a>
                    </Button>
                  )}
                  <p className="mt-3 text-xs text-amber-600 dark:text-amber-500">
                    💡 After joining, use{" "}
                    <code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-900">
                      /status
                    </code>{" "}
                    to link your account.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* No Traders Followed Alert */}
        {followedTradersCount === 0 && (
          <Alert>
            <AlertCircle className="size-4" />
            <AlertTitle>No traders followed yet</AlertTitle>
            <AlertDescription>
              Start by exploring our marketplace and following traders that
              match your trading style. You'll see their signals here.
              <Button variant="link" className="ml-2 p-0" asChild>
                <Link href="/traders">
                  Browse Traders
                  <ArrowUpRight className="ml-1 size-3" />
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="signals" className="space-y-4">
          <TabsList>
            <TabsTrigger value="signals">Signals Feed</TabsTrigger>
            <TabsTrigger value="journal">Trading Journal</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Signals Tab */}
          <TabsContent value="signals" className="space-y-4">
            <SignalsFeed userId={user.id} />
          </TabsContent>

          {/* Journal Tab */}
          <TabsContent value="journal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trading Journal</CardTitle>
                <CardDescription>
                  Track your trades and analyze your performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="mb-4 size-12 opacity-20" />
                  <p className="mb-2 font-medium">
                    Trading Journal Coming Soon
                  </p>
                  <p className="text-sm">
                    We're building a comprehensive trading journal to help you
                    track your performance. Stay tuned!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Win Rate</CardTitle>
                  <CardDescription>Your trading success rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">--%</span>
                    <Badge variant="secondary">No data</Badge>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Start trading to see your statistics
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profit Factor</CardTitle>
                  <CardDescription>
                    Average win vs average loss ratio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">-.-</span>
                    <Badge variant="secondary">No data</Badge>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Record trades to calculate your profit factor
                  </p>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Equity Curve</CardTitle>
                  <CardDescription>
                    Your account balance evolution over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                    <BarChart3 className="mb-4 size-12 opacity-20" />
                    <p className="mb-2 font-medium">
                      Not enough data to display chart
                    </p>
                    <p className="text-sm">
                      Complete at least 10 trades to see your equity curve
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
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Button
              asChild
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
            >
              <Link href="/traders">
                <TrendingUp className="size-6" />
                <span>Follow Traders</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
            >
              <Link href="/signals">
                <BarChart3 className="size-6" />
                <span>Browse Signals</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
