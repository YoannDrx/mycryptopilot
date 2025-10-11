import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTraderConversionStats } from "@/features/invitation/invitation-stats";
import { BarChart3, Mail, Share2, Users } from "lucide-react";

type ConversionStatsCardProps = {
  traderId: string;
};

export const ConversionStatsCard = async ({
  traderId,
}: ConversionStatsCardProps) => {
  const stats = await getTraderConversionStats(traderId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-5" />
          Conversion Stats
        </CardTitle>
        <CardDescription>
          Track your invitation and referral performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invitation Stats */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="size-4" />
            Invitations
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Sent</p>
              <p className="text-2xl font-bold">{stats.invitations.total}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Accepted</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.invitations.accepted}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Rate</p>
              <p className="text-2xl font-bold">
                {stats.invitations.conversionRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Follow Sources */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="size-4" />
            Follower Sources
          </div>
          <div className="space-y-2">
            {/* Direct */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="size-4" />
                <span className="text-sm">Direct</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {stats.follows.direct.count}
                </span>
                <span className="text-muted-foreground text-xs">
                  ({stats.follows.direct.percentage}%)
                </span>
              </div>
            </div>

            {/* Invitation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="size-4" />
                <span className="text-sm">Invitation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {stats.follows.invitation.count}
                </span>
                <span className="text-muted-foreground text-xs">
                  ({stats.follows.invitation.percentage}%)
                </span>
              </div>
            </div>

            {/* Referral */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="size-4" />
                <span className="text-sm">Referral Link</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {stats.follows.referral.count}
                </span>
                <span className="text-muted-foreground text-xs">
                  ({stats.follows.referral.percentage}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Active Followers</span>
            <span className="text-2xl font-bold">{stats.follows.total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
