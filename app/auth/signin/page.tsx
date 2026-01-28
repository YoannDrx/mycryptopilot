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
import { SignInProviders } from "./sign-in-providers";

export const metadata: Metadata = {
  title: `Sign In | ${SiteConfig.title}`,
  description:
    "Sign in to your account to access your trading dashboard and signals.",
};

export default async function AuthSignInPage() {
  const user = await getUser();

  if (user) {
    redirect("/account");
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
          <span className="terminal-text text-sm">CONNEXION</span>
        </CardTitle>
        <CardDescription className="text-[var(--text-secondary)]">
          Connectez-vous pour accéder à votre dashboard
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <SignInProviders providers={providers} />

        {/* Sign up link */}
        <div className="pt-4 text-center text-sm text-[var(--text-muted)]">
          Pas encore de compte?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-[#00ffaa] transition-colors hover:text-[#00ffaa]/80"
          >
            Créer un compte
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
