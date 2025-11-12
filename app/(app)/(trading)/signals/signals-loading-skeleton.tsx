"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSignalsViewState } from "@/stores/signals-view-state";

/**
 * Loading skeleton qui respecte la préférence cards/table de l'utilisateur
 * pour éviter le flash de contenu entre cards et table pendant le loading
 */
export function SignalsLoadingSkeleton() {
  const { viewMode } = useSignalsViewState();

  if (viewMode === "table") {
    return (
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <div className="space-y-3 p-4">
            {/* Table header skeleton */}
            <div className="flex gap-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 flex-1" />
            </div>
            {/* Table rows skeleton */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-12 w-20" />
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 w-16" />
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Cards view (default)
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
