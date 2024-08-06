import { createSearchParamsCache, parseAsString } from "nuqs/server";

export const signInSearchParamsCache = createSearchParamsCache({
  email: parseAsString,
  callbackUrl: parseAsString,
});
