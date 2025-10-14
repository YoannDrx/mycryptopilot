"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useQueryStates, parseAsString } from "nuqs";

export function TraderFilters() {
  const [filters, setFilters] = useQueryStates({
    q: parseAsString.withDefault(""),
    verified: parseAsString.withDefault("all"),
  });

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search traders by name or email..."
          value={filters.q}
          onChange={(e) => {
            void setFilters({ q: e.target.value || null });
          }}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.verified}
        onValueChange={(value) => {
          void setFilters({ verified: value === "all" ? null : value });
        }}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Traders</SelectItem>
          <SelectItem value="verified">Verified Only</SelectItem>
          <SelectItem value="pending">Pending Only</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
