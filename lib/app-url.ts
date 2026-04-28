const DEFAULT_APP_BASE_URL = "https://alrahmakuran.site";

export function getAppBaseUrl() {
  return String(process.env.APP_BASE_URL || "").trim().replace(/\/$/, "") || DEFAULT_APP_BASE_URL;
}

export function appUrl(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getAppBaseUrl()}${normalizedPath}`;
}
