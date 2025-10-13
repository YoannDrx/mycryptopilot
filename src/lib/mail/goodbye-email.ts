import { env } from "../env";
import { logger } from "../logger";
import { resend } from "./resend";
import GoodbyeEmail from "@email/goodbye";

/**
 * Envoyer un email de confirmation après suppression de compte
 *
 * @param userEmail - Email du user
 * @param userName - Nom du user
 * @returns true si email envoyé avec succès
 */
export async function sendGoodbyeEmail(
  userEmail: string,
  userName: string,
): Promise<boolean> {
  try {
    logger.info(`Sending goodbye email to ${userEmail}...`);

    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: userEmail,
      subject: "Ton compte a été supprimé - MyCryptoPilot",
      react: GoodbyeEmail({
        userName: userName || userEmail.split("@")[0],
      }),
    });

    if (error) {
      logger.error("Error sending goodbye email:", error);
      return false;
    }

    logger.info(`✅ Goodbye email sent successfully to ${userEmail}`);
    return true;
  } catch (error) {
    logger.error("Exception in sendGoodbyeEmail:", error);
    return false;
  }
}
