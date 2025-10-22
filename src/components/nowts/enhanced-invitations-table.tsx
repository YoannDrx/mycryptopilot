import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTraderInvitations } from "@/features/invitation/invitation-queries";
import {
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Crown,
  Eye,
  Coins,
} from "lucide-react";
import { InvitationActions } from "./invitation-actions";
import { cn } from "@/lib/utils";

type EnhancedInvitationsTableProps = {
  traderId: string;
};

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="size-3" />
          Pending
        </Badge>
      );
    case "ACCEPTED":
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="size-3" />
          Accepted
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="size-3" />
          Expired
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

const ActivityBadge = ({
  isActive,
  daysSinceAccepted,
}: {
  isActive: boolean;
  daysSinceAccepted: number;
}) => {
  if (isActive) {
    return (
      <Badge variant="default" className="gap-1 bg-green-600">
        <CheckCircle2 className="size-3" />
        Active {daysSinceAccepted}d
      </Badge>
    );
  }

  if (daysSinceAccepted < 30) {
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="size-3" />
        {daysSinceAccepted}d
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <XCircle className="size-3" />
      Inactive
    </Badge>
  );
};

const UpgradeBadge = ({
  isUpgraded,
  plan,
}: {
  isUpgraded: boolean;
  plan: string | null;
}) => {
  if (!isUpgraded || !plan) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const isPro = plan === "pro";
  const isUltra = plan === "ultra";

  return (
    <Badge
      variant="default"
      className={cn(
        "gap-1",
        isPro && "bg-blue-600",
        isUltra && "bg-purple-600",
      )}
    >
      {isUltra && <Crown className="size-3" />}
      {isPro && <TrendingUp className="size-3" />}
      {plan.toUpperCase()} ${isPro ? "49" : "99"}
    </Badge>
  );
};

export const EnhancedInvitationsTable = async ({
  traderId,
}: EnhancedInvitationsTableProps) => {
  const invitations = await getTraderInvitations(traderId);

  if (invitations.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        <p className="mb-2 font-medium">No invitations sent yet</p>
        <p className="text-sm">
          Invite followers by email to share your trading signals and earn
          credits
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Coins className="size-3" />
                Credits
              </div>
            </TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="size-3" />
                Activity
              </div>
            </TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Crown className="size-3" />
                Upgraded
              </div>
            </TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Eye className="size-3" />
                Views
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => {
            const isExpired = new Date() > invitation.expiresAt;
            const isAccepted = invitation.status === "ACCEPTED";

            // Calculate days since accepted
            const daysSinceAccepted = invitation.acceptedAt
              ? Math.floor(
                  (Date.now() - invitation.acceptedAt.getTime()) /
                    (1000 * 60 * 60 * 24),
                )
              : 0;

            return (
              <TableRow key={invitation.id}>
                {/* Email */}
                <TableCell className="font-mono text-sm">
                  {invitation.email}
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge
                    status={isExpired ? "EXPIRED" : invitation.status}
                  />
                </TableCell>

                {/* Credits Earned */}
                <TableCell className="text-center">
                  {invitation.creditsAwarded > 0 ? (
                    <span className="font-semibold text-amber-700">
                      +{invitation.creditsAwarded}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>

                {/* Activity Status */}
                <TableCell className="text-center">
                  {isAccepted ? (
                    <ActivityBadge
                      isActive={invitation.inviteeActive}
                      daysSinceAccepted={daysSinceAccepted}
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>

                {/* Upgraded Status */}
                <TableCell className="text-center">
                  {isAccepted ? (
                    <UpgradeBadge
                      isUpgraded={invitation.inviteeUpgraded}
                      plan={invitation.inviteeUpgradedPlan}
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>

                {/* Landing Views */}
                <TableCell className="text-center">
                  {invitation.landingViews > 0 ? (
                    <Badge variant="outline" className="gap-1">
                      <Eye className="size-3" />
                      {invitation.landingViews}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">0</span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <InvitationActions
                    invitationId={invitation.id}
                    email={invitation.email}
                    status={isExpired ? "EXPIRED" : invitation.status}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
