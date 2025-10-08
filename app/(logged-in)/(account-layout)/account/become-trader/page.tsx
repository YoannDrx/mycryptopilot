import { getRequiredUser } from "@/lib/auth/auth-user";
import { getUserWithTraderProfile } from "@/features/trader/trader-queries";
import { BecomeTraderForm } from "./become-trader-form";
import { EditTraderProfileForm } from "./edit-trader-profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function BecomeTraderPage() {
  const user = await getRequiredUser();

  // Récupérer le profil trader s'il existe
  const fullUser = await getUserWithTraderProfile(user.id);
  const traderProfile = fullUser?.traderProfile;

  if (traderProfile) {
    // Mode édition si profil existe
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Modifier mon profil trader</CardTitle>
            <CardDescription>
              Mettez à jour vos informations de profil trader
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditTraderProfileForm
              defaultValues={{
                displayName: traderProfile.displayName,
                bio: traderProfile.bio,
                priceMonthlyUSD: traderProfile.priceMonthlyUSD,
                image: fullUser.image,
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mode création si pas de profil
  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Devenir Trader</CardTitle>
          <CardDescription>
            Créez votre profil trader pour commencer à publier des signaux de
            trading et obtenir des followers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BecomeTraderForm />
        </CardContent>
      </Card>
    </div>
  );
}
