export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol; // http: or https:
    const host = window.location.hostname || "localhost";
    const port = window.location.port;

    // If running via Cloudflare Tunnel / HTTPS / NGINX reverse proxy (port 80 or 443, or no port)
    if (!port || port === "80" || port === "443") {
      return `${protocol}//${host}/api/v1`;
    }

    // Default LAN or dev port: connect to backend port 8005
    return `${protocol}//${host}:8005/api/v1`;
  }
  return "http://localhost:8005/api/v1";
}

export function getOAuthRedirectUri(callbackPath: string = "/dashboard/accounts/callback"): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${callbackPath}`;
  }
  return `http://localhost:3005${callbackPath}`;
}

export function getWsBaseUrl(): string {
  const apiBase = getApiBaseUrl();
  return apiBase.replace(/^http/, "ws");
}
