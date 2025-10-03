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
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard - MyCryptoPilot",
  description: "Your trading signals feed and performance overview",
};

export default async function DashboardPage() {
  const org = await getRequiredCurrentOrgCache();

  // TODO: Fetch user's followed traders
  // TODO: Fetch recent signals from followed traders
  // TODO: Fetch user's trading stats

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
          <Button>
            <TrendingUp className="mr-2 size-4" />
            Follow Traders
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
              <div className="text-2xl font-bold">0</div>
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
              <div className="text-2xl font-bold">0</div>
              <p className="text-muted-foreground text-xs">
                Start following traders to see signals
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
                {org.subscription?.plan ?? "Free"}
              </div>
              <p className="text-muted-foreground text-xs">
                {org.subscription?.periodEnd
                  ? `Expires ${new Date(org.subscription.periodEnd).toLocaleDateString()}`
                  : "Upgrade to Pro for more features"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* No Traders Followed Alert */}
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>No traders followed yet</AlertTitle>
          <AlertDescription>
            Start by exploring our marketplace and following traders that match
            your trading style. You'll see their signals here.
            <Button variant="link" className="ml-2 p-0" asChild>
              <Link href="/traders">
                Browse Traders
                <ArrowUpRight className="ml-1 size-3" />
              </Link>
            </Button>
          </AlertDescription>
        </Alert>

        {/* Main Content Tabs */}
        <Tabs defaultValue="signals" className="space-y-4">
          <TabsList>
            <TabsTrigger value="signals">Signals Feed</TabsTrigger>
            <TabsTrigger value="journal">Trading Journal</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Signals Tab */}
          <TabsContent value="signals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Signals</CardTitle>
                <CardDescription>
                  Trading signals from traders you follow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                  <BarChart3 className="mb-4 size-12 opacity-20" />
                  <p className="mb-2 font-medium">No signals available</p>
                  <p className="text-sm">
                    Follow traders to start receiving trading signals
                  </p>
                </div>
              </CardContent>
            </Card>
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
                  <p className="mb-2 font-medium">No trades recorded yet</p>
                  <p className="text-sm">
                    Start logging your trades to build your journal
                  </p>
                  <Button className="mt-4" variant="outline">
                    Add First Trade
                  </Button>
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
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <TrendingUp className="size-6" />
              <span>Follow Traders</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <BarChart3 className="size-6" />
              <span>View Signals</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <BookOpen className="size-6" />
              <span>Add Trade</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <AlertCircle className="size-6" />
              <span>Risk Calculator</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
