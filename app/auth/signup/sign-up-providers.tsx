"use client";

import { useSearchParams } from "next/navigation";
import { ProviderButton } from "../signin/provider-button";
import { SignUpCredentialsForm } from "./sign-up-credentials-form";

export const SignUpProviders = ({
  providers,
  callbackUrl,
}: {
  providers: string[];
  callbackUrl?: string;
}) => {
  const searchParams = useSearchParams();
  const callbackUrlParams = searchParams.get("callbackUrl");

  callbackUrl ??= callbackUrlParams as string;

  const gridClassName =
    providers.length <= 2
      ? "grid grid-cols-1 gap-3 lg:grid-cols-2"
      : "grid grid-cols-1 gap-3";

  return (
    <div className="flex flex-col gap-5">
      {/* Social Providers First */}
      {providers.length > 0 && (
        <>
          <div className={gridClassName}>
            {providers.includes("discord") && (
              <ProviderButton providerId="discord" callbackUrl={callbackUrl} />
            )}
            {providers.includes("google") && (
              <ProviderButton providerId="google" callbackUrl={callbackUrl} />
            )}
            {providers.includes("github") && (
              <ProviderButton providerId="github" callbackUrl={callbackUrl} />
            )}
          </div>

          {/* Terminal Style Separator */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent" />
            <span className="relative z-10 bg-[var(--bg-onyx)] px-4">
              <span className="terminal-text text-xs">OU CRÉER UN COMPTE</span>
            </span>
          </div>
        </>
      )}

      {/* Credentials Form */}
      <SignUpCredentialsForm />
    </div>
  );
};
