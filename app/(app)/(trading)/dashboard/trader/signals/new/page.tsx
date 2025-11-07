import { getRequiredUser } from "@/lib/auth/auth-user";
import { getTraderProfileByUserId } from "@/features/trader/trader-queries";
import { redirect } from "next/navigation";
import { CreateSignalForm } from "./create-signal-form";
import {
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
  LayoutContent,
} from "@/features/page/layout";
import { PlusCircle } from "lucide-react";

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
    <>
      <LayoutHeader className="flex flex-row items-center gap-3">
        <div className="bg-primary/10 text-primary flex items-center justify-center rounded-lg p-2">
          <PlusCircle className="size-5" />
        </div>
        <div>
          <LayoutTitle>Create New Signal</LayoutTitle>
          <LayoutDescription>
            Share your trading analysis with your followers
          </LayoutDescription>
        </div>
      </LayoutHeader>

      <LayoutContent>
        <CreateSignalForm traderName={traderProfile.displayName} />
      </LayoutContent>
    </>
  );
}
