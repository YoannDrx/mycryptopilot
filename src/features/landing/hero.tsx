import { CircleSvg } from "@/components/svg/circle-svg";
import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Typography } from "../../components/nowts/typography";

const HERO_HIGHLIGHTS = [
  "Free Risk Console",
  "Binance/Bybit On-Chain Verified",
  "Crypto Pro-Rata Payments",
];

export const Hero = () => {
  return (
    <div className="relative isolate flex flex-col">
      <GridBackground />
      <GradientBackground />
      <main className="relative py-24 sm:py-32 lg:pb-40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Typography
              variant="h1"
              className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl"
            >
              Stop getting liquidated. Manage risk like a pro with{" "}
              <span className="relative inline-block">
                <span>verified proof</span>
                <CircleSvg className="fill-primary absolute inset-0 opacity-40" />
              </span>
            </Typography>
            <Typography
              variant="large"
              className="text-muted-foreground mt-8 text-lg font-medium text-pretty sm:text-xl/8"
            >
              Risk console automated (2% rule), Binance/Bybit verified traders,
              real-time analytics—your 360° risk-first ecosystem to trade with
              confidence.
            </Typography>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {HERO_HIGHLIGHTS.map((highlight) => (
                <span
                  key={highlight}
                  className="border-border bg-background/80 text-muted-foreground rounded-full border px-4 py-1 text-sm font-medium shadow-sm backdrop-blur"
                >
                  {highlight}
                </span>
              ))}
            </div>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-x-6">
              <Link
                href="/auth/signup"
                className={buttonVariants({ size: "lg", variant: "default" })}
              >
                Sign Up
              </Link>
              <Link
                href="#ecosystem"
                className={buttonVariants({ size: "lg", variant: "ghost" })}
              >
                Explore 360° Ecosystem <span aria-hidden="true">→</span>
              </Link>
            </div>
            <p className="text-muted-foreground/80 mt-5 text-sm">
              No credit card needed. Upgrade anytime with USDC (Base) or USDT
              (Tron).
            </p>
          </div>
          <Image
            alt="Preview of MyCryptoPilot trader marketplace with verified stats"
            src="/images/trader-marketplace.png"
            width={1280}
            height={720}
            className="mt-16 rounded-md bg-white/5 shadow-2xl ring-1 ring-white/10 sm:mt-24"
          />
        </div>
      </main>
    </div>
  );
};

const GridBackground = () => {
  return (
    <div className="bg-grid absolute inset-0 [mask-image:linear-gradient(180deg,transparent,var(--foreground),transparent)]"></div>
  );
};

const GradientBackground = () => {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="from-primary relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
        />
      </div>
    </>
  );
};
