import { getRequiredUser } from "@/lib/auth/auth-user";
import { redirect } from "next/navigation";
import { getPlanLimits } from "@/lib/crypto/get-plan-limits";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyTradesList } from "@/components/copy-trading/copy-trades-list";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { Clock, TrendingUp, BookOpen } from "lucide-react";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";

/**
 * My Trades Page
 *
 * Issue #81 - Nouvelle page centralisée pour tracking trading:
 * - Copy Trades: Liste des copy trades (MANUAL/AUTO)
 * - Trading Journal: Suivi manuel des trades (Coming Soon)
 * - Performance: Métriques agrégées (Coming Soon)
 *
 * Restriction: PRO ou ULTRA plan
 */
export default async function MyTradesPage() {
  const user = await getRequiredUser();
  const userPlan = (user.planName ?? "free") as MyCryptoPilotPlanName;
  const planLimits = getPlanLimits(userPlan);

  // Paywall: PRO ou ULTRA only (riskConsole = PRO+)
  if (!planLimits.riskConsole) {
    redirect("/pricing?upgrade=pro&feature=my-trades");
  }

  // Fetch copy trades
  const copyTrades = await prisma.copyTrade.findMany({
    where: { userId: user.id },
    include: {
      originalTrade: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Trades</h1>
        <p className="text-muted-foreground mt-2">
          Track your copy trades, journal, and performance
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="copy-trades" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="copy-trades" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Copy Trades
            {copyTrades.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {copyTrades.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="journal" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Trading Journal
            <Badge variant="secondary" className="ml-1">
              Coming Soon
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Performance
            <Badge variant="secondary" className="ml-1">
              Coming Soon
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Copy Trades */}
        <TabsContent value="copy-trades">
          {copyTrades.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="text-muted-foreground mb-4 h-16 w-16" />
                <h3 className="mb-2 text-lg font-semibold">
                  No Copy Trades Yet
                </h3>
                <p className="text-muted-foreground mb-4 max-w-md text-center">
                  Start copying trades from verified traders to track them here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <CopyTradesList copyTrades={copyTrades} />
          )}
        </TabsContent>

        {/* Tab 2: Trading Journal (Placeholder) */}
        <TabsContent value="journal">
          <Card>
            <CardHeader>
              <CardTitle>Trading Journal</CardTitle>
              <CardDescription>
                Track your trades manually and analyze your performance
              </CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <BookOpen className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
              <h3 className="mb-2 text-lg font-semibold">Coming Soon</h3>
              <p className="text-muted-foreground mx-auto max-w-md">
                We're building a comprehensive trading journal to help you track
                and improve your trading performance. Features will include:
              </p>
              <ul className="text-muted-foreground mx-auto mt-4 max-w-md space-y-2 text-left">
                <li>• Manual trade entry</li>
                <li>• Trade notes and screenshots</li>
                <li>• Emotion tracking</li>
                <li>• Win/loss analysis</li>
                <li>• Strategy performance breakdown</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Performance (Placeholder) */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Detailed metrics and charts for your trading performance
              </CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <Clock className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
              <h3 className="mb-2 text-lg font-semibold">Coming Soon</h3>
              <p className="text-muted-foreground mx-auto max-w-md">
                We're building advanced performance analytics to help you
                understand your trading results. Features will include:
              </p>
              <ul className="text-muted-foreground mx-auto mt-4 max-w-md space-y-2 text-left">
                <li>• Total PnL and ROI</li>
                <li>• Win rate and profit factor</li>
                <li>• Sharpe ratio and drawdown</li>
                <li>• Performance curve charts</li>
                <li>• Returns distribution</li>
                <li>• Best/worst trades</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
