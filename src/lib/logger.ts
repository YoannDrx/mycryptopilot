import { Logger } from "tslog";

const minLogLevel = (() => {
  if (process.env.NODE_ENV === "test") {
    // Silence AppLogger during automated tests to keep outputs readable
    return 999;
  }
  return process.env.NODE_ENV === "production" ? 3 : 0;
})();

export const logger = new Logger({
  name: "AppLogger",
  // Don't use `env` here, because we can use the logger in the browser
  minLevel: minLogLevel,
});
