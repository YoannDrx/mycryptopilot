"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/nowts/logo";
import { getUserAccountsAction } from "@/lib/actions/user-accounts.action";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLastUsedProviderStore } from "../../../../auth/signin/last-used-provider.store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DisconnectProviderDialog } from "./disconnect-provider-dialog";

type AuthProviderBadgeProps = {
  userId: string;
  onProviderChange?: (providerId: string, avatarUrl: string | null) => void;
};

export const AuthProviderBadge = ({
  userId,
  onProviderChange,
}: AuthProviderBadgeProps) => {
  const {
    data: accounts,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["user-accounts", userId],
    queryFn: async () => getUserAccountsAction(),
  });
  const { lastUsedProvider, setLastUsedProvider } = useLastUsedProviderStore();

  const switchProviderMutation = useMutation({
    mutationFn: async (providerId: string) => {
      // Find the account for this provider
      const account = accounts?.find((a) => a.providerId === providerId);
      if (!account) {
        throw new Error(`No account found for provider: ${providerId}`);
      }

      // Set this as the active provider
      setLastUsedProvider(providerId as "github" | "google" | "discord");

      // Get avatar URL for this provider
      let avatarUrl = null;
      if (providerId === "github" && account.accountId) {
        avatarUrl = `https://github.com/${account.accountId}.png`;
      } else if (providerId === "google") {
        if (account.idToken) {
          try {
            const decodedToken = JSON.parse(
              Buffer.from(account.idToken.split(".")[1], "base64").toString(),
            );
            avatarUrl = decodedToken.picture;
          } catch {
            avatarUrl = account.accountId;
          }
        } else {
          avatarUrl = account.accountId;
        }
      } else if (providerId === "discord") {
        if (account.accountId && account.id) {
          avatarUrl = `https://cdn.discordapp.com/avatars/${account.accountId}/${account.id}.png`;
        } else {
          avatarUrl = account.accountId;
        }
      }

      return { providerId, avatarUrl };
    },
    onSuccess: (data) => {
      toast.success(`Switched to ${data.providerId}`);
      onProviderChange?.(data.providerId, data.avatarUrl);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <Badge variant="secondary" className="gap-1">
        <span>Loading...</span>
      </Badge>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <Badge variant="secondary" className="gap-1">
        <span>No connected providers</span>
      </Badge>
    );
  }

  const getProviderInfo = (providerId: string) => {
    switch (providerId) {
      case "github":
        return {
          name: "GitHub",
          color: "bg-gray-900 text-white",
          logo: <Logo name="github" size={14} />,
        };
      case "google":
        return {
          name: "Google",
          color: "bg-blue-500 text-white",
          logo: <Logo name="google" size={14} />,
        };
      case "discord":
        return {
          name: "Discord",
          color: "bg-[#5865F2] text-white",
          logo: <Logo name="discord" size={14} />,
        };
      default:
        return {
          name: providerId.charAt(0).toUpperCase() + providerId.slice(1),
          color: "bg-gray-500 text-white",
          logo: null,
        };
    }
  };

  // Get unique providers
  const uniqueProviders = Array.from(
    new Map(accounts.map((account) => [account.providerId, account])).values(),
  );

  const activeProvider = lastUsedProvider ?? uniqueProviders[0]?.providerId;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Active provider:</span>
        {activeProvider && (
          <Badge
            className={`${getProviderInfo(activeProvider).color} gap-1 px-2 py-1`}
          >
            {getProviderInfo(activeProvider).logo}
            <span>{getProviderInfo(activeProvider).name}</span>
          </Badge>
        )}
      </div>

      {uniqueProviders.length > 1 && (
        <div className="space-y-2">
          <span className="text-sm font-medium">Switch provider:</span>
          <div className="flex flex-wrap gap-2">
            {uniqueProviders
              .filter((account) => account.providerId !== activeProvider)
              .map((account) => {
                const providerInfo = getProviderInfo(account.providerId);
                return (
                  <Button
                    key={account.providerId}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() =>
                      switchProviderMutation.mutate(account.providerId)
                    }
                    disabled={switchProviderMutation.isPending}
                  >
                    {providerInfo.logo}
                    <span>{providerInfo.name}</span>
                  </Button>
                );
              })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <span className="text-sm font-medium">Manage providers:</span>
        <div className="flex flex-wrap gap-2">
          {uniqueProviders.map((account) => {
            const providerInfo = getProviderInfo(account.providerId);
            const isLastProvider = uniqueProviders.length === 1;
            return (
              <Dialog key={account.providerId}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive gap-1"
                    disabled={isLastProvider}
                  >
                    {providerInfo.logo}
                    <span>Disconnect {providerInfo.name}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Disconnect {providerInfo.name}</DialogTitle>
                    <DialogDescription>
                      {isLastProvider
                        ? "You cannot disconnect your last provider. You need at least one provider to stay signed in."
                        : `Are you sure you want to disconnect ${providerInfo.name}? You will no longer be able to sign in with this provider.`}
                    </DialogDescription>
                  </DialogHeader>
                  {!isLastProvider && (
                    <DisconnectProviderDialog
                      providerId={account.providerId}
                      onSuccess={() => {
                        void refetch();
                        toast.success(`${providerInfo.name} disconnected`);
                      }}
                    />
                  )}
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      </div>
    </div>
  );
};
