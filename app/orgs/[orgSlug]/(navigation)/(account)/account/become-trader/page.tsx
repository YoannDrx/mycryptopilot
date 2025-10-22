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

  // Get trader profile if exists
  const fullUser = await getUserWithTraderProfile(user.id);
  const traderProfile = fullUser?.traderProfile;

  if (traderProfile) {
    // Edit mode if profile exists
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit my trader profile</CardTitle>
            <CardDescription>
              Update your trader profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditTraderProfileForm
              defaultValues={{
                displayName: traderProfile.displayName,
                bio: traderProfile.bio,
                image: fullUser.image,
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Creation mode if no profile
  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Become a Trader</CardTitle>
          <CardDescription>
            Create your trader profile to start publishing trading signals and
            gain followers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BecomeTraderForm />
        </CardContent>
      </Card>
    </div>
  );
}
