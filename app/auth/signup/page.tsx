import { Loader } from "@/components/nowts/loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SocialProviders } from "@/lib/auth";
import { getUser } from "@/lib/auth/auth-user";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignUpProviders } from "./sign-up-providers";

export const metadata: Metadata = {
  title: `Sign Up | ${SiteConfig.title}`,
  description:
    "Create your account to access trading signals and risk console.",
};

export default async function AuthSignUpPage() {
  const user = await getUser();

  if (user) {
    redirect("/");
  }

  const providers = Object.keys(SocialProviders ?? {});

  return (
    <Card
      variant="terminal"
      className="mx-auto w-full max-w-md border-[#00ffaa]/20 shadow-[0_0_30px_rgba(0,255,170,0.1)]"
    >
      <CardHeader className="space-y-1 pb-4 text-center">
        {/* Terminal Header */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <div className="size-3 rounded-full bg-[#ff3366]" />
          <div className="size-3 rounded-full bg-[#f59e0b]" />
          <div className="size-3 rounded-full bg-[#00ffaa]" />
        </div>

        <CardTitle className="text-2xl font-bold tracking-tight">
          <span className="terminal-text text-sm">INSCRIPTION</span>
        </CardTitle>
        <CardDescription className="text-[var(--text-secondary)]">
          Créez votre compte pour commencer à trader
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Suspense fallback={<Loader />}>
          <SignUpProviders providers={providers} />
        </Suspense>

        {/* Sign in link */}
        <div className="pt-4 text-center text-sm text-[var(--text-muted)]">
          Déjà un compte?{" "}
          <Link
            href="/auth/signin"
            className="font-medium text-[#00ffaa] transition-colors hover:text-[#00ffaa]/80"
          >
            Se connecter
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
