export type MyCryptoPilotFeatureStatus = "active" | "hidden" | "beta";
export type MyCryptoPilotFeatureName = keyof typeof MY_CRYPTO_PILOT_FEATURES;

export const MY_CRYPTO_PILOT_FEATURES = {
  riskConsole: { status: "active", paths: ["/risk-console"] },
  signals: { status: "active", paths: ["/signals"] },
  portfolioReadOnly: { status: "active", paths: ["/portfolio"] },
  traders: { status: "active", paths: ["/traders"] },
  account: { status: "active", paths: ["/account"] },
  legacyDashboard: {
    status: "hidden",
    paths: ["/dashboard", "/following", "/analytics", "/trader-tools"],
  },
  copyTrading: { status: "hidden", paths: ["/my-trades"] },
  cryptoSchool: { status: "hidden", paths: ["/school"] },
  tax: { status: "hidden", paths: ["/tax"] },
  publicPayments: {
    status: "hidden",
    paths: ["/checkout", "/pricing", "/payment", "/account/payments"],
  },
  discordCommunity: { status: "hidden", paths: ["/account/discord"] },
} as const satisfies Record<
  string,
  { status: MyCryptoPilotFeatureStatus; paths: readonly string[] }
>;

export const isMyCryptoPilotPathEnabled = (pathname: string) =>
  !Object.values(MY_CRYPTO_PILOT_FEATURES).some(
    (feature) =>
      feature.status === "hidden" &&
      feature.paths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
      ),
  );

export const isMyCryptoPilotFeatureActive = (
  feature: MyCryptoPilotFeatureName,
) => MY_CRYPTO_PILOT_FEATURES[feature].status === "active";

/**
 * This is a product safety boundary, not a remotely configurable feature flag.
 * MyCryptoPilot never creates orders or public crypto payments in this build.
 */
export const MY_CRYPTO_PILOT_RUNTIME_MODE = "READ_ONLY_DEMO" as const;

export class FinancialExecutionDisabledError extends Error {
  constructor(operation: string) {
    super(
      `${operation} is unavailable: MyCryptoPilot is a read-only demo and never executes financial transactions.`,
    );
    this.name = "FinancialExecutionDisabledError";
  }
}

export function rejectFinancialExecution(operation: string): void {
  throw new FinancialExecutionDisabledError(operation);
}
