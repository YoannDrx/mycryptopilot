import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getTradersWithStats } from "../_actions/trader-admin.actions";

type SearchParams = {
  q: string;
  verified: string;
  page: number;
};

export async function TradersTable({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { traders, total } = await getTradersWithStats({
    page: searchParams.page,
    pageSize: 10,
    search: searchParams.q || undefined,
    verified:
      searchParams.verified === "all"
        ? "all"
        : searchParams.verified === "verified"
          ? "verified"
          : "pending",
  });

  if (traders.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border">
        <div className="text-muted-foreground text-center">
          <p className="mb-2 text-lg font-medium">No traders found</p>
          <p className="text-sm">
            {searchParams.q
              ? "Try adjusting your search or filters"
              : "No traders have registered yet"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trader</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Followers</TableHead>
              <TableHead>Signals</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {traders.map((trader) => (
              <TableRow key={trader.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={trader.user.image ?? undefined}
                        alt={trader.displayName}
                      />
                      <AvatarFallback>
                        {trader.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{trader.displayName}</div>
                      <div className="text-muted-foreground text-xs">
                        {trader.user.name}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-sm">
                    {trader.user.email}
                  </span>
                </TableCell>
                <TableCell>
                  {trader.verified ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{trader.followersCount}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{trader.signalsCount}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(trader.createdAt), "MMM dd, yyyy")}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/traders/${trader.id}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-muted-foreground text-center text-sm">
        Showing {traders.length} of {total} traders
      </div>
    </div>
  );
}
