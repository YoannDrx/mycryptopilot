export const getCallbackUrl = (fallbackUrl: string): string => {
  const searchParams = new URLSearchParams(window.location.search);
  const callbackUrlParams = searchParams.get("callbackUrl");

  if (callbackUrlParams) {
    if (callbackUrlParams.startsWith("/")) return callbackUrlParams;
    return `/${callbackUrlParams}`;
  }

  return fallbackUrl;
};
