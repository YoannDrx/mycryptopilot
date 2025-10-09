/**
 * Trading Card Utilities
 *
 * Utilitaires pour la génération et le calcul des cartes de trading
 */

import type { TradingCardPayloadType } from "./signal.schema";

// Re-export type for external usage
export type { TradingCardPayloadType } from "./signal.schema";

/**
 * Options pour le calcul de position size
 */
export type PositionSizeOptions = {
  /** Capital total disponible en USD */
  accountSize: number;

  /** Pourcentage de risque par trade (1-5% recommandé) */
  riskPercentage: number;

  /** Prix d'entrée */
  entryPrice: number;

  /** Prix d'invalidation (stop loss) */
  invalidationPrice: number;

  /** Direction du trade */
  bias: "LONG" | "SHORT";

  /** Levier utilisé (optionnel, default: 1) */
  leverage?: number;
};

/**
 * Résultat du calcul de position size
 */
export type PositionSizeResult = {
  /** Montant à risquer en USD */
  riskAmount: number;

  /** Pourcentage de risque (distance entry -> invalidation) */
  riskPercentageDistance: number;

  /** Taille de position en USD */
  positionSizeUSD: number;

  /** Taille de position en unités (quantité) */
  positionSizeUnits: number;

  /** Collatéral requis si levier utilisé */
  collateralRequired: number;

  /** Stop loss en USD */
  stopLossUSD: number;
};

/**
 * Calcule la taille de position optimale basée sur le risque
 *
 * Formule:
 * - Risk Amount = Account Size * (Risk % / 100)
 * - Risk Distance = abs(Entry - Invalidation) / Entry
 * - Position Size = Risk Amount / Risk Distance
 *
 * @example
 * ```ts
 * const result = calculatePositionSize({
 *   accountSize: 10000,
 *   riskPercentage: 2,
 *   entryPrice: 50000,
 *   invalidationPrice: 48000,
 *   bias: "LONG"
 * });
 *
 * // Result:
 * // riskAmount: 200 (2% of 10000)
 * // riskPercentageDistance: 4% (2000/50000)
 * // positionSizeUSD: 5000
 * // positionSizeUnits: 0.1 BTC
 * ```
 */
export function calculatePositionSize(
  options: PositionSizeOptions,
): PositionSizeResult {
  const {
    accountSize,
    riskPercentage,
    entryPrice,
    invalidationPrice,
    bias,
    leverage = 1,
  } = options;

  // Validation
  if (accountSize <= 0) {
    throw new Error("Account size must be positive");
  }

  if (riskPercentage <= 0 || riskPercentage > 100) {
    throw new Error("Risk percentage must be between 0 and 100");
  }

  if (entryPrice <= 0) {
    throw new Error("Entry price must be positive");
  }

  if (invalidationPrice <= 0) {
    throw new Error("Invalidation price must be positive");
  }

  if (leverage < 1) {
    throw new Error("Leverage must be at least 1");
  }

  // Validation cohérence direction
  if (bias === "LONG" && invalidationPrice >= entryPrice) {
    throw new Error("For LONG trades, invalidation must be below entry price");
  }

  if (bias === "SHORT" && invalidationPrice <= entryPrice) {
    throw new Error("For SHORT trades, invalidation must be above entry price");
  }

  // Calcul montant à risquer
  const riskAmount = accountSize * (riskPercentage / 100);

  // Calcul distance de risque (en %)
  const riskDistanceAbsolute = Math.abs(entryPrice - invalidationPrice);
  const riskPercentageDistance = (riskDistanceAbsolute / entryPrice) * 100;

  // Calcul taille de position en USD
  // Position Size = Risk Amount / (Risk Distance %)
  const positionSizeUSD = riskAmount / (riskPercentageDistance / 100);

  // Calcul taille de position en unités (quantité)
  const positionSizeUnits = positionSizeUSD / entryPrice;

  // Calcul collatéral requis si levier utilisé
  const collateralRequired = positionSizeUSD / leverage;

  // Stop loss en USD
  const stopLossUSD = riskAmount;

  return {
    riskAmount,
    riskPercentageDistance,
    positionSizeUSD,
    positionSizeUnits,
    collateralRequired,
    stopLossUSD,
  };
}

/**
 * Suggestion de levier selon la liquidité et le risque
 */
export type LeverageSuggestion = {
  /** Levier recommandé minimum */
  minLeverage: number;

  /** Levier recommandé maximum */
  maxLeverage: number;

  /** Levier optimal */
  optimalLeverage: number;

  /** Raison de la suggestion */
  reason: string;

  /** Niveau de risque */
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
};

/**
 * Options pour la suggestion de levier
 */
export type LeverageSuggestionOptions = {
  /** Symbol tradé (ex: "BTC-USDT") */
  symbol: string;

  /** Niveau de risque de la carte (1-5) */
  cardRiskLevel: number;

  /** Type d'instrument */
  instrumentType: "SPOT" | "PERP";

  /** Distance de risque en % (entry -> invalidation) */
  riskDistancePercentage: number;
};

/**
 * Suggère un levier approprié selon la liquidité et le risque
 *
 * Règles:
 * - BTC, ETH (haute liquidité): jusqu'à 10-20x possible
 * - Alts majeurs (SOL, AVAX, etc): 5-10x
 * - Alts mineurs: 2-5x max
 * - Risk level élevé -> levier réduit
 * - Distance de risque petite -> levier réduit
 *
 * @example
 * ```ts
 * const suggestion = suggestLeverage({
 *   symbol: "BTC-USDT",
 *   cardRiskLevel: 3,
 *   instrumentType: "PERP",
 *   riskDistancePercentage: 4
 * });
 *
 * // Result:
 * // minLeverage: 1
 * // maxLeverage: 10
 * // optimalLeverage: 5
 * // reason: "Medium risk BTC trade with 4% stop distance"
 * ```
 */
export function suggestLeverage(
  options: LeverageSuggestionOptions,
): LeverageSuggestion {
  const { symbol, cardRiskLevel, instrumentType, riskDistancePercentage } =
    options;

  // SPOT ne permet pas de levier
  if (instrumentType === "SPOT") {
    return {
      minLeverage: 1,
      maxLeverage: 1,
      optimalLeverage: 1,
      reason: "SPOT trading does not support leverage",
      riskLevel: "LOW",
    };
  }

  // Extraction du token principal (ex: BTC-USDT -> BTC)
  const baseToken = symbol.split("-")[0] ?? "UNKNOWN";

  // Catégorisation liquidité
  const highLiquidityTokens = ["BTC", "ETH"];
  const mediumLiquidityTokens = [
    "SOL",
    "BNB",
    "XRP",
    "ADA",
    "AVAX",
    "MATIC",
    "DOT",
    "LINK",
  ];

  let maxLiquidityLeverage = 3; // Default pour low liquidity

  if (highLiquidityTokens.includes(baseToken)) {
    maxLiquidityLeverage = 20;
  } else if (mediumLiquidityTokens.includes(baseToken)) {
    maxLiquidityLeverage = 10;
  }

  // Ajustement selon risk level (1-5)
  // Risk level élevé -> réduire levier max
  const riskMultiplier = 1 - (cardRiskLevel - 1) * 0.15; // 1.0, 0.85, 0.7, 0.55, 0.4
  const adjustedMaxLeverage = Math.max(
    1,
    Math.floor(maxLiquidityLeverage * riskMultiplier),
  );

  // Ajustement selon distance de stop
  // Stop serré (< 2%) -> levier réduit pour éviter liquidations
  let stopDistanceMultiplier = 1.0;

  if (riskDistancePercentage < 2) {
    stopDistanceMultiplier = 0.5; // Réduire de 50%
  } else if (riskDistancePercentage < 4) {
    stopDistanceMultiplier = 0.75; // Réduire de 25%
  }

  const finalMaxLeverage = Math.max(
    1,
    Math.floor(adjustedMaxLeverage * stopDistanceMultiplier),
  );

  // Levier optimal = 50% du max (conservateur)
  const optimalLeverage = Math.max(1, Math.floor(finalMaxLeverage * 0.5));

  // Détermination risk level global
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME" = "MEDIUM";

  if (cardRiskLevel >= 4 || riskDistancePercentage < 2) {
    riskLevel = "HIGH";
  } else if (cardRiskLevel >= 5 || optimalLeverage > 10) {
    riskLevel = "EXTREME";
  } else if (cardRiskLevel <= 2 && optimalLeverage <= 3) {
    riskLevel = "LOW";
  }

  // Génération de la raison
  const liquidityCategory = highLiquidityTokens.includes(baseToken)
    ? "high liquidity"
    : mediumLiquidityTokens.includes(baseToken)
      ? "medium liquidity"
      : "low liquidity";

  const riskCategory =
    cardRiskLevel <= 2
      ? "low risk"
      : cardRiskLevel >= 4
        ? "high risk"
        : "medium risk";

  const reason = `${riskCategory} ${baseToken} trade (${liquidityCategory}) with ${riskDistancePercentage.toFixed(1)}% stop distance`;

  return {
    minLeverage: 1,
    maxLeverage: finalMaxLeverage,
    optimalLeverage,
    reason,
    riskLevel,
  };
}

/**
 * Valide une carte de trading et calcule les métriques de risque
 */
export type TradingCardValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    /** Ratio risk/reward */
    riskRewardRatio: number;
    /** Pourcentage de risque (entry -> invalidation) */
    riskPercentage: number;
    /** Pourcentage moyen des TPs */
    averageTPPercentage: number;
    /** Distance du TP le plus proche */
    nearestTPPercentage: number;
  };
};

/**
 * Valide une carte de trading et calcule les métriques
 *
 * Vérifie la cohérence:
 * - LONGs: invalidation < entry < TPs
 * - SHORTs: invalidation > entry > TPs
 * - Risk/reward ratio acceptable (>= 1.5 recommandé)
 */
export function validateTradingCard(
  payload: TradingCardPayloadType,
): TradingCardValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { bias, entry, invalidation, tps } = payload;

  // Validation cohérence LONG
  if (bias === "LONG") {
    if (invalidation >= entry) {
      errors.push(
        `LONG trade: invalidation (${invalidation}) must be below entry (${entry})`,
      );
    }

    for (const [index, tp] of tps.entries()) {
      if (tp <= entry) {
        errors.push(
          `LONG trade: TP${index + 1} (${tp}) must be above entry (${entry})`,
        );
      }
    }
  }

  // Validation cohérence SHORT
  if (bias === "SHORT") {
    if (invalidation <= entry) {
      errors.push(
        `SHORT trade: invalidation (${invalidation}) must be above entry (${entry})`,
      );
    }

    for (const [index, tp] of tps.entries()) {
      if (tp >= entry) {
        errors.push(
          `SHORT trade: TP${index + 1} (${tp}) must be below entry (${entry})`,
        );
      }
    }
  }

  // Calcul métriques
  const riskDistance = Math.abs(entry - invalidation);
  const riskPercentage = (riskDistance / entry) * 100;

  const rewardDistances = tps.map((tp) => Math.abs(tp - entry));
  const averageReward =
    rewardDistances.reduce((sum, r) => sum + r, 0) / rewardDistances.length;
  const averageTPPercentage = (averageReward / entry) * 100;

  const nearestTP = bias === "LONG" ? Math.min(...tps) : Math.max(...tps);
  const nearestReward = Math.abs(nearestTP - entry);
  const nearestTPPercentage = (nearestReward / entry) * 100;

  const riskRewardRatio = averageReward / riskDistance;

  // Warnings
  if (riskRewardRatio < 1.5) {
    warnings.push(
      `Low risk/reward ratio: ${riskRewardRatio.toFixed(2)} (recommended >= 1.5)`,
    );
  }

  if (riskPercentage > 10) {
    warnings.push(
      `High risk distance: ${riskPercentage.toFixed(1)}% (stop very far from entry)`,
    );
  }

  if (riskPercentage < 1) {
    warnings.push(
      `Very tight stop: ${riskPercentage.toFixed(2)}% (risk of premature stop-out)`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      riskRewardRatio,
      riskPercentage,
      averageTPPercentage,
      nearestTPPercentage,
    },
  };
}
