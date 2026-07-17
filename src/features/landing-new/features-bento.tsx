"use client";

import { HyperBorder } from "@/components/design-system";
import {
  Bell,
  Calculator,
  LineChart,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  color: "emerald" | "crimson" | "blue" | "purple";
  size?: "small" | "large";
};

const colorClasses = {
  emerald: {
    icon: "text-[var(--accent-emerald)]",
    bg: "bg-[var(--accent-emerald)]/10",
    glow: "shadow-[0_0_30px_rgba(0,255,170,0.1)]",
  },
  crimson: {
    icon: "text-[var(--accent-crimson)]",
    bg: "bg-[var(--accent-crimson)]/10",
    glow: "shadow-[0_0_30px_rgba(255,51,102,0.1)]",
  },
  blue: {
    icon: "text-[#00d4ff]",
    bg: "bg-[#00d4ff]/10",
    glow: "shadow-[0_0_30px_rgba(0,212,255,0.1)]",
  },
  purple: {
    icon: "text-[#a855f7]",
    bg: "bg-[#a855f7]/10",
    glow: "shadow-[0_0_30px_rgba(168,85,247,0.1)]",
  },
};

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  size = "small",
}: FeatureCardProps) {
  const colors = colorClasses[color];

  return (
    <HyperBorder
      className={`group p-6 transition-all hover:scale-[1.02] ${colors.glow} ${
        size === "large" ? "md:col-span-2 md:row-span-2" : ""
      }`}
    >
      <div
        className={`mb-4 inline-flex rounded-xl p-3 ${colors.bg} transition-transform group-hover:scale-110`}
      >
        <Icon className={`size-6 ${colors.icon}`} />
      </div>
      <h3
        className={`mb-2 font-semibold text-[var(--text-primary)] ${
          size === "large" ? "text-xl" : "text-lg"
        }`}
      >
        {title}
      </h3>
      <p
        className={`text-[var(--text-secondary)] ${
          size === "large" ? "text-base" : "text-sm"
        }`}
      >
        {description}
      </p>

      {/* Visual indicator for large cards */}
      {size === "large" && (
        <div className="mt-6 flex items-center gap-2 text-sm text-[var(--accent-emerald)]">
          <span>En savoir plus</span>
          <span className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </div>
      )}
    </HyperBorder>
  );
}

export function FeaturesBento() {
  const t = useTranslations("features");

  const features = [
    {
      icon: Bell,
      title: t("signals.title"),
      description: t("signals.description"),
      color: "emerald" as const,
      size: "large" as const,
    },
    {
      icon: Calculator,
      title: t("risk.title"),
      description: t("risk.description"),
      color: "blue" as const,
      size: "small" as const,
    },
    {
      icon: LineChart,
      title: t("journal.title"),
      description: t("journal.description"),
      color: "purple" as const,
      size: "small" as const,
    },
    {
      icon: Shield,
      title: t("verified.title"),
      description: t("verified.description"),
      color: "crimson" as const,
      size: "small" as const,
    },
  ];

  return (
    <section id="how-it-works" className="bg-[var(--bg-obsidian)] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
            {t("title")}
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
