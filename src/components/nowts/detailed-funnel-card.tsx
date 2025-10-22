import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDetailedFunnelStats } from "@/features/invitation/invitation-queries";
import {
  Mail,
  MousePointerClick,
  UserCheck,
  Activity,
  Crown,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DetailedFunnelCardProps = {
  traderId: string;
  className?: string;
};

const FunnelStep = ({
  icon: Icon,
  label,
  count,
  percentage,
  conversionRate,
  isLast = false,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  percentage: number;
  conversionRate?: number;
  isLast?: boolean;
}) => {
  return (
    <div className="flex flex-col items-center">
      {/* Step Circle */}
      <div
        className={cn(
          "flex size-16 items-center justify-center rounded-full border-2 transition-all",
          count > 0
            ? "border-blue-500 bg-blue-50 text-blue-600"
            : "border-gray-300 bg-gray-50 text-gray-400",
        )}
      >
        <Icon className="size-6" />
      </div>

      {/* Label */}
      <p className="mt-2 text-sm font-medium">{label}</p>

      {/* Count */}
      <p className="text-2xl font-bold">{count}</p>

      {/* Percentage */}
      <p className="text-muted-foreground text-xs">{percentage}%</p>

      {/* Conversion Rate Arrow */}
      {!isLast && (
        <div className="mt-2 flex items-center gap-1">
          <TrendingDown
            className={cn(
              "size-4",
              (conversionRate ?? 0) > 50 ? "text-green-600" : "text-red-600",
            )}
          />
          <span
            className={cn(
              "text-xs font-medium",
              (conversionRate ?? 0) > 50 ? "text-green-600" : "text-red-600",
            )}
          >
            {conversionRate ?? 0}%
          </span>
        </div>
      )}
    </div>
  );
};

export const DetailedFunnelCard = async ({
  traderId,
  className,
}: DetailedFunnelCardProps) => {
  const funnel = await getDetailedFunnelStats(traderId);

  const hasFunnelData = funnel.sent.count > 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-5" />
          Invitation Funnel
        </CardTitle>
        <CardDescription>
          Track your invitation journey from send to upgrade
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {hasFunnelData ? (
          <>
            {/* Funnel Steps */}
            <div className="flex items-start justify-between gap-4">
              {/* Step 1: Sent */}
              <FunnelStep
                icon={Mail}
                label="Sent"
                count={funnel.sent.count}
                percentage={funnel.sent.percentage}
                conversionRate={funnel.clicked.conversionRate}
              />

              {/* Arrow */}
              <div className="text-muted-foreground mt-8">→</div>

              {/* Step 2: Clicked */}
              <FunnelStep
                icon={MousePointerClick}
                label="Clicked"
                count={funnel.clicked.count}
                percentage={funnel.clicked.percentage}
                conversionRate={funnel.signed.conversionRate}
              />

              {/* Arrow */}
              <div className="text-muted-foreground mt-8">→</div>

              {/* Step 3: Signed */}
              <FunnelStep
                icon={UserCheck}
                label="Signed"
                count={funnel.signed.count}
                percentage={funnel.signed.percentage}
                conversionRate={funnel.active.conversionRate}
              />

              {/* Arrow */}
              <div className="text-muted-foreground mt-8">→</div>

              {/* Step 4: Active 30d */}
              <FunnelStep
                icon={Activity}
                label="Active 30d"
                count={funnel.active.count}
                percentage={funnel.active.percentage}
                conversionRate={funnel.upgraded.conversionRate}
              />

              {/* Arrow */}
              <div className="text-muted-foreground mt-8">→</div>

              {/* Step 5: Upgraded */}
              <FunnelStep
                icon={Crown}
                label="Upgraded"
                count={funnel.upgraded.count}
                percentage={funnel.upgraded.percentage}
                isLast
              />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border bg-blue-50/50 p-3">
                <p className="text-muted-foreground mb-1 text-xs">
                  Overall Conversion
                </p>
                <p className="text-xl font-bold text-blue-600">
                  {funnel.upgraded.percentage}%
                </p>
                <p className="text-muted-foreground text-xs">Sent → Upgraded</p>
              </div>

              <div className="rounded-lg border bg-green-50/50 p-3">
                <p className="text-muted-foreground mb-1 text-xs">
                  Signup Rate
                </p>
                <p className="text-xl font-bold text-green-600">
                  {funnel.signed.percentage}%
                </p>
                <p className="text-muted-foreground text-xs">Sent → Signed</p>
              </div>

              <div className="rounded-lg border bg-purple-50/50 p-3">
                <p className="text-muted-foreground mb-1 text-xs">
                  Retention Rate
                </p>
                <p className="text-xl font-bold text-purple-600">
                  {funnel.active.conversionRate}%
                </p>
                <p className="text-muted-foreground text-xs">Signed → Active</p>
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="mb-2 text-sm font-medium text-amber-900">
                💡 Optimization Tips
              </p>
              <ul className="space-y-1 text-xs text-amber-700">
                {funnel.clicked.percentage < 50 && (
                  <li>
                    • Low click rate - Consider personalizing your invitation
                    messages
                  </li>
                )}
                {funnel.signed.conversionRate < 50 && (
                  <li>
                    • Improve landing page - Highlight value proposition clearly
                  </li>
                )}
                {funnel.active.conversionRate < 30 && (
                  <li>
                    • Low retention - Engage users with quality signals early
                  </li>
                )}
                {funnel.upgraded.conversionRate < 15 && (
                  <li>
                    • Upgrade incentives - Offer limited-time Pro trial
                    discounts
                  </li>
                )}
              </ul>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-muted-foreground py-12 text-center">
            <BarChart3 className="mx-auto mb-4 size-12 opacity-20" />
            <p className="mb-2 font-medium">No funnel data yet</p>
            <p className="text-sm">
              Start sending invitations to track your conversion funnel
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
