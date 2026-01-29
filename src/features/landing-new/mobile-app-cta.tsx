"use client";

import { HyperBorder, MeshGradient } from "@/components/design-system";
import { EmailSubscribeForm } from "@/components/subscribe";
import { Smartphone } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/config";

export function MobileAppCta() {
  const t = useTranslations("mobileApp");
  const locale = useLocale() as Locale;

  return (
    <section className="relative overflow-hidden bg-[var(--bg-obsidian)] py-20">
      <MeshGradient variant="subtle" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <HyperBorder
          variant="glow-emerald"
          className="overflow-hidden bg-gradient-to-br from-[var(--bg-onyx)] to-[var(--bg-graphite)]"
        >
          <div className="grid items-center gap-8 p-8 md:grid-cols-2 md:p-12">
            {/* Left: Content */}
            <div>
              {/* Icon badge */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--accent-emerald)]/10 px-4 py-2">
                <Smartphone className="size-5 text-[var(--accent-emerald)]" />
                <span className="text-sm font-medium text-[var(--accent-emerald)]">
                  {t("comingSoon")}
                </span>
              </div>

              <h2 className="mb-3 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                {t("title")}
              </h2>
              <p className="mb-2 text-lg text-[var(--text-secondary)]">
                {t("subtitle")}
              </p>
              <p className="mb-6 text-[var(--text-muted)]">
                {t("description")}
              </p>

              {/* Email form */}
              <EmailSubscribeForm
                source="mobile_app_waitlist"
                locale={locale}
                placeholder={t("placeholder")}
                buttonText={t("notify")}
              />

              {/* Store badges */}
              <div className="mt-6 flex gap-4">
                <div className="relative opacity-50 grayscale">
                  <Image
                    src="/images/stores/app-store-badge.svg"
                    alt="App Store"
                    width={135}
                    height={40}
                    className="h-10 w-auto"
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded bg-black/60 text-xs text-white">
                    {t("comingSoon")}
                  </div>
                </div>
                <div className="relative opacity-50 grayscale">
                  <Image
                    src="/images/stores/google-play-badge.svg"
                    alt="Google Play"
                    width={135}
                    height={40}
                    className="h-10 w-auto"
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded bg-black/60 text-xs text-white">
                    {t("comingSoon")}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Phone mockup */}
            <div className="relative flex justify-center">
              <div className="relative h-[400px] w-[200px]">
                {/* Phone frame */}
                <div className="absolute inset-0 rounded-[40px] border-4 border-[var(--glass-border)] bg-[var(--bg-graphite)] shadow-2xl">
                  {/* Screen */}
                  <div className="absolute inset-2 overflow-hidden rounded-[32px] bg-[var(--bg-obsidian)]">
                    {/* Notch */}
                    <div className="absolute top-2 left-1/2 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />

                    {/* App preview content */}
                    <div className="flex h-full flex-col p-4 pt-10">
                      {/* Header */}
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          MyCryptoPilot
                        </span>
                        <div className="size-2 rounded-full bg-[var(--accent-emerald)]" />
                      </div>

                      {/* Signal card preview */}
                      <div className="mb-3 rounded-lg bg-[var(--bg-onyx)] p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            BTC/USDT
                          </span>
                          <span className="rounded bg-[var(--accent-emerald)]/20 px-2 py-0.5 text-[10px] text-[var(--accent-emerald)]">
                            LONG
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">
                          Entry: $96,420
                        </div>
                      </div>

                      {/* Another signal */}
                      <div className="mb-3 rounded-lg bg-[var(--bg-onyx)] p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            ETH/USDT
                          </span>
                          <span className="rounded bg-[var(--accent-crimson)]/20 px-2 py-0.5 text-[10px] text-[var(--accent-crimson)]">
                            SHORT
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">
                          Entry: $3,180
                        </div>
                      </div>

                      {/* Bottom nav */}
                      <div className="mt-auto flex justify-around border-t border-[var(--glass-border)] pt-3">
                        <div className="size-6 rounded bg-[var(--accent-emerald)]/20" />
                        <div className="size-6 rounded bg-[var(--glass-border)]" />
                        <div className="size-6 rounded bg-[var(--glass-border)]" />
                        <div className="size-6 rounded bg-[var(--glass-border)]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Glow effect */}
                <div className="absolute -inset-4 -z-10 rounded-full bg-[var(--accent-emerald)]/10 blur-3xl" />
              </div>
            </div>
          </div>
        </HyperBorder>
      </div>
    </section>
  );
}
