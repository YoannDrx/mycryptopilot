import { getRequiredUser } from "@/lib/auth/auth-user";
import { DiscordConnectionCard } from "./discord-connection-card";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { redirect } from "next/navigation";

export default async function RoutePage({
  searchParams,
}: {
  searchParams: Promise<{ synced?: string; reconnect?: string; unlinked?: string }>;
}) {
  const session = await getRequiredUser();
  const params = await searchParams;

  // Lire l'utilisateur directement depuis la DB (pas la session qui est en cache)
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      discordId: true,
      discordIntegrationEnabled: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Auto-sync Discord ID dans trois cas :
  // Cas 1: User veut l'intégration (discordIntegrationEnabled = true) ET pas encore lié
  // Cas 2: User vient de faire l'OAuth avec ?synced=true - réactivation après première connexion
  // Cas 3: User vient de faire l'OAuth avec ?reconnect=true - réactivation après unlink
  const isReconnecting = params.reconnect === "true" || params.synced === "true";
  const shouldSync =
    !user.discordId &&
    (isReconnecting || user.discordIntegrationEnabled);

  if (shouldSync) {
    const discordAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: "discord",
      },
      select: {
        accountId: true,
      },
    });

    // Si un compte Discord existe, mettre à jour le user avec le discordId
    if (discordAccount?.accountId) {
      logger.info(
        `[DISCORD SYNC] Found Discord account ${discordAccount.accountId} for user ${user.id}, syncing...`,
      );

      await prisma.user.update({
        where: { id: user.id },
        data: {
          discordId: discordAccount.accountId,
          discordIntegrationEnabled: true, // Réactiver l'intégration
        },
      });

      logger.info(
        `✅ [DISCORD SYNC] Discord ID ${discordAccount.accountId} synced to user ${user.id}`,
      );

      // Redirect pour forcer un reload complet avec les données fraîches
      redirect("/account/discord?synced=true");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <DiscordConnectionCard user={user} />
    </div>
  );
}
