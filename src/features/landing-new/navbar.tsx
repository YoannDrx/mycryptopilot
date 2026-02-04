"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand";
import { LocaleToggle } from "@/components/navbar";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

const NAV_LINKS = [
  { key: "marketplace", href: "/traders" },
  { key: "signals", href: "#signals" },
  { key: "console", href: "#console" },
  { key: "pricing", href: "#pricing" },
] as const;

export function Navbar() {
  const t = useTranslations("nav");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-[var(--glass-border)] bg-[var(--bg-obsidian)]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo variant="full" size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="rounded-lg px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)]"
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          {/* Right side: Theme, Locale, CTA */}
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 sm:flex">
              <LocaleToggle />
              <ThemeToggle />
            </div>

            <Button
              asChild
              variant="emerald"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link href="/auth/signin">{t("signIn")}</Link>
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="border-t border-[var(--glass-border)] py-4 md:hidden">
            <nav className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  className="rounded-lg px-4 py-3 text-[var(--text-secondary)] transition-colors hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t(link.key)}
                </Link>
              ))}
              <div className="mt-2 flex items-center gap-2 px-4">
                <LocaleToggle />
                <ThemeToggle />
              </div>
              <div className="mt-2 px-4">
                <Button asChild variant="emerald" className="w-full">
                  <Link href="/auth/signin">{t("signIn")}</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
