"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

type DbInfo = {
  environment: string;
  database: {
    type: string;
    host: string;
    database: string;
    icon: string;
  };
};

export function DevDbIndicator() {
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDbInfo = async () => {
      try {
        const response = await fetch("/api/debug/db-info");
        if (response.ok) {
          const data = await response.json();
          setDbInfo(data);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch DB info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDbInfo();
  }, []);

  // Only show in development
  if (process.env.NODE_ENV === "production") return null;

  // Don't show while loading
  if (isLoading || !dbInfo) return null;

  const isNeon = dbInfo.database.type.includes("Neon");
  const isLocal = dbInfo.database.type.includes("Local");

  return (
    <div className="fixed right-1 bottom-20 z-[9999]">
      <Badge
        variant={isNeon ? "default" : isLocal ? "secondary" : "outline"}
        className="flex items-center gap-2 font-mono text-xs shadow-lg"
      >
        <span className="text-base">{dbInfo.database.icon}</span>
        <div className="flex flex-col items-start">
          <span className="font-semibold">{dbInfo.database.type}</span>
          <span className="text-xs opacity-75">{dbInfo.database.database}</span>
        </div>
      </Badge>
    </div>
  );
}
