"use client";

import { LayoutGrid, Table } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { useSignalsViewState } from "@/stores/signals-view-state";
import { cn } from "@/lib/utils";

/**
 * Toggle pour basculer entre vue Cards et vue Table
 * Persiste la préférence dans localStorage via Zustand
 */
export function ViewToggle() {
  const { viewMode, setViewMode } = useSignalsViewState();

  return (
    <div className="flex gap-1 rounded-lg border p-1" role="group">
      <Toggle
        variant="outline"
        size="sm"
        pressed={viewMode === "cards"}
        onPressedChange={() => setViewMode("cards")}
        aria-label="Cards view"
        className={cn(
          "border-0",
          viewMode === "cards" && "bg-accent text-accent-foreground",
        )}
      >
        <LayoutGrid className="size-4" />
        <span className="ml-1.5">Cards</span>
      </Toggle>
      <Toggle
        variant="outline"
        size="sm"
        pressed={viewMode === "table"}
        onPressedChange={() => setViewMode("table")}
        aria-label="Table view"
        className={cn(
          "border-0",
          viewMode === "table" && "bg-accent text-accent-foreground",
        )}
      >
        <Table className="size-4" />
        <span className="ml-1.5">Table</span>
      </Toggle>
    </div>
  );
}
