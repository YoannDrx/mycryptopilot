"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes, PropsWithChildren } from "react";

type HyperBorderProps = HTMLAttributes<HTMLDivElement> &
  PropsWithChildren<{
    className?: string;
    variant?: "default" | "glow-emerald" | "glow-crimson";
    hover?: boolean;
    as?: "div" | "section" | "article";
  }>;

export function HyperBorder({
  children,
  className,
  variant = "default",
  hover = true,
  as: Component = "div",
  ...props
}: HyperBorderProps) {
  const glowClasses = {
    default: "",
    "glow-emerald": "shadow-[0_0_20px_rgba(0,255,170,0.15)]",
    "glow-crimson": "shadow-[0_0_20px_rgba(255,51,102,0.15)]",
  };

  return (
    <Component
      className={cn(
        "rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl",
        "transition-all duration-200",
        hover && "hover:border-[var(--glass-border-hover)]",
        glowClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
