import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTreasuryBalance } from "@/lib/crypto/treasury-balance";
import { TreasuryRefreshButton } from "./treasury-refresh-button";

/**
 * TreasuryCard Component
 *
 * Affiche la trésorerie crypto totale de MyCryptoPilot avec:
 * - Montant total on-chain (BASE + TRON non-swept)
 * - Breakdown par réseau (USDC vs USDT)
 * - Nombre d'adresses actives
 * - Montant déjà swept vers Binance
 * - Bouton de refresh manuel
 *
 * Server Component qui récupère les balances on-chain via getTreasuryBalance().
 */
export async function TreasuryCard() {
  const treasury = await getTreasuryBalance();

  return (
    <Card>
      <CardHeader>
        <CardTitle>💰 Trésorerie Crypto</CardTitle>
        <CardDescription>Balances on-chain + swept historique</CardDescription>
        <CardAction>
          <TreasuryRefreshButton />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Total on-chain */}
        <div>
          <div className="text-primary text-3xl font-bold">
            ${treasury.totalUSD.toFixed(2)}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Total on-chain (non-swept)
          </p>
        </div>

        {/* Breakdown par réseau */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-sm">
            🟦 BASE: ${treasury.base.totalUSDC.toFixed(2)} USDC
          </Badge>
          <Badge variant="outline" className="text-sm">
            🟣 TRON: ${treasury.tron.totalUSDT.toFixed(2)} USDT
          </Badge>
        </div>

        {/* Nombre d'adresses actives */}
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>
            📦 {treasury.base.addressCount + treasury.tron.addressCount}{" "}
            adresses actives
          </span>
          <span className="text-muted-foreground/50">•</span>
          <span className="text-xs">
            ({treasury.base.addressCount} BASE + {treasury.tron.addressCount}{" "}
            TRON)
          </span>
        </div>

        {/* Montant swept historique */}
        <div className="border-t pt-4">
          <div className="flex items-baseline gap-2">
            <div className="text-success text-xl font-semibold">
              ${treasury.sweptAmount.toFixed(2)}
            </div>
            <span className="text-muted-foreground text-sm">déjà swept</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            🧹 Transféré vers Binance (historique complet)
          </p>
        </div>

        {/* Last updated */}
        <div className="text-muted-foreground text-xs">
          Dernière mise à jour:{" "}
          {treasury.lastUpdated.toLocaleTimeString("fr-FR")}
        </div>
      </CardContent>
    </Card>
  );
}
