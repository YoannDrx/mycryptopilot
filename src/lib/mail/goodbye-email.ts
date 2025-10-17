import { logger } from "../logger";
import { sendEmail } from "./send-email";
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

    const result = await sendEmail({
      to: userEmail,
      subject: "Ton compte a été supprimé - MyCryptoPilot",
      html: GoodbyeEmail({
        userName: userName || userEmail.split("@")[0],
      }),
    });

    if (result.error) {
      logger.error("Error sending goodbye email:", result.error);
      return false;
    }

    logger.info(`✅ Goodbye email sent successfully to ${userEmail}`);
    return true;
  } catch (error) {
    logger.error("Exception in sendGoodbyeEmail:", error);
    return false;
  }
}
