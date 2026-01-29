import { cn } from "@/lib/utils";

type MeshGradientProps = {
  className?: string;
  variant?: "default" | "subtle" | "intense";
  emeraldPosition?: string;
  crimsonPosition?: string;
};

export function MeshGradient({
  className,
  variant = "default",
  emeraldPosition = "10% 10%",
  crimsonPosition = "90% 90%",
}: MeshGradientProps) {
  const opacities = {
    subtle: { emerald: 0.04, crimson: 0.03 },
    default: { emerald: 0.08, crimson: 0.06 },
    intense: { emerald: 0.12, crimson: 0.1 },
  };

  const { emerald, crimson } = opacities[variant];

  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden="true"
      style={{
        background: `
          radial-gradient(circle at ${emeraldPosition}, rgba(0, 255, 170, ${emerald}) 0%, transparent 40%),
          radial-gradient(circle at ${crimsonPosition}, rgba(255, 51, 102, ${crimson}) 0%, transparent 40%)
        `,
      }}
    />
  );
}
