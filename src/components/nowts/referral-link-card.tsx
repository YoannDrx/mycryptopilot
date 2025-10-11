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
  const referralUrl = `${SiteConfig.prodUrl}/follow/${traderId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success("Lien copié dans le presse-papier!");

      // Reset après 2 secondes
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error("Erreur lors de la copie du lien");
    }
  };

  const handleShare = async () => {
    // Vérifier si l'API Web Share est disponible
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- navigator.share peut être undefined sur desktop
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Suivez ${traderName} sur MyCryptoPilot`,
          text: `Recevez les signaux de trading de ${traderName} en temps réel!`,
          url: referralUrl,
        });
        toast.success("Partagé avec succès!");
      } catch (error) {
        // L'utilisateur a annulé le partage
        if ((error as Error).name !== "AbortError") {
          toast.error("Erreur lors du partage");
        }
      }
    } else {
      // Fallback: copier dans le presse-papier
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
              Ton lien de parrainage
            </CardTitle>
            <CardDescription>
              Partage ce lien pour que d'autres puissent te suivre facilement
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lien avec bouton copier */}
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

        {/* Actions rapides */}
        <div className="flex gap-2">
          <Button onClick={handleShare} variant="default" className="flex-1">
            <Share2 className="mr-2 size-4" />
            Partager
          </Button>
          <Button variant="outline" asChild>
            <a href={referralUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 size-4" />
              Prévisualiser
            </a>
          </Button>
        </div>

        {/* Stats & info */}
        <div className="bg-muted rounded-lg p-4">
          <div className="text-muted-foreground space-y-2 text-sm">
            <p className="font-medium">💡 Comment utiliser ton lien?</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Partage-le sur les réseaux sociaux (Twitter, Discord, etc.)</li>
              <li>Envoie-le par email à tes contacts</li>
              <li>
                Ajoute-le à ta bio ou signature pour gagner des followers
                automatiquement
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
