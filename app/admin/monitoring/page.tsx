import { headers, cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRequiredUser } from "@/lib/auth/auth-user";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

type RealtimeHealthResponse = {
  success: boolean;
  cacheStats: { totalKeys: number; keysSample: string[] } | null;
  redisStats: { channels: number; totalHandlers: number };
  queueStats: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
};

async function fetchRealtimeHealth(): Promise<RealtimeHealthResponse> {
  const hdrs = await headers();
  const host = hdrs.get("host");
  if (!host) {
    throw new Error("Unable to determine host");
  }

  const protocol =
    process.env.NODE_ENV === "production" ? "https" : "http";
  const cookieHeader = cookies().toString();

  const response = await fetch(
    `${protocol}://${host}/api/admin/realtime-health`,
    {
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to load realtime health");
  }

  return response.json();
}

function StatItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default async function MonitoringPage() {
  const user = await getRequiredUser();
  const isAdmin =
    user.role === "ADMIN" || user.email === process.env.ADMIN_EMAIL;
  if (!isAdmin) {
    notFound();
  }

  const data = await fetchRealtimeHealth();
  const cacheStats = data.cacheStats ?? { totalKeys: 0, keysSample: [] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Real-time Monitoring
        </h1>
        <p className="text-muted-foreground">
          Statut du cache balance, des abonnements SSE et de la queue BullMQ.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Balance Cache (Redis)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatItem label="Clés actives" value={cacheStats.totalKeys} />
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Exemples
              </p>
              <pre className="text-xs bg-muted/60 rounded-md p-2 max-h-32 overflow-y-auto">
                {cacheStats.keysSample.length > 0
                  ? cacheStats.keysSample.join("\n")
                  : "Aucune entrée"}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SSE / Redis PubSub</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatItem label="Canaux souscrits" value={data.redisStats.channels} />
            <StatItem
              label="Handlers actifs"
              value={data.redisStats.totalHandlers}
            />
            <p className="text-xs text-muted-foreground">
              1 connexion Redis partagée pour tous les clients SSE.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Copy-Trade Queue (BullMQ)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatItem label="En attente" value={data.queueStats.waiting} />
            <StatItem label="Actifs" value={data.queueStats.active} />
            <StatItem label="Terminés (24h)" value={data.queueStats.completed} />
            <StatItem label="Échecs" value={data.queueStats.failed} />
            <StatItem label="Différés" value={data.queueStats.delayed} />
            <StatItem label="Pause" value={data.queueStats.paused} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
