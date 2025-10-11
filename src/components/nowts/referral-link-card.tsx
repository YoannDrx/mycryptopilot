"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SiteConfig } from "@/site-config";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ReferralLinkCardProps = {
  traderId: string;
  traderName: string;
};

export const ReferralLinkCard = ({
  traderId,
  traderName,
}: ReferralLinkCardProps) => {
  const [copied, setCopied] = useState(false);
  const referralUrl = `${SiteConfig.appUrl}/follow/${traderId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");

      // Reset after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error("Error copying link");
    }
  };

  const handleShare = async () => {
    // Check if Web Share API is available
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- navigator.share can be undefined on desktop
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Follow ${traderName} on MyCryptoPilot`,
          text: `Get ${traderName}'s trading signals in real-time!`,
          url: referralUrl,
        });
        toast.success("Shared successfully!");
      } catch (error) {
        // User cancelled sharing
        if ((error as Error).name !== "AbortError") {
          toast.error("Error sharing");
        }
      }
    } else {
      // Fallback: copy to clipboard
      await handleCopy();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="size-5" />
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Share this link so others can easily follow you
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Link with copy button */}
        <div className="flex gap-2">
          <Input
            value={referralUrl}
            readOnly
            className="font-mono text-sm"
            onClick={(e) => e.currentTarget.select()}
          />
          <Button
            onClick={handleCopy}
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            {copied ? (
              <Check className="size-4 text-green-600" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <Button onClick={handleShare} variant="default" className="flex-1">
            <Share2 className="mr-2 size-4" />
            Share
          </Button>
          <Button variant="outline" asChild>
            <a href={referralUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 size-4" />
              Preview
            </a>
          </Button>
        </div>

        {/* Stats & info */}
        <div className="bg-muted rounded-lg p-4">
          <div className="text-muted-foreground space-y-2 text-sm">
            <p className="font-medium">💡 How to use your link?</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Share it on social media (Twitter, Discord, etc.)</li>
              <li>Send it by email to your contacts</li>
              <li>
                Add it to your bio or signature to automatically gain followers
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
