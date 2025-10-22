"use client";

import { useQuery } from "@tanstack/react-query";
import { upfetch } from "@/lib/up-fetch";
import { ExchangeConnectionCard } from "./exchange-connection-card";
import { Loader2 } from "lucide-react";

type Connection = {
  id: string;
  exchange: string;
  isActive: boolean;
  lastSyncedAt: string | null;
  nextSyncAt: string | null;
  lastSyncError: string | null;
  createdAt: string;
};

type Stats = {
  totalTrades: number;
  firstTradeDate: string | null;
  lastTradeDate: string | null;
};

type ExchangeConnectionsListProps = {
  connections: Connection[];
  traderProfileId: string;
};

export const ExchangeConnectionsList = ({
  connections: initialConnections,
}: ExchangeConnectionsListProps) => {
  // Use initialConnections as default, then refetch with React Query for real-time updates
  const { data: connections } = useQuery({
    queryKey: ["exchange-connections"],
    queryFn: async () => initialConnections,
    initialData: initialConnections,
  });

  if (connections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {connections.map((connection) => (
        <ConnectionWithStats key={connection.id} connection={connection} />
      ))}
    </div>
  );
};

// Separate component to fetch stats for each connection
const ConnectionWithStats = ({ connection }: { connection: Connection }) => {
  const { data: statusData, isLoading } = useQuery({
    queryKey: ["exchange-status", connection.id],
    queryFn: async () => {
      // upfetch automatically parses JSON and throws on error
      const data = await upfetch(`/api/exchange/${connection.id}/status`);
      return data as {
        connection: Connection;
        stats: Stats;
      };
    },
  });

  if (isLoading) {
    return (
      <div className="bg-muted/50 flex items-center justify-center rounded-lg border p-8">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  if (!statusData) {
    return null;
  }

  return (
    <ExchangeConnectionCard
      connection={statusData.connection}
      stats={statusData.stats}
    />
  );
};
