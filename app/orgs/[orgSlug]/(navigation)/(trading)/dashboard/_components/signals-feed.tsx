import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSignalsFromFollowedTraders } from "@/features/signal/signal-queries";
import type { TradingCardPayloadType } from "@/features/signal/signal.schema";
import { getPlanLimits } from "@/lib/crypto/get-plan-limits";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";
import { prisma } from "@/lib/prisma";
import { BarChart3 } from "lucide-react";
import { BlurredSignalCard } from "./blurred-signal-card";

type SignalsFeedProps = {
  userId: string;
};

export const SignalsFeed = async ({ userId }: SignalsFeedProps) => {
  // Get user's plan to determine signal limit
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planName: true },
  });

  const planLimits = getPlanLimits(user?.planName as MyCryptoPilotPlanName | null | undefined);
  const activeSignalsLimit = planLimits.activeSignalsLimit;

  const signals = await getSignalsFromFollowedTraders(userId, {
    limit: 20,
    includeExpired: false,
  });

  if (signals.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Recent Signals ({signals.length})
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {signals.map((signal, index) => {
          const traderName =
            signal.trader.traderProfile?.displayName ?? signal.trader.name;

          // Blur signals after activeSignalsLimit (e.g., first 3 clear for FREE plan)
          const isBlurred = index >= activeSignalsLimit;

          return (
            <BlurredSignalCard
              key={signal.id}
              symbol={signal.symbol}
              payload={signal.payloadJson as TradingCardPayloadType}
              traderId={signal.traderId}
              traderName={traderName}
              createdAt={signal.createdAt}
              expiresAt={signal.expiresAt}
              isBlurred={isBlurred}
            />
          );
        })}
      </div>
    </div>
  );
};
