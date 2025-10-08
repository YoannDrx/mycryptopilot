import { getUserWithTraderProfile } from "@/features/trader/trader-queries";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { combineWithParentMetadata } from "@/lib/metadata";
import { EditProfileCardForm } from "./edit-profile-form";
import { TraderModeToggle } from "./trader-mode-toggle";

export const generateMetadata = combineWithParentMetadata({
  title: "Settings",
  description: "Update your profile.",
});

export default async function EditProfilePage() {
  const user = await getRequiredUser();
  const fullUser = await getUserWithTraderProfile(user.id);

  return (
    <div className="flex flex-col gap-4 lg:gap-8">
      <EditProfileCardForm defaultValues={user} />
      <TraderModeToggle
        hasTraderProfile={!!fullUser?.traderProfile}
        currentRole={fullUser?.userRole ?? "USER"}
      />
    </div>
  );
}
