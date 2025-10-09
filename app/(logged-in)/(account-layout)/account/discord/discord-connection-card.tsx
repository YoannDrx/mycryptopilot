"use client";

import { LoadingButton } from "@/features/form/submit-button";
import { authClient } from "@/lib/auth-client";
import type { User } from "better-auth";
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
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { unlinkDiscordAction } from "@/features/user/user.action";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

type DiscordConnectionCardProps = {
  user: User;
};

export const DiscordConnectionCard = ({
  user,
}: DiscordConnectionCardProps) => {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);

  const discordId = (user as User & { discordId?: string | null }).discordId;

  const connectDiscord = async () => {
    setIsConnecting(true);
    try {
      await authClient.signIn.social({
        provider: "discord",
        callbackURL: "/account/discord",
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
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
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
                <p className="text-sm text-muted-foreground">
                  Discord ID: {discordId.slice(0, 8)}...
                  {discordId.slice(-4)}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
              ✓ Connected
            </Badge>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <MessageSquare className="mx-auto mb-2 size-8 text-muted-foreground" />
            <p className="mb-1 text-sm font-medium">No Discord account connected</p>
            <p className="text-xs text-muted-foreground">
              Connect your Discord to use the bot commands and receive
              notifications
            </p>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Benefits:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
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
          <>
            <LoadingButton
              variant="destructive"
              size="sm"
              onClick={() => unlinkMutation.mutate()}
              loading={unlinkMutation.isPending}
            >
              <X className="mr-2 size-4" />
              Unlink Discord
            </LoadingButton>
            <div className="flex-1"></div>
            <Button
              variant="outline"
              size="sm"
              onClick={connectDiscord}
              disabled={isConnecting}
            >
              <MessageSquare className="mr-2 size-4" />
              Reconnect
            </Button>
          </>
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
