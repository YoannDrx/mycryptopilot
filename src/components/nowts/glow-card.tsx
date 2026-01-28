import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type GlowCardProps = {
  children: ReactNode;
  className?: string;
  glow?: "emerald" | "crimson" | "none";
  intensity?: "sm" | "md" | "lg";
  hover?: boolean;
  withScanline?: boolean;
};

export const GlowCard = ({
  children,
  className,
  glow = "emerald",
  intensity = "md",
  hover = true,
  withScanline = false,
}: GlowCardProps) => {
  const glowStyles = {
    emerald: {
      sm: "shadow-[0_0_15px_rgba(0,255,170,0.1)]",
      md: "shadow-[0_0_25px_rgba(0,255,170,0.15)]",
      lg: "shadow-[0_0_40px_rgba(0,255,170,0.2)]",
    },
    crimson: {
      sm: "shadow-[0_0_15px_rgba(255,51,102,0.1)]",
      md: "shadow-[0_0_25px_rgba(255,51,102,0.15)]",
      lg: "shadow-[0_0_40px_rgba(255,51,102,0.2)]",
    },
    none: {
      sm: "",
      md: "",
      lg: "",
    },
  };

  const hoverStyles = {
    emerald:
      "hover:shadow-[0_0_35px_rgba(0,255,170,0.2)] hover:border-[#00ffaa]/40",
    crimson:
      "hover:shadow-[0_0_35px_rgba(255,51,102,0.2)] hover:border-[#ff3366]/40",
    none: "",
  };

  const borderStyles = {
    emerald: "border-[#00ffaa]/20",
    crimson: "border-[#ff3366]/20",
    none: "border-[var(--glass-border)]",
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-[var(--bg-onyx)] p-6 backdrop-blur-xl transition-all duration-300",
        borderStyles[glow],
        glowStyles[glow][intensity],
        hover && hoverStyles[glow],
        withScanline && "scanline overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
};
