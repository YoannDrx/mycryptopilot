/* eslint-disable no-console */

type LogMethod = (...args: unknown[]) => void;

const makeLogger = () => {
  const info: LogMethod = (...args) => console.log(...args);
  const warn: LogMethod = (...args) => console.warn(...args);
  const error: LogMethod = (...args) => console.error(...args);
  const debug: LogMethod = (...args) => console.debug(...args);

  return { info, warn, error, debug };
};

export const testLogger = makeLogger();
