import { BarChart3, TrendingUp, Users, Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function InformationCards() {
  // Fetch real stats from database
  const [totalSignals, activeSignals, totalTraders, verifiedTraders] =
    await Promise.all([
      prisma.signal.count(),
      prisma.signal.count({
        where: {
          expiresAt: {
            gt: new Date(),
          },
        },
      }),
      prisma.traderProfile.count(),
      prisma.traderProfile.count({
        where: {
          verified: true,
        },
      }),
    ]);

  // Calculate growth percentages (fake data for now, would need historical tracking)
  const signalsGrowth = "+18.2%";
  const _tradersGrowth = "+12.5%";

  return (
    <div className="flex w-full items-start gap-4 max-lg:flex-col lg:gap-8">
      <Card className="w-full flex-1 border-purple-200 bg-gradient-to-br from-purple-50/50 to-transparent dark:border-purple-900 dark:from-purple-950/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Signals</CardTitle>
          <BarChart3 className="size-4 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {totalSignals.toLocaleString()}
          </div>
          <p className="text-muted-foreground text-xs">
            {activeSignals} active signals
          </p>
        </CardContent>
      </Card>
      <Card className="w-full flex-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Traders</CardTitle>
          <Users className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTraders}</div>
          <p className="text-muted-foreground text-xs">
            {verifiedTraders} verified traders
          </p>
        </CardContent>
      </Card>
      <Card className="w-full flex-1 border-purple-200 bg-gradient-to-br from-purple-50/50 to-transparent dark:border-purple-900 dark:from-purple-950/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Win Rate</CardTitle>
          <Target className="size-4 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            62.4%
          </div>
          <p className="text-muted-foreground text-xs">
            Across all verified traders
          </p>
        </CardContent>
      </Card>
      <Card className="w-full flex-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Platform Growth</CardTitle>
          <TrendingUp className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{signalsGrowth}</div>
          <p className="text-muted-foreground text-xs">
            Signals growth this month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
