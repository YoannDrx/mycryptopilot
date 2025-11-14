import { logger } from "@/lib/logger";

export async function sendMonitoringAlert(
  message: string,
): Promise<boolean> {
  const webhook = process.env.DISCORD_MONITOR_WEBHOOK;

  if (!webhook) {
    logger.warn("DISCORD_MONITOR_WEBHOOK not configured, skipping alert");
    return false;
  }

  const response = await fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: message,
    }),
  });

  if (!response.ok) {
    logger.error("Failed to send monitoring alert", {
      status: response.status,
      statusText: response.statusText,
    });
    return false;
  }

  logger.info("Monitoring alert sent");
  return true;
}
