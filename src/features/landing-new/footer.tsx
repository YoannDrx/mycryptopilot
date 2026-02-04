"use client";

import { Logo } from "@/components/brand";
import { GrainOverlay, MeshGradient } from "@/components/design-system";
import { Twitter, MessageCircle, Github } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const FOOTER_LINKS = {
  product: [
    { key: "marketplace", href: "/traders" },
    { key: "pricing", href: "/pricing" },
    { key: "docs", href: "/docs" },
  ],
  company: [
    { key: "about", href: "/about" },
    { key: "contact", href: "/contact" },
    { key: "blog", href: "/posts" },
  ],
  legal: [
    { key: "terms", href: "/legal/terms" },
    { key: "privacy", href: "/legal/privacy" },
  ],
};

const SOCIAL_LINKS = [
  {
    icon: Twitter,
    href: "https://twitter.com/mycryptopilot",
    label: "Twitter",
  },
  {
    icon: MessageCircle,
    href: "https://discord.gg/mycryptopilot",
    label: "Discord",
  },
  { icon: Github, href: "https://github.com/mycryptopilot", label: "GitHub" },
];

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="relative overflow-hidden border-t border-[var(--glass-border)] bg-[var(--bg-obsidian)]">
      <MeshGradient variant="subtle" />
      <GrainOverlay opacity={0.02} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Logo variant="full" size="md" className="mb-4" />
            <p className="mb-6 max-w-xs text-sm text-[var(--text-muted)]">
              {t("description")}
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-10 items-center justify-center rounded-lg border border-[var(--glass-border)] text-[var(--text-muted)] transition-colors hover:border-[var(--accent-emerald)] hover:text-[var(--accent-emerald)]"
                  aria-label={social.label}
                >
                  <social.icon className="size-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="mb-4 font-semibold text-[var(--text-primary)]">
              {t("product")}
            </h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--accent-emerald)]"
                  >
                    {t(`links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="mb-4 font-semibold text-[var(--text-primary)]">
              {t("company")}
            </h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--accent-emerald)]"
                  >
                    {t(`links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="mb-4 font-semibold text-[var(--text-primary)]">
              {t("legal")}
            </h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--accent-emerald)]"
                  >
                    {t(`links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-[var(--glass-border)] pt-8">
          <p className="text-center text-sm text-[var(--text-muted)]">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
