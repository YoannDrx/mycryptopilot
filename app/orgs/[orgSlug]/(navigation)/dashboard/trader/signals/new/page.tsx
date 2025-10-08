import { Typography } from "@/components/nowts/typography";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { checkUserHasTraderProfile } from "@/features/trader/trader-queries";
import { redirect } from "next/navigation";
import { CreateSignalForm } from "./create-signal-form";

export default async function NewSignalPage() {
  const user = await getRequiredUser();

  // V�rifier que l'utilisateur est un trader
  const hasTraderProfile = await checkUserHasTraderProfile(user.id);

  if (!hasTraderProfile) {
    // Rediriger vers la cr�ation de profil trader
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

      <CreateSignalForm />
    </div>
  );
}
