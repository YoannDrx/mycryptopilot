"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes, PropsWithChildren } from "react";

type ScanlineProps = HTMLAttributes<HTMLDivElement> &
  PropsWithChildren<{
    className?: string;
    speed?: "slow" | "normal" | "fast";
    color?: "emerald" | "crimson" | "white";
  }>;

export function Scanline({
  children,
  className,
  speed = "normal",
  color = "emerald",
  ...props
}: ScanlineProps) {
  const speeds = {
    slow: "8s",
    normal: "6s",
    fast: "4s",
  };

  const colors = {
    emerald: "var(--accent-emerald)",
    crimson: "var(--accent-crimson)",
    white: "rgba(255, 255, 255, 0.5)",
  };

  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      {children}
      <div
        className="pointer-events-none absolute left-0 h-[2px] w-full opacity-40"
        aria-hidden="true"
        style={
          {
            background: `linear-gradient(90deg, transparent, ${colors[color]}, transparent)`,
            animation: `scan ${speeds[speed]} linear infinite`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}
