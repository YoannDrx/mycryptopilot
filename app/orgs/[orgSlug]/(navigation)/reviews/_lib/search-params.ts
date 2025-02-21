import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsStringLiteral,
} from "nuqs/server";

const statusOptions = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;

export const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  status: parseAsStringLiteral(statusOptions).withDefault("ALL").withOptions({
    clearOnDefault: true,
  }),
} as const);
