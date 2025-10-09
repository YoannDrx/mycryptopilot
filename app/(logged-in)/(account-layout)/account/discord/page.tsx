import { getRequiredUser } from "@/lib/auth/auth-user";
import { DiscordConnectionCard } from "./discord-connection-card";

export default async function RoutePage() {
  const user = await getRequiredUser();

  return (
    <div className="flex flex-col gap-4">
      <DiscordConnectionCard user={user} />
    </div>
  );
}
