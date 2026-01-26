/**
 * Slippage Guard
 *
 * Enforces maximum slippage thresholds for copy-trading executions.
 *
 * Defaults:
 * - Spot: 1%
 * - Futures/Perp: 2%
 *
 * Thresholds can be overridden via environment variables:
 * - SLIPPAGE_THRESHOLD_SPOT
 * - SLIPPAGE_THRESHOLD_FUTURES
 */

const DEFAULT_SPOT_THRESHOLD =
  Number(process.env.SLIPPAGE_THRESHOLD_SPOT ?? "1") || 1;
const DEFAULT_FUTURES_THRESHOLD =
  Number(process.env.SLIPPAGE_THRESHOLD_FUTURES ?? "2") || 2;

export class SlippageExceededError extends Error {
  constructor(
    public readonly slippage: number,
    public readonly threshold: number,
    public readonly instrumentType: string,
  ) {
    super(
      `SLIPPAGE_EXCEEDED: Slippage ${slippage.toFixed(2)}% exceeds ${threshold.toFixed(2)}% threshold for ${instrumentType}`,
    );
    this.name = "SlippageExceededError";
  }
}

export function getSlippageThreshold(instrumentType?: string): number {
  return instrumentType === "FUTURES_USDT"
    ? DEFAULT_FUTURES_THRESHOLD
    : DEFAULT_SPOT_THRESHOLD;
}

export function assertSlippageWithinThreshold(
  slippage: number,
  instrumentType?: string,
): void {
  const threshold = getSlippageThreshold(instrumentType);

  if (Math.abs(slippage) > threshold) {
    throw new SlippageExceededError(
      slippage,
      threshold,
      instrumentType ?? "SPOT",
    );
  }
}
