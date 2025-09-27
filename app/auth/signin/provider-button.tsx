import { Logo } from "@/components/nowts/logo";
import { Badge } from "@/components/ui/badge";
import { LoadingButton } from "@/features/form/submit-button";
import { authClient } from "@/lib/auth-client";
import { getCallbackUrl } from "@/lib/auth/auth-utils";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useLastUsedProviderStore } from "./last-used-provider.store";

const ProviderData: Record<
  "github" | "google" | "discord",
  { icon: ReactNode; name: string; colorClass?: string }
> = {
  github: {
    icon: <Logo name="github" size={16} />,
    name: "Github",
  },
  google: {
    icon: <Logo name="google" size={16} />,
    name: "Google",
  },
  discord: {
    icon: <Logo name="discord" size={16} />,
    name: "Discord",
    colorClass:
      "border-[#5865F2] bg-[#5865F2] text-white hover:bg-[#4752C4] dark:border-[#5865F2]",
  },
};

type ProviderButtonProps = {
  providerId: "github" | "google" | "discord";
  callbackUrl?: string;
};

export const ProviderButton = (props: ProviderButtonProps) => {
  const { lastUsedProvider } = useLastUsedProviderStore();

  const githubSignInMutation = useMutation({
    mutationFn: async () => {
      await authClient.signIn.social({
        provider: props.providerId,
        callbackURL: getCallbackUrl(
          `/auth/last-used-provider?provider=${props.providerId}&callbackUrl=${props.callbackUrl ?? "/account"}`,
        ),
      });
    },
  });

  const data = ProviderData[props.providerId];
  const isLastUsed = lastUsedProvider === props.providerId;

  return (
    <div className="relative w-full">
      {isLastUsed && (
        <Badge
          variant="secondary"
          className="absolute -top-2.5 -right-2.5 z-10"
        >
          Last used
        </Badge>
      )}
      <LoadingButton
        loading={githubSignInMutation.isPending}
        className={cn("w-full", {
          "border bg-white text-black hover:bg-white dark:border-neutral-700":
            data.name === "Google",
          "border bg-black text-white hover:bg-gray-950 dark:border-neutral-700":
            data.name === "Github",
          [data.colorClass ?? ""]: data.colorClass,
        })}
        size="lg"
        onClick={() => {
          githubSignInMutation.mutate();
        }}
      >
        {data.icon}
        <span className="ml-2">Sign in with {data.name}</span>
      </LoadingButton>
    </div>
  );
};
