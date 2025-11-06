import { Typography } from "@/components/nowts/typography";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { getTraderProfileByUserId } from "@/features/trader/trader-queries";
import { redirect } from "next/navigation";
import { CreateSignalForm } from "./create-signal-form";

/**
 * New Signal Page
 *
 * Big Bang (Issue #77 Phase 11) - Adapted for user-centric architecture
 * - Removed getRequiredCurrentOrgCache()
 * - Direct URLs (no /orgs/${slug} prefix)
 */
export default async function NewSignalPage() {
  const user = await getRequiredUser();

  // Récupérer le profil trader
  const traderProfile = await getTraderProfileByUserId(user.id);

  if (!traderProfile) {
    // Rediriger vers la création de profil trader
    redirect("/account/become-trader");
  }

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <div className="mb-8">
        <Typography variant="h1">Create New Signal</Typography>
        <Typography variant="muted">
          Share your trading analysis with your followers
        </Typography>
      </div>

      <CreateSignalForm traderName={traderProfile.displayName} />
    </div>
  );
}
