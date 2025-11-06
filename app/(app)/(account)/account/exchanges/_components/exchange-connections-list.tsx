"use client";

import { useQuery } from "@tanstack/react-query";
import { upfetch } from "@/lib/up-fetch";
import { ExchangeConnectionCard } from "./exchange-connection-card";

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
  const { data: statusData } = useQuery({
    queryKey: ["exchange-status", connection.id],
    queryFn: async () => {
      // upfetch automatically parses JSON and throws on error
      const data = await upfetch(`/api/exchange/${connection.id}/status`);
      return data as {
        connection: Connection;
        stats: Stats;
      };
    },
    // Provide placeholder data to avoid hydration mismatch
    placeholderData: {
      connection,
      stats: {
        totalTrades: 0,
        firstTradeDate: null,
        lastTradeDate: null,
      },
    },
  });

  // statusData always exists due to placeholderData, so no need for loading state
  // The card will show with placeholder stats initially, then update when real data arrives
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
