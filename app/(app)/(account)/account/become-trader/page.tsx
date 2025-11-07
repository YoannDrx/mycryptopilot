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
import {
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
  LayoutContent,
} from "@/features/page/layout";
import { TrendingUp } from "lucide-react";

export default async function BecomeTraderPage() {
  const user = await getRequiredUser();

  // Get trader profile if exists
  const fullUser = await getUserWithTraderProfile(user.id);
  const traderProfile = fullUser?.traderProfile;

  if (traderProfile) {
    // Edit mode if profile exists
    return (
      <>
        <LayoutHeader className="flex flex-row items-center gap-3">
          <div className="bg-primary/10 text-primary flex items-center justify-center rounded-lg p-2">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <LayoutTitle>Edit Trader Profile</LayoutTitle>
            <LayoutDescription>
              Update your trader profile information
            </LayoutDescription>
          </div>
        </LayoutHeader>
        <LayoutContent className="max-w-2xl">
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
        </LayoutContent>
      </>
    );
  }

  // Creation mode if no profile
  return (
    <>
      <LayoutHeader className="flex flex-row items-center gap-3">
        <div className="bg-primary/10 text-primary flex items-center justify-center rounded-lg p-2">
          <TrendingUp className="size-5" />
        </div>
        <div>
          <LayoutTitle>Become a Trader</LayoutTitle>
          <LayoutDescription>
            Create your trader profile to start publishing signals
          </LayoutDescription>
        </div>
      </LayoutHeader>
      <LayoutContent className="max-w-2xl">
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
      </LayoutContent>
    </>
  );
}
