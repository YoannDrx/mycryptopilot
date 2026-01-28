"use client";

import { LogoSvg } from "@/components/svg/logo-svg";
import { SiteConfig } from "@/site-config";
import { motion, useMotionValue, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthButtonClient } from "../auth/auth-button-client";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#marketplace", label: "Marketplace" },
  { href: "#signals", label: "Signaux" },
  { href: "#console", label: "Console" },
  { href: "#pricing", label: "Pricing" },
] as const;

function useBoundedScroll(threshold: number) {
  const { scrollY } = useScroll();
  const scrollYBounded = useMotionValue(0);
  const scrollYBoundedProgress = useTransform(
    scrollYBounded,
    [0, threshold],
    [0, 1],
  );

  useEffect(() => {
    const onChange = (current: number) => {
      const previous = scrollY.getPrevious() ?? 0;
      const diff = current - previous;
      const newScrollYBounded = scrollYBounded.get() + diff;

      scrollYBounded.set(clamp(newScrollYBounded, 0, threshold));
    };

    const deleteEvent = scrollY.on("change", onChange);

    const listener = () => {
      const currentScroll = window.scrollY;
      onChange(currentScroll);
    };

    window.addEventListener("scroll", listener);

    return () => {
      deleteEvent();
      window.removeEventListener("scroll", listener);
    };
  }, [threshold, scrollY, scrollYBounded]);

  return { scrollYBounded, scrollYBoundedProgress };
}

export function LandingHeader() {
  const { scrollYBoundedProgress } = useBoundedScroll(400);
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollYBoundedProgressDelayed = useTransform(
    scrollYBoundedProgress,
    [0, 0.75, 1],
    [0, 0, 1],
  );

  return (
    <>
      <motion.header
        style={{
          height: useTransform(scrollYBoundedProgressDelayed, [0, 1], [80, 60]),
        }}
        className="fixed inset-x-0 z-50 flex h-20 w-screen border-b border-[var(--glass-border)] bg-[var(--bg-obsidian)]/90 shadow-lg backdrop-blur-xl"
        suppressHydrationWarning
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <LogoSvg
              size={28}
              onClick={() => {
                router.push("/");
              }}
            />
            <motion.p
              style={{
                scale: useTransform(
                  scrollYBoundedProgressDelayed,
                  [0, 1],
                  [1, 0.9],
                ),
              }}
              className="flex origin-left items-center text-lg font-bold tracking-wider uppercase max-sm:hidden"
            >
              {SiteConfig.title}
            </motion.p>
          </div>

          {/* Desktop Navigation */}
          <motion.nav
            style={{
              opacity: useTransform(
                scrollYBoundedProgressDelayed,
                [0, 1],
                [1, 0],
              ),
            }}
            className="hidden items-center gap-8 md:flex"
            suppressHydrationWarning
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-medium tracking-widest text-[var(--text-secondary)] uppercase transition-colors hover:text-[#00ffaa]"
              >
                {link.label}
              </Link>
            ))}
          </motion.nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Language Switcher Placeholder */}
            <div className="hidden text-xs font-medium tracking-wider text-[var(--text-muted)] uppercase lg:block">
              EN
            </div>

            <AuthButtonClient />

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="flex items-center justify-center rounded-md p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--glass-bg)] hover:text-white md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed inset-x-0 top-20 z-40 border-b border-[var(--glass-border)] bg-[var(--bg-obsidian)]/95 backdrop-blur-xl md:hidden"
        >
          <nav className="flex flex-col gap-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium tracking-wider text-[var(--text-secondary)] uppercase transition-colors hover:bg-[var(--glass-bg)] hover:text-[#00ffaa]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </motion.div>
      )}
    </>
  );
}

const clamp = (number: number, min: number, max: number) =>
  Math.min(Math.max(number, min), max);
