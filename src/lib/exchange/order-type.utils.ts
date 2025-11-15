import type { OrderType } from "@/generated/prisma";
import type { CreateOrderParams, NormalizedTrade } from "./types";

const DEFAULT_ORDER_TYPE: OrderType = "LIMIT";

export function mapNormalizedOrderTypeToPrisma(
  type: NormalizedTrade["type"] | CreateOrderParams["type"],
): OrderType {
  switch (type) {
    case "STOP_LOSS":
      return "STOP_LOSS";
    case "STOP_LOSS_LIMIT":
      return "STOP_LOSS_LIMIT";
    case "MARKET":
    case "LIMIT":
      return type;
    case "STOP":
    case "STOP_MARKET":
    case "TRAILING_STOP":
      return "STOP_LOSS";
    case "STOP_LIMIT":
      return "STOP_LOSS_LIMIT";
    case "TAKE_PROFIT_MARKET":
      return "TAKE_PROFIT";
    case "TAKE_PROFIT_LIMIT":
      return "TAKE_PROFIT_LIMIT";
    case "TAKE_PROFIT":
      return "TAKE_PROFIT";
    default:
      return DEFAULT_ORDER_TYPE;
  }
}
