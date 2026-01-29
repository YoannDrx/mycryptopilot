"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeToWaitlist } from "@/features/subscribe/subscribe.action";
import { cn } from "@/lib/utils";
import { CheckCircle, Loader2, Mail } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

type EmailSubscribeFormProps = {
  source?: "mobile_app_waitlist" | "newsletter" | "early_access";
  locale?: "fr" | "en";
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
  className?: string;
  variant?: "default" | "compact";
};

export function EmailSubscribeForm({
  source = "mobile_app_waitlist",
  locale = "fr",
  placeholder,
  buttonText,
  successMessage,
  className,
  variant = "default",
}: EmailSubscribeFormProps) {
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const defaultPlaceholder =
    locale === "fr" ? "Entrez votre email" : "Enter your email";
  const defaultButtonText = locale === "fr" ? "M'inscrire" : "Subscribe";
  const defaultSuccessMessage =
    locale === "fr"
      ? "Merci ! Vous serez notifié(e)."
      : "Thanks! You'll be notified.";

  const { execute, isPending } = useAction(subscribeToWaitlist, {
    onSuccess: () => {
      setIsSuccess(true);
      setEmail("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isPending) return;
    execute({ email, source, locale });
  };

  if (isSuccess) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-[var(--accent-emerald)]/30 bg-[var(--accent-emerald)]/10 px-4 py-3 text-sm text-[var(--accent-emerald)]",
          className,
        )}
      >
        <CheckCircle className="size-5" />
        <span>{successMessage ?? defaultSuccessMessage}</span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
        <div className="relative flex-1">
          <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder ?? defaultPlaceholder}
            className="pl-10"
            required
            disabled={isPending}
          />
        </div>
        <Button type="submit" variant="emerald" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            (buttonText ?? defaultButtonText)
          )}
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-3 sm:flex-row", className)}
    >
      <div className="relative flex-1">
        <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder ?? defaultPlaceholder}
          className="h-12 pl-10 text-base"
          required
          disabled={isPending}
        />
      </div>
      <Button
        type="submit"
        variant="emerald"
        size="lg"
        className="h-12 px-8"
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          (buttonText ?? defaultButtonText)
        )}
      </Button>
    </form>
  );
}
