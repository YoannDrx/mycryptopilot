import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { TrendingUp, Users, Target } from "lucide-react";

export async function TradersStatsCard() {
  // Fetch top traders stats
  const topTraders = await prisma.traderProfile.findMany({
    where: {
      verified: true,
    },
    take: 3,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  return (
    <Card className="w-full border-purple-200 bg-gradient-to-br from-purple-50/30 to-transparent dark:border-purple-900 dark:from-purple-950/10">
      <CardHeader>
        <CardTitle>Top Verified Traders</CardTitle>
        <CardDescription>Best performing traders this month</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topTraders.map((trader) => {
          const stats = trader.statsJson as {
            winrate?: number;
            payoff?: number;
            nTrades?: number;
          } | null;

          return (
            <div
              key={trader.id}
              className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex size-10 items-center justify-center rounded-full">
                  <Users className="text-primary size-5" />
                </div>
                <div>
                  <p className="font-medium">{trader.displayName}</p>
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    {trader.verified && (
                      <Badge variant="secondary" className="h-5 text-xs">
                        Verified
                      </Badge>
                    )}
                    <span className="flex items-center gap-1">
                      <Target className="size-3" />
                      {stats?.winrate ? `${stats.winrate.toFixed(1)}%` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <TrendingUp className="size-4" />
                  {stats?.payoff ? `${stats.payoff.toFixed(1)}x` : "N/A"}
                </div>
                <p className="text-muted-foreground text-xs">
                  {stats?.nTrades ?? 0} trades
                </p>
              </div>
            </div>
          );
        })}

        {topTraders.length === 0 && (
          <div className="text-muted-foreground text-center text-sm">
            No verified traders yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
