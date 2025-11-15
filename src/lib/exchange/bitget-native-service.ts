import { RestClientV2, RestClientV3 } from "bitget-api";
import type {
  FillV3,
  OrderInfoV3,
  SpotOrderInfoV2,
  FuturesHistoryOrderV2,
  FuturesPositionV2,
} from "bitget-api";
import { logger } from "@/lib/logger";
import type {
  ExchangeAdapter,
  PaginationOptions,
  FetchTradesResult,
} from "./exchange-service-factory";
import type {
  ConsolidatedBalance,
  PositionSnapshot,
  ConnectionStatus,
  RateLimitInfo,
  CreateOrderParams,
  OrderResult,
  CancelOrderParams,
  OrderStatus,
  NormalizedTrade,
  InstrumentType,
} from "./types";

/**
 * Bitget's SDK declares many response fields as required even though
 * the API routinely omits them. We keep defensive nullish checks to
 * avoid runtime crashes and silence the corresponding lint warnings.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/no-explicit-any */

type BitgetAccountMode = "UTA" | "CLASSIC";

type BitgetCategory =
  | "SPOT"
  | "MARGIN"
  | "USDT-FUTURES"
  | "COIN-FUTURES"
  | "USDC-FUTURES";

type BitgetFuturesCategory = Extract<
  BitgetCategory,
  "USDT-FUTURES" | "COIN-FUTURES" | "USDC-FUTURES"
>;

const SUPPORTED_FUTURES_CATEGORIES: BitgetFuturesCategory[] = [
  "USDT-FUTURES",
  "COIN-FUTURES",
];

const ORDER_STATUS_MAP: Record<string, OrderStatus["status"]> = {
  new: "NEW",
  init: "NEW",
  live: "NEW",
  partially_filled: "PARTIALLY_FILLED",
  partial_filled: "PARTIALLY_FILLED",
  filled: "FILLED",
  cancelled: "CANCELED",
  canceled: "CANCELED",
  rejected: "REJECTED",
};

const ORDER_TYPE_MAP: Record<string, NormalizedTrade["type"]> = {
  market: "MARKET",
  limit: "LIMIT",
};

const CLASSIC_STATUS_FILLED = new Set([
  "filled",
  "full_fill",
  "partial_fill",
  "success",
]);

const CLASSIC_MODE_ERROR_CODES = new Set(["40084"]);

export class BitgetNativeService implements ExchangeAdapter {
  private readonly restClientV3: RestClientV3 | null;
  private readonly restClientV2: RestClientV2;
  private readonly passphrase: string;
  private mode: BitgetAccountMode | null;

  constructor(
    apiKey: string,
    secretKey: string,
    passphrase?: string | null,
    options?: {
      demoTrading?: boolean;
      accountMode?: BitgetAccountMode | null;
    },
  ) {
    if (!passphrase) {
      throw new Error("Bitget API passphrase is required");
    }

    this.passphrase = passphrase;
    this.mode = options?.accountMode ?? null;

    logger.info("Initializing Bitget Native Service", {
      demoTrading: options?.demoTrading ?? false,
      mode: this.mode,
    });

    this.restClientV3 = new RestClientV3({
      apiKey,
      apiSecret: secretKey,
      apiPass: passphrase,
      demoTrading: options?.demoTrading ?? false,
    });

    this.restClientV2 = new RestClientV2({
      apiKey,
      apiSecret: secretKey,
      apiPass: passphrase,
      demoTrading: options?.demoTrading ?? false,
    });
  }

  async fetchConsolidatedBalance(): Promise<ConsolidatedBalance> {
    const mode = await this.ensureAccountMode();
    return mode === "UTA" ? this.fetchUtaBalance() : this.fetchClassicBalance();
  }

  async fetchOpenPositions(): Promise<PositionSnapshot[]> {
    const mode = await this.ensureAccountMode();
    return mode === "UTA"
      ? this.fetchUtaPositions()
      : this.fetchClassicPositions();
  }

  async fetchTradesPaginated(
    symbol: string,
    options?: PaginationOptions,
  ): Promise<FetchTradesResult> {
    const mode = await this.ensureAccountMode();
    return mode === "UTA"
      ? this.fetchUtaTradesPaginated(symbol, options)
      : this.fetchClassicTradesPaginated(symbol, options);
  }

  async fetchRecentTrades(
    daysSince = 30,
    sinceDate?: Date,
  ): Promise<
    {
      externalOrderId: string;
      symbol: string;
      side: "BUY" | "SELL";
      type: NormalizedTrade["type"];
      quantity: number;
      price: number;
      quoteQuantity: number;
      fee: number;
      feeAsset: string;
      realizedPnl: number | null;
      executedAt: Date;
    }[]
  > {
    const mode = await this.ensureAccountMode();
    return mode === "UTA"
      ? this.fetchUtaRecentTrades(daysSince, sinceDate)
      : this.fetchClassicRecentTrades(daysSince, sinceDate);
  }

  async testConnection(): Promise<ConnectionStatus> {
    logger.info("Testing Bitget connection");

    try {
      const mode = await this.ensureAccountMode();

      if (mode === "UTA") {
        const client = this.getV3Client();
        const [balances, settings] = await Promise.all([
          client.getBalances(),
          client.getAccountSettings(),
        ]);

        return {
          isValid: true,
          isReadOnly: true,
          hasSpotEnabled: (balances.data.assets ?? []).length > 0,
          hasFuturesEnabled:
            Boolean(settings.data?.symbolConfigList?.length) ||
            Boolean(settings.data?.coinConfigList?.length),
          canTrade: false,
          bitgetAccountMode: "UTA",
        };
      }

      const fundingAssets = await this.restClientV2.getFundingAssets();
      let hasFutures = false;

      try {
        const futuresAccounts = await this.restClientV2.getFuturesAccountAssets(
          {
            productType: "USDT-FUTURES",
          },
        );
        hasFutures = (futuresAccounts.data ?? []).length > 0;
      } catch (error) {
        logger.debug("Bitget classic futures check failed", { error });
      }

      return {
        isValid: true,
        isReadOnly: true,
        hasSpotEnabled: (fundingAssets.data ?? []).length > 0,
        hasFuturesEnabled: hasFutures,
        canTrade: false,
        bitgetAccountMode: "CLASSIC",
      };
    } catch (error) {
      logger.error("Bitget connection test failed", { error });
      throw error;
    }
  }

  getRateLimitInfo(): RateLimitInfo | null {
    return null;
  }

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const mode = await this.ensureAccountMode();
    if (mode === "CLASSIC") {
      throw new Error(
        "Automatic trading is not supported for Bitget Classic accounts.",
      );
    }

    if (!["MARKET", "LIMIT"].includes(params.type)) {
      throw new Error(`Unsupported Bitget order type: ${params.type}`);
    }

    logger.info("Creating Bitget order", {
      symbol: params.symbol,
      side: params.side,
      type: params.type,
    });

    const client = this.getV3Client();
    const category = this.mapCategory(params.instrumentType);

    const response = await client.submitNewOrder({
      category,
      symbol: params.symbol,
      qty: params.quantity.toString(),
      price: params.price ? params.price.toString() : undefined,
      side: params.side.toLowerCase() as "buy" | "sell",
      orderType: params.type === "LIMIT" ? "limit" : "market",
      timeInForce: params.timeInForce
        ? (params.timeInForce.toLowerCase() as "gtc" | "ioc" | "fok")
        : undefined,
      clientOid: params.clientOrderId,
      posSide:
        params.positionSide?.toLowerCase() === "short"
          ? "short"
          : params.positionSide?.toLowerCase() === "long"
            ? "long"
            : undefined,
      reduceOnly: params.reduceOnly ? "yes" : "no",
    });

    const orderId = response.data.orderId;
    const orderInfoResponse = await client.getOrderInfo({ orderId });
    return this.mapOrderInfoToResult(orderInfoResponse.data);
  }

  async cancelOrder(params: CancelOrderParams): Promise<void> {
    const mode = await this.ensureAccountMode();
    if (mode === "CLASSIC") {
      throw new Error(
        "Automatic trading is not supported for Bitget Classic accounts.",
      );
    }

    if (!params.orderId && !params.clientOrderId) {
      throw new Error("Bitget cancel requires orderId or clientOrderId");
    }

    const client = this.getV3Client();
    await client.cancelOrder({
      orderId: params.orderId,
      clientOid: params.clientOrderId,
    });
  }

  async getOrderStatus(params: CancelOrderParams): Promise<OrderStatus> {
    const mode = await this.ensureAccountMode();
    if (mode === "CLASSIC") {
      throw new Error(
        "Automatic trading is not supported for Bitget Classic accounts.",
      );
    }

    if (!params.orderId && !params.clientOrderId) {
      throw new Error("Bitget order status requires orderId or clientOrderId");
    }

    const client = this.getV3Client();
    const orderInfo = await client.getOrderInfo({
      orderId: params.orderId,
      clientOid: params.clientOrderId,
    });

    const data = orderInfo.data;
    return {
      orderId: data.orderId,
      status: this.mapOrderStatus(data.orderStatus),
      executedQty: Number(data.cumExecQty ?? 0),
      price: Number(data.price ?? data.avgPrice ?? 0),
      stopPrice: null,
      updatedAt: new Date(Number(data.updatedTime ?? Date.now())),
      raw: data,
    };
  }

  async close(): Promise<void> {
    logger.debug("Closing Bitget Native Service (no-op)");
  }

  private async fetchUtaBalance(): Promise<ConsolidatedBalance> {
    logger.info("Fetching consolidated balance (Bitget UTA mode)");

    const client = this.getV3Client();
    const response = await client.getBalances();
    const account = response.data;
    const assets = account.assets ?? [];
    const timestamp = new Date();

    const spotAssets: Record<
      string,
      {
        asset: string;
        free: number;
        locked: number;
        total: number;
        usdValue?: number;
      }
    > = {};

    let spotTotalUsd = 0;

    for (const asset of assets) {
      const free = Number(asset.available ?? "0");
      const locked = Number(asset.locked ?? "0");
      const total = Number(asset.balance ?? asset.equity ?? 0) || free + locked;
      const usdValue = Number(asset.usdValue ?? asset.equity ?? 0);

      spotAssets[asset.coin] = {
        asset: asset.coin,
        free,
        locked,
        total,
        usdValue,
      };

      spotTotalUsd += usdValue;
    }

    const totalEquityUsd = Number(account.accountEquity ?? 0);
    const marginUsed = Number(account.imr ?? 0);
    const marginAvailable = Math.max(totalEquityUsd - marginUsed, 0);
    const unrealizedPnl = Number(account.unrealisedPnl ?? 0);

    return {
      timestamp,
      spot: {
        totalUsd: spotTotalUsd,
        assets: spotAssets,
        raw: account,
      },
      futures: {
        totalUsd: Number(account.usdtEquity ?? 0),
        assets: {},
        marginUsed,
        marginAvailable,
        unrealizedPnl,
        leverage: null,
        raw: account,
      },
      margin: undefined,
      totalEquityUsd,
    };
  }

  private async fetchClassicBalance(): Promise<ConsolidatedBalance> {
    logger.info("Fetching consolidated balance (Bitget classic mode)");

    const timestamp = new Date();
    const fundingAssets = await this.restClientV2.getFundingAssets();
    const futuresAccounts = await this.restClientV2.getFuturesAccountAssets({
      productType: "USDT-FUTURES",
    });

    const spotAssets: Record<
      string,
      {
        asset: string;
        free: number;
        locked: number;
        total: number;
        usdValue?: number;
      }
    > = {};
    let spotTotalUsd = 0;

    for (const asset of fundingAssets.data ?? []) {
      const free = Number(asset.available ?? 0);
      const locked = Number(asset.frozen ?? 0);
      const total = free + locked;
      const usdValue = Number(asset.usdtValue ?? 0);

      spotAssets[asset.coin] = {
        asset: asset.coin,
        free,
        locked,
        total,
        usdValue,
      };

      spotTotalUsd += usdValue;
    }

    const futuresInfo = (futuresAccounts.data ?? [])[0];
    let futuresSection: ConsolidatedBalance["futures"];

    if (futuresInfo) {
      const totalUsd = Number(
        futuresInfo.accountEquity ?? futuresInfo.usdtEquity ?? 0,
      );
      const marginAvailable = Number(futuresInfo.available ?? 0);
      futuresSection = {
        totalUsd,
        assets: {},
        marginUsed: Math.max(totalUsd - marginAvailable, 0),
        marginAvailable,
        unrealizedPnl: Number(futuresInfo.unrealizedPL ?? 0),
        leverage: null,
        raw: futuresInfo,
      };
    }

    // Fetch margin accounts (cross + isolated)
    let marginSection: ConsolidatedBalance["margin"];
    try {
      const [crossMarginAssets, isolatedMarginAssets] = await Promise.all([
        this.restClientV2
          .getMarginAccountAssets("crossed")
          .catch(() => ({ code: "00000", data: [] })),
        this.restClientV2
          .getMarginAccountAssets("isolated")
          .catch(() => ({ code: "00000", data: [] })),
      ]);

      const marginAssets: Record<
        string,
        {
          asset: string;
          free: number;
          locked: number;
          total: number;
          usdValue?: number;
        }
      > = {};
      let marginTotalUsd = 0;
      let totalBorrowed = 0;
      let totalInterest = 0;

      // Process cross margin assets
      for (const asset of crossMarginAssets.data ?? []) {
        const available = Number(asset.available ?? 0);
        const frozen = Number(asset.frozen ?? 0);
        const borrowed = Number(asset.borrow ?? 0);
        const interest = Number(asset.interest ?? 0);
        const net = Number(asset.net ?? 0);

        // Use USDT value approximation if available
        const usdValue = net; // 'net' is already in USD-equivalent for margin

        const key = `${asset.coin}_CROSS`;
        marginAssets[key] = {
          asset: asset.coin,
          free: available,
          locked: frozen,
          total: available + frozen,
          usdValue,
        };

        marginTotalUsd += usdValue;
        totalBorrowed += borrowed;
        totalInterest += interest;
      }

      // Process isolated margin assets
      for (const asset of isolatedMarginAssets.data ?? []) {
        const available = Number(asset.available ?? 0);
        const frozen = Number(asset.frozen ?? 0);
        const borrowed = Number(asset.borrow ?? 0);
        const interest = Number(asset.interest ?? 0);
        const net = Number(asset.net ?? 0);

        const usdValue = net;

        const key = `${asset.symbol}_${asset.coin}`;
        marginAssets[key] = {
          asset: `${asset.coin} (${asset.symbol})`,
          free: available,
          locked: frozen,
          total: available + frozen,
          usdValue,
        };

        marginTotalUsd += usdValue;
        totalBorrowed += borrowed;
        totalInterest += interest;
      }

      if (Object.keys(marginAssets).length > 0) {
        marginSection = {
          totalUsd: marginTotalUsd,
          borrowed: totalBorrowed,
          interest: totalInterest,
          assets: marginAssets,
        };

        logger.info("Fetched margin balance", {
          totalUsd: marginTotalUsd,
          assetCount: Object.keys(marginAssets).length,
          crossAssets: (crossMarginAssets.data ?? []).length,
          isolatedAssets: (isolatedMarginAssets.data ?? []).length,
        });
      }
    } catch (error) {
      logger.warn("Failed to fetch margin balance", { error });
      // Don't fail the entire balance fetch if margin fails
    }

    return {
      timestamp,
      spot: {
        totalUsd: spotTotalUsd,
        assets: spotAssets,
        raw: fundingAssets.data,
      },
      futures: futuresSection,
      margin: marginSection,
      totalEquityUsd:
        spotTotalUsd +
        (futuresSection?.totalUsd ?? 0) +
        (marginSection?.totalUsd ?? 0),
    };
  }

  private async fetchUtaPositions(): Promise<PositionSnapshot[]> {
    logger.info("Fetching open positions (Bitget UTA)");
    const client = this.getV3Client();
    const positions: PositionSnapshot[] = [];

    for (const category of SUPPORTED_FUTURES_CATEGORIES) {
      // Parallel calls yield marginal benefit and complicate error handling;
      // there are only two categories to fetch, so sequential awaits are fine.
      // eslint-disable-next-line no-await-in-loop
      const response = await client.getCurrentPosition({ category });
      const list = response.data.list ?? [];

      for (const position of list) {
        const quantity = Number(position.total ?? position.positionBalance);
        if (!quantity) {
          continue;
        }

        positions.push({
          symbol: position.symbol,
          side: position.posSide?.toUpperCase() === "SHORT" ? "SHORT" : "LONG",
          quantity: Math.abs(quantity),
          entryPrice: Number(position.avgPrice ?? 0),
          markPrice: Number(position.markPrice ?? position.avgPrice ?? 0),
          leverage: position.leverage ? Number(position.leverage) : null,
          margin: Number(position.positionBalance ?? position.available ?? 0),
          unrealizedPnl: Number(
            position.unrealisedPnl ?? position.curRealisedPnl ?? 0,
          ),
          liquidationPrice: position.liquidationPrice
            ? Number(position.liquidationPrice)
            : null,
          type: category === "USDT-FUTURES" ? "FUTURES_USDT" : "FUTURES_COIN",
          openedAt: new Date(Number(position.createdTime ?? Date.now())),
          lastUpdatedAt: new Date(Number(position.updatedTime ?? Date.now())),
          metadata: position as unknown as Record<string, unknown>,
          raw: position,
        });
      }
    }

    return positions;
  }

  private async fetchClassicPositions(): Promise<PositionSnapshot[]> {
    logger.info("Fetching open positions (Bitget classic)");

    try {
      const response = await this.restClientV2.getFuturesPositions({
        productType: "USDT-FUTURES",
      });

      return (response.data ?? []).map((position: FuturesPositionV2) => ({
        symbol: position.symbol,
        side: position.holdSide?.toUpperCase() === "SHORT" ? "SHORT" : "LONG",
        quantity: Number(position.total ?? position.available ?? 0),
        entryPrice: Number(position.openPriceAvg ?? 0),
        markPrice: Number(position.markPrice ?? position.openPriceAvg ?? 0),
        leverage: position.leverage ? Number(position.leverage) : null,
        margin: Number(position.marginSize ?? 0),
        unrealizedPnl: Number(position.unrealizedPL ?? 0),
        liquidationPrice: position.liquidationPrice
          ? Number(position.liquidationPrice)
          : null,
        type: "FUTURES_USDT",
        openedAt: new Date(Number(position.cTime ?? Date.now())),
        lastUpdatedAt: new Date(Number(position.uTime ?? Date.now())),
        metadata: position as unknown as Record<string, unknown>,
        raw: position,
      }));
    } catch (error) {
      logger.warn("Failed to fetch Bitget classic positions", { error });
      return [];
    }
  }

  private async fetchUtaTradesPaginated(
    symbol: string,
    options?: PaginationOptions,
  ): Promise<FetchTradesResult> {
    logger.info("Fetching trades paginated (Bitget UTA)", {
      symbol,
      limit: options?.limit,
    });

    const client = this.getV3Client();
    const limit = options?.limit ?? 500;
    const params: { symbol?: string; cursor?: string; limit?: string } = {
      limit: String(limit),
    };

    if (symbol) {
      params.symbol = symbol;
    }

    if (options?.cursor?.nextId) {
      params.cursor = options.cursor.nextId;
    }

    const response = await client.getTradeFills(params);
    const fills = response.data.list ?? [];
    const normalized = fills
      .map((fill) => this.normalizeFill(fill))
      .filter((trade): trade is NormalizedTrade => Boolean(trade))
      .filter((trade) => !symbol || trade.symbol === symbol);

    const cursor = {
      nextId: response.data.cursor ?? null,
      nextTimestamp:
        normalized.length > 0
          ? normalized[normalized.length - 1].executedAt.getTime()
          : null,
      hasMore: Boolean(response.data.cursor),
    };

    return { trades: normalized, cursor };
  }

  private async fetchClassicTradesPaginated(
    symbol: string,
    options?: PaginationOptions,
  ): Promise<FetchTradesResult> {
    logger.info("Fetching trades paginated (Bitget classic)", {
      symbol,
      limit: options?.limit,
    });

    const trades = await this.fetchClassicRecentTradesInternal({
      startTime: options?.since ?? null,
      limit: options?.limit ?? 200,
      symbol,
    });

    return {
      trades: trades.map((trade) => this.mapClassicTradeToNormalized(trade)),
      cursor: {
        nextId: null,
        nextTimestamp:
          trades.length > 0
            ? trades[trades.length - 1].executedAt.getTime()
            : null,
        hasMore: false,
      },
    };
  }

  private async fetchUtaRecentTrades(
    daysSince = 30,
    sinceDate?: Date,
  ): Promise<
    {
      externalOrderId: string;
      symbol: string;
      side: "BUY" | "SELL";
      type: NormalizedTrade["type"];
      quantity: number;
      price: number;
      quoteQuantity: number;
      fee: number;
      feeAsset: string;
      realizedPnl: number | null;
      executedAt: Date;
    }[]
  > {
    logger.info("Fetching Bitget recent trades (UTA)", {
      daysSince,
      sinceDate: sinceDate?.toISOString(),
    });

    const client = this.getV3Client();
    const since =
      sinceDate ?? new Date(Date.now() - daysSince * 24 * 60 * 60 * 1000);
    const params = {
      startTime: String(since.getTime()),
      limit: "200",
    };

    const response = await client.getTradeFills(params);
    const fills = response.data.list ?? [];

    const trades = fills
      .map((fill) => this.normalizeFill(fill))
      .filter((trade): trade is NormalizedTrade => Boolean(trade))
      .map((trade) => ({
        externalOrderId: trade.orderId,
        symbol: trade.symbol,
        side: trade.side,
        type: trade.type,
        quantity: trade.quantity,
        price: trade.price,
        quoteQuantity: trade.quoteQuantity,
        fee: trade.fee,
        feeAsset: trade.feeCurrency,
        realizedPnl: trade.realizedPnl,
        executedAt: trade.executedAt,
      }));

    trades.sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());

    return trades;
  }

  private async fetchClassicRecentTrades(
    daysSince = 30,
    sinceDate?: Date,
  ): Promise<
    {
      externalOrderId: string;
      symbol: string;
      side: "BUY" | "SELL";
      type: NormalizedTrade["type"];
      quantity: number;
      price: number;
      quoteQuantity: number;
      fee: number;
      feeAsset: string;
      realizedPnl: number | null;
      executedAt: Date;
    }[]
  > {
    logger.info("Fetching Bitget recent trades (Classic)", {
      daysSince,
      sinceDate: sinceDate?.toISOString(),
    });

    const startTime =
      sinceDate?.getTime() ?? Date.now() - daysSince * 24 * 60 * 60 * 1000;

    const trades = await this.fetchClassicRecentTradesInternal({
      startTime,
      limit: 500,
    });

    return trades.map((trade) => ({
      externalOrderId: trade.orderId,
      symbol: trade.symbol,
      side: trade.side,
      type: trade.type,
      quantity: trade.quantity,
      price: trade.price,
      quoteQuantity: trade.quoteQuantity,
      fee: trade.fee,
      feeAsset: trade.feeCurrency,
      realizedPnl: trade.realizedPnl,
      executedAt: trade.executedAt,
    }));
  }

  private async fetchClassicRecentTradesInternal(options: {
    startTime: number | null;
    limit: number;
    symbol?: string;
  }): Promise<
    {
      orderId: string;
      symbol: string;
      side: "BUY" | "SELL";
      type: NormalizedTrade["type"];
      quantity: number;
      price: number;
      quoteQuantity: number;
      fee: number;
      feeCurrency: string;
      realizedPnl: number | null;
      executedAt: Date;
    }[]
  > {
    const startTimeStr = options.startTime
      ? String(options.startTime)
      : undefined;

    // Build margin request params - using any to work around SDK type limitations
    const marginParams: any = {
      limit: String(options.limit),
    };
    if (options.symbol) {
      marginParams.symbol = options.symbol;
    }
    if (startTimeStr) {
      marginParams.startTime = startTimeStr;
    }

    const [spotOrders, futuresOrders, crossMarginOrders, isolatedMarginOrders] =
      await Promise.all([
        this.restClientV2.getSpotHistoricOrders({
          symbol: options.symbol,
          startTime: startTimeStr,
          limit: String(options.limit),
        }),
        this.restClientV2.getFuturesHistoricOrders({
          productType: "USDT-FUTURES",
          symbol: options.symbol,
          startTime: startTimeStr,
          limit: String(options.limit),
        }),
        this.restClientV2
          .getMarginHistoricOrders("crossed", marginParams)
          .catch(() => ({ code: "00000", data: { orderList: [] } })),
        this.restClientV2
          .getMarginHistoricOrders("isolated", marginParams)
          .catch(() => ({ code: "00000", data: { orderList: [] } })),
      ]);

    const spotTrades = (spotOrders.data ?? [])
      .map((order: SpotOrderInfoV2) => this.mapClassicSpotOrderToTrade(order))
      .filter((trade) => trade !== null);

    const futuresTrades = (futuresOrders.data?.entrustedList ?? [])
      .map((order: FuturesHistoryOrderV2) =>
        this.mapClassicFuturesOrderToTrade(order),
      )
      .filter((trade) => trade !== null);

    const crossMarginTrades = (crossMarginOrders.data?.orderList ?? [])
      .map((order) => this.mapClassicMarginOrderToTrade(order))
      .filter((trade) => trade !== null);

    const isolatedMarginTrades = (isolatedMarginOrders.data?.orderList ?? [])
      .map((order) => this.mapClassicMarginOrderToTrade(order))
      .filter((trade) => trade !== null);

    const allTrades = [
      ...spotTrades,
      ...futuresTrades,
      ...crossMarginTrades,
      ...isolatedMarginTrades,
    ].filter((trade) => trade !== null);

    return allTrades.sort(
      (a, b) => b.executedAt.getTime() - a.executedAt.getTime(),
    );
  }

  private mapClassicTradeToNormalized(trade: {
    orderId: string;
    symbol: string;
    side: "BUY" | "SELL";
    type: NormalizedTrade["type"];
    quantity: number;
    price: number;
    quoteQuantity: number;
    fee: number;
    feeCurrency: string;
    realizedPnl: number | null;
    executedAt: Date;
  }): NormalizedTrade {
    return {
      id: `${trade.orderId}-${trade.executedAt.getTime()}`,
      orderId: trade.orderId,
      symbol: trade.symbol,
      side: trade.side,
      type: trade.type,
      quantity: trade.quantity,
      price: trade.price,
      quoteQuantity: trade.quoteQuantity,
      fee: trade.fee,
      feeCurrency: trade.feeCurrency,
      executedAt: trade.executedAt,
      instrumentType: trade.realizedPnl === null ? "SPOT" : "FUTURES_USDT",
      realizedPnl: trade.realizedPnl,
      positionSide: null,
      raw: trade,
    };
  }

  private mapClassicSpotOrderToTrade(order: SpotOrderInfoV2): {
    orderId: string;
    symbol: string;
    side: "BUY" | "SELL";
    type: NormalizedTrade["type"];
    quantity: number;
    price: number;
    quoteQuantity: number;
    fee: number;
    feeCurrency: string;
    realizedPnl: null;
    executedAt: Date;
  } | null {
    if (!this.isClassicOrderFilled(order.status)) {
      return null;
    }

    const quantity = Number(order.baseVolume ?? order.size ?? 0);
    if (!quantity) {
      return null;
    }

    const price = Number(order.priceAvg ?? order.price ?? 0);
    const quoteQuantity = Number(order.quoteVolume ?? 0) || quantity * price;
    const { fee, currency } = this.extractSpotFee(order.feeDetail);

    return {
      orderId: order.orderId,
      symbol: order.symbol,
      side: this.mapSide(order.side),
      type: this.mapOrderType(order.orderType),
      quantity,
      price,
      quoteQuantity,
      fee,
      feeCurrency: currency,
      realizedPnl: null,
      executedAt: new Date(Number(order.uTime ?? order.cTime ?? Date.now())),
    };
  }

  private mapClassicFuturesOrderToTrade(order: FuturesHistoryOrderV2): {
    orderId: string;
    symbol: string;
    side: "BUY" | "SELL";
    type: NormalizedTrade["type"];
    quantity: number;
    price: number;
    quoteQuantity: number;
    fee: number;
    feeCurrency: string;
    realizedPnl: number;
    executedAt: Date;
  } | null {
    if (!this.isClassicOrderFilled(order.status)) {
      return null;
    }

    const quantity = Number(order.baseVolume ?? order.size ?? 0);
    if (!quantity) {
      return null;
    }

    const price = Number(order.priceAvg ?? order.price ?? 0);
    const quoteQuantity = Number(order.quoteVolume ?? 0) || quantity * price;

    return {
      orderId: order.orderId,
      symbol: order.symbol,
      side: this.mapSide(order.side),
      type: this.mapOrderType(order.orderType),
      quantity,
      price,
      quoteQuantity,
      fee: Number(order.fee ?? 0),
      feeCurrency: order.marginCoin ?? "USDT",
      realizedPnl: Number(order.totalProfits ?? 0),
      executedAt: new Date(Number(order.uTime ?? order.cTime ?? Date.now())),
    };
  }

  private mapClassicMarginOrderToTrade(order: any): {
    orderId: string;
    symbol: string;
    side: "BUY" | "SELL";
    type: NormalizedTrade["type"];
    quantity: number;
    price: number;
    quoteQuantity: number;
    fee: number;
    feeCurrency: string;
    realizedPnl: number | null;
    executedAt: Date;
  } | null {
    if (!this.isClassicOrderFilled(order.status)) {
      return null;
    }

    const quantity = Number(order.baseVolume ?? order.size ?? 0);
    if (!quantity) {
      return null;
    }

    const price = Number(order.priceAvg ?? order.price ?? 0);
    const quoteQuantity = Number(order.quoteVolume ?? 0) || quantity * price;

    return {
      orderId: order.orderId,
      symbol: order.symbol,
      side: this.mapSide(order.side),
      type: this.mapOrderType(order.orderType),
      quantity,
      price,
      quoteQuantity,
      fee: Number(order.fee ?? 0),
      feeCurrency: order.feeCoin ?? "USDT",
      realizedPnl: null, // Margin trades don't have PnL in the order
      executedAt: new Date(Number(order.uTime ?? order.cTime ?? Date.now())),
    };
  }

  private normalizeFill(fill: FillV3): NormalizedTrade | null {
    if (!fill.orderId) {
      return null;
    }

    const fee =
      fill.feeDetail?.reduce(
        (sum, feeInfo) => sum + Math.abs(Number(feeInfo.fee ?? 0)),
        0,
      ) ?? 0;

    return {
      id: `${fill.orderId}-${fill.createdTime}`,
      orderId: fill.orderId,
      symbol: fill.symbol,
      side: fill.side?.toUpperCase() === "SELL" ? "SELL" : "BUY",
      type: this.mapOrderType(fill.orderType),
      quantity: Number(fill.execQty ?? 0),
      price: Number(fill.execPrice ?? 0),
      quoteQuantity:
        Number(fill.execValue ?? 0) ||
        Number(fill.execQty ?? 0) * Number(fill.execPrice ?? 0),
      fee,
      feeCurrency:
        fill.feeDetail && fill.feeDetail.length > 0
          ? fill.feeDetail[0].feeCoin
          : "USDT",
      executedAt: new Date(Number(fill.createdTime ?? Date.now())),
      instrumentType: this.mapInstrumentType(fill.category),
      realizedPnl: fill.execPnl ? Number(fill.execPnl) : null,
      positionSide: null,
      raw: fill,
    };
  }

  private mapOrderInfoToResult(order: OrderInfoV3): OrderResult {
    return {
      orderId: order.orderId,
      clientOrderId: order.clientOid ?? null,
      symbol: order.symbol,
      status: this.mapOrderStatus(order.orderStatus),
      executedQty: Number(order.cumExecQty ?? 0),
      executedPrice: Number(order.avgPrice ?? 0),
      cummulativeQuoteQty: Number(order.cumExecValue ?? 0),
      fills: [],
      transactTime: new Date(Number(order.updatedTime ?? Date.now())),
      raw: order,
    };
  }

  private async ensureAccountMode(): Promise<BitgetAccountMode> {
    if (this.mode) {
      return this.mode;
    }

    try {
      const client = this.getV3Client();
      await client.getBalances();
      await client.getAccountSettings();
      this.mode = "UTA";
      return "UTA";
    } catch (error) {
      if (this.isClassicModeError(error)) {
        logger.info("Bitget account detected in classic mode");
        await this.restClientV2.getFundingAssets();
        this.mode = "CLASSIC";
        return "CLASSIC";
      }
      throw error;
    }
  }

  private getV3Client(): RestClientV3 {
    if (!this.restClientV3) {
      throw new Error("Bitget V3 client not initialized");
    }
    return this.restClientV3;
  }

  private isClassicModeError(error: unknown): boolean {
    const code = this.extractErrorCode(error);
    return Boolean(code && CLASSIC_MODE_ERROR_CODES.has(code));
  }

  private extractErrorCode(error: unknown): string | null {
    if (!error || typeof error !== "object") {
      return null;
    }

    // @ts-expect-error - dynamic access
    const bodyCode = error?.body?.code;
    if (typeof bodyCode === "string") {
      return bodyCode;
    }

    // @ts-expect-error - axios errors
    const responseCode = error?.response?.data?.code;
    if (typeof responseCode === "string") {
      return responseCode;
    }

    // @ts-expect-error - fallback to error.code
    const directCode = error?.code;
    return typeof directCode === "string" ? directCode : null;
  }

  private mapInstrumentType(category?: string): InstrumentType {
    const normalized = category?.toLowerCase();
    if (normalized?.includes("margin")) {
      return "MARGIN";
    }
    if (normalized?.includes("coin")) {
      return "FUTURES_COIN";
    }
    if (normalized?.includes("usdt") || normalized?.includes("linear")) {
      return "FUTURES_USDT";
    }
    return "SPOT";
  }

  private mapCategory(instrument: InstrumentType): BitgetCategory {
    switch (instrument) {
      case "MARGIN":
        return "MARGIN";
      case "FUTURES_COIN":
        return "COIN-FUTURES";
      case "FUTURES_USDT":
        return "USDT-FUTURES";
      default:
        return "SPOT";
    }
  }

  private mapOrderStatus(status: string): OrderStatus["status"] {
    const normalized = status?.toLowerCase() ?? "new";
    return ORDER_STATUS_MAP[normalized] ?? "NEW";
  }

  private mapOrderType(orderType?: string): NormalizedTrade["type"] {
    const normalized = orderType?.toLowerCase() ?? "";
    return ORDER_TYPE_MAP[normalized] ?? "MARKET";
  }

  private mapSide(value?: string): "BUY" | "SELL" {
    const normalized = value?.toLowerCase() ?? "";
    if (
      normalized.includes("sell") ||
      normalized.includes("short") ||
      normalized.includes("close")
    ) {
      return "SELL";
    }
    return "BUY";
  }

  private isClassicOrderFilled(status?: string | null): boolean {
    if (!status) {
      return false;
    }

    const normalized = status.toLowerCase();
    if (CLASSIC_STATUS_FILLED.has(normalized)) {
      return true;
    }

    return normalized.includes("fill") || normalized.includes("filled");
  }

  private extractSpotFee(feeDetail?: SpotOrderInfoV2["feeDetail"]): {
    fee: number;
    currency: string;
  } {
    const newFees = feeDetail?.newFees;
    if (newFees) {
      return {
        fee: Number(newFees.totalDeductionFee ?? 0),
        currency: newFees.r ?? "USDT",
      };
    }

    const bgb = feeDetail?.BGB;
    if (bgb) {
      return {
        fee: Number(bgb.totalFee ?? 0),
        currency: bgb.feeCoinCode ?? "BGB",
      };
    }

    return { fee: 0, currency: "USDT" };
  }
}
