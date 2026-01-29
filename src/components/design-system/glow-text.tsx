import { cn } from "@/lib/utils";
import type { HTMLAttributes, PropsWithChildren } from "react";

type GlowTextProps = HTMLAttributes<HTMLSpanElement> &
  PropsWithChildren<{
    className?: string;
    color?: "emerald" | "crimson" | "white";
    intensity?: "subtle" | "normal" | "intense";
    as?: "span" | "h1" | "h2" | "h3" | "h4" | "p";
  }>;

export function GlowText({
  children,
  className,
  color = "emerald",
  intensity = "normal",
  as: Component = "span",
  ...props
}: GlowTextProps) {
  const colors = {
    emerald: "0, 255, 170",
    crimson: "255, 51, 102",
    white: "255, 255, 255",
  };

  const intensities = {
    subtle: 0.3,
    normal: 0.5,
    intense: 0.7,
  };

  return (
    <Component
      className={cn(className)}
      style={{
        textShadow: `0 0 20px rgba(${colors[color]}, ${intensities[intensity]})`,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}
