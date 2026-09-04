export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol; // http: or https:
    const host = window.location.hostname || "localhost";
    const port = window.location.port;

    // If running inside Tauri desktop app
    if (protocol === "tauri:" || host === "tauri.localhost") {
      return "http://localhost:8005/api/v1";
    }

    // If running via Cloudflare Tunnel / HTTPS / NGINX reverse proxy (port 80 or 443, or no port)
    if (!port || port === "80" || port === "443") {
      return `${protocol}//${host}/api/v1`;
    }

    // Default LAN or dev port: connect to backend port 8005 on current host
    return `${protocol}//${host}:8005/api/v1`;
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
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
  return apiBase.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://");
}

export function getAuthHeaders(customHeaders: HeadersInit = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(typeof customHeaders === "object" && !Array.isArray(customHeaders) && !(customHeaders instanceof Headers)
      ? (customHeaders as Record<string, string>)
      : {}),
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("audira_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const mergedHeaders = getAuthHeaders(options.headers || {});
  return fetch(url, {
    ...options,
    headers: mergedHeaders,
  });
}

export async function fetchWithFallback(endpointPath: string, options: RequestInit = {}): Promise<Response | null> {
  const cleanPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
  const primaryUrl = `${getApiBaseUrl()}${cleanPath}`;
  const mergedHeaders = getAuthHeaders(options.headers || {});
  const reqOptions: RequestInit = {
    ...options,
    headers: mergedHeaders
  };

  // 1. Primary Attempt
  try {
    const res = await fetch(primaryUrl, reqOptions);
    if (res && res.ok) return res;
  } catch (e) {
    // Primary failed
  }

  // 2. Relative Origin Attempt
  if (typeof window !== "undefined") {
    const relativeUrl = `${window.location.origin}/api/v1${cleanPath}`;
    if (relativeUrl !== primaryUrl) {
      try {
        const res = await fetch(relativeUrl, reqOptions);
        if (res && res.ok) return res;
      } catch (e) {
        // Relative failed
      }
    }
  }

  // 3. Direct LAN IP Fallback
  if (typeof window !== "undefined" && window.location.hostname !== "192.168.100.178") {
    const lanUrl = `http://192.168.100.178:8005/api/v1${cleanPath}`;
    if (lanUrl !== primaryUrl) {
      try {
        const res = await fetch(lanUrl, reqOptions);
        if (res && res.ok) return res;
      } catch (e) {
        // LAN failed
      }
    }
  }

  return null;
}
