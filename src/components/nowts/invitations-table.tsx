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
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

type InvitationsTableProps = {
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

export const InvitationsTable = async ({ traderId }: InvitationsTableProps) => {
  const invitations = await getTraderInvitations(traderId);

  if (invitations.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        <p className="mb-2 font-medium">No invitations sent yet</p>
        <p className="text-sm">
          Invite followers by email to share your trading signals
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
            <TableHead>Sent</TableHead>
            <TableHead>Expires</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => {
            const isExpired = new Date() > invitation.expiresAt;

            return (
              <TableRow key={invitation.id}>
                <TableCell className="font-mono text-sm">
                  {invitation.email}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={isExpired ? "EXPIRED" : invitation.status}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(invitation.createdAt, {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {invitation.status === "ACCEPTED" && invitation.acceptedAt
                    ? formatDistanceToNow(invitation.acceptedAt, {
                        addSuffix: true,
                      })
                    : formatDistanceToNow(invitation.expiresAt, {
                        addSuffix: true,
                      })}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
