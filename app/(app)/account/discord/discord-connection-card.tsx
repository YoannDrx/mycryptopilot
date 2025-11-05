"use client";

import { LoadingButton } from "@/features/form/submit-button";
import { authClient } from "@/lib/auth-client";
import { MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { unlinkDiscordAction } from "@/features/user/user.action";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";

type DiscordConnectionCardProps = {
  user: { discordId?: string | null };
};

export const DiscordConnectionCard = ({ user }: DiscordConnectionCardProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isConnecting, setIsConnecting] = useState(false);
  const toastShownRef = useRef(false);

  const discordId = user.discordId;

  // Afficher le toast après reconnect Discord
  useEffect(() => {
    if (toastShownRef.current) return;

    const synced = searchParams.get("synced") === "true";

    if (synced && discordId) {
      toast.success("Discord bot connected successfully!");
      toastShownRef.current = true;
      // Attendre un peu avant de nettoyer l'URL pour que l'utilisateur voie le toast
      setTimeout(() => {
        router.replace("/account/discord");
      }, 100);
    }
  }, [searchParams, router, discordId]);

  const connectDiscord = async () => {
    setIsConnecting(true);
    try {
      await authClient.signIn.social({
        provider: "discord",
        callbackURL: "/account/discord?reconnect=true",
      });
    } catch {
      toast.error("Failed to connect Discord");
      setIsConnecting(false);
    }
  };

  const unlinkMutation = useMutation({
    mutationFn: async () => {
      const result = await unlinkDiscordAction({});

      if (!result.data?.success) {
        throw new Error(result.serverError ?? "Failed to unlink Discord");
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success("Discord account unlinked successfully");
      // Forcer le refresh de la page pour recharger les données
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unlink Discord");
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="size-6 text-[#5865F2]" />
          <div>
            <CardTitle>Discord Integration</CardTitle>
            <CardDescription>
              Connect your Discord account to receive notifications and access
              exclusive features
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {discordId ? (
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-[#5865F2]/10">
                <MessageSquare className="size-5 text-[#5865F2]" />
              </div>
              <div>
                <p className="font-medium">Discord Connected</p>
                <p className="text-muted-foreground text-sm">
                  Discord ID: {discordId.slice(0, 8)}...
                  {discordId.slice(-4)}
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-green-500/10 text-green-600"
            >
              ✓ Connected
            </Badge>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <MessageSquare className="text-muted-foreground mx-auto mb-2 size-8" />
            <p className="mb-1 text-sm font-medium">
              No Discord account connected
            </p>
            <p className="text-muted-foreground text-xs">
              Connect your Discord to use the bot commands and receive
              notifications
            </p>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Benefits:</h4>
          <ul className="text-muted-foreground space-y-1 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Use Discord bot commands (/status, /signals, /follow)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Receive instant notifications for new trading signals</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Get automatic role assignment based on your plan</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Access to exclusive Discord community channels</span>
            </li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {discordId ? (
          <LoadingButton
            variant="destructive"
            size="sm"
            onClick={() => unlinkMutation.mutate()}
            loading={unlinkMutation.isPending}
          >
            <X className="mr-2 size-4" />
            Unlink Discord
          </LoadingButton>
        ) : (
          <LoadingButton
            onClick={connectDiscord}
            loading={isConnecting}
            className="bg-[#5865F2] hover:bg-[#4752C4]"
          >
            <MessageSquare className="mr-2 size-4" />
            Connect Discord
          </LoadingButton>
        )}
      </CardFooter>
    </Card>
  );
};
