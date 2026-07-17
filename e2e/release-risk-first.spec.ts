import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";

import { createTestAccount } from "./utils/auth-test";
import { createMockExchangeConnection } from "./utils/portfolio-test";

const signUpForRiskConsole = async (
  page: Parameters<typeof createTestAccount>[0]["page"],
) => {
  const userData = await createTestAccount({
    page,
    callbackURL: "/risk-console",
  });
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: userData.email },
  });
  return { user, userData };
};

test("simulates risk without exposing an execution action", async ({
  page,
}) => {
  await signUpForRiskConsole(page);

  await expect(
    page.getByRole("heading", { name: "Risk Console" }),
  ).toBeVisible();
  await expect(page.getByText(/never sends an order/i)).toBeVisible();
  await page.getByLabel("Total Capital (USD)").fill("10000");
  await page.getByLabel("Risk Per Trade (%)").fill("1");
  await page.getByLabel("Entry Price (USD)").fill("50000");
  await page.getByLabel("Stop Loss (USD)").fill("49000");
  await expect(page.getByText(/Risk Amount:/i)).toContainText("100");
  await expect(
    page.getByRole("button", { name: /execute|buy|sell|place order/i }),
  ).toHaveCount(0);
});

test("shows the sourced signal surface without payment or copy-trading CTAs", async ({
  page,
}) => {
  await signUpForRiskConsole(page);
  await page.goto("/signals");

  await expect(
    page.getByRole("heading", { name: "Signals Feed" }),
  ).toBeVisible();
  await expect(page.getByText(/No Signals Found/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /copy trade|execute trade|subscribe/i }),
  ).toHaveCount(0);
});

test("rejects unverified credentials and stores no exchange secret", async ({
  page,
}) => {
  const { user } = await signUpForRiskConsole(page);
  await page.goto("/account/exchanges");

  await expect(
    page.getByRole("heading", { name: "Exchange Connections" }),
  ).toBeVisible();
  await expect(page.getByText(/Read-only connection/i).first()).toBeVisible();
  await page.getByLabel("API Key *").fill("invalid-read-only-key");
  await page.getByLabel("Secret Key *").fill("invalid-secret");
  await page.getByRole("button", { name: "Connect Exchange" }).click();
  await expect(
    page.getByText(/failed to validate|invalid api/i).first(),
  ).toBeVisible({
    timeout: 30_000,
  });

  const storedConnections = await prisma.exchangeConnection.count({
    where: { trader: { userId: user.id } },
  });
  expect(storedConnections).toBe(0);
});

test("revokes a read-only connection while retaining its history boundary", async ({
  page,
}) => {
  const { user } = await signUpForRiskConsole(page);
  await page.goto("/account/exchanges");
  const profile = await prisma.traderProfile.findUniqueOrThrow({
    where: { userId: user.id },
  });
  const connection = await createMockExchangeConnection({
    traderProfileId: profile.id,
  });

  await page.reload();
  await expect(page.getByText("BINANCE").first()).toBeVisible();
  await page.getByRole("button", { name: "Disconnect" }).click();
  await page.getByTestId("dialog-confirm-input").fill("Disconnect");
  await page.getByRole("button", { name: "Disconnect" }).last().click();

  await expect
    .poll(async () => {
      const stored = await prisma.exchangeConnection.findUniqueOrThrow({
        where: { id: connection.id },
      });
      return stored.isActive;
    })
    .toBe(false);
  expect(
    await prisma.exchangeConnection.count({ where: { id: connection.id } }),
  ).toBe(1);
});
