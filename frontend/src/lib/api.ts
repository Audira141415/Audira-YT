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

  const handleUnauthorized = (res: Response | null) => {
    if (res && res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("audira_token");
      localStorage.removeItem("audira_user");
      localStorage.removeItem("audira_login_time");
      localStorage.removeItem("audira_last_activity");
    }
  };

  const isValidResponse = (res: Response | null) => {
    if (res) handleUnauthorized(res);
    return Boolean(res && res.headers.get("content-type")?.includes("application/json"));
  };

  // 1. Primary Attempt
  try {
    const res = await fetch(primaryUrl, reqOptions);
    if (isValidResponse(res)) return res;
  } catch (e) {
    // Primary failed
  }

  // 2. Relative Origin Attempt
  if (typeof window !== "undefined") {
    const relativeUrl = `${window.location.origin}/api/v1${cleanPath}`;
    if (relativeUrl !== primaryUrl) {
      try {
        const res = await fetch(relativeUrl, reqOptions);
        if (isValidResponse(res)) return res;
      } catch (e) {
        // Relative failed
      }
    }

    // 3. Port 8005 Direct Attempt
    const port8005Url = `${window.location.protocol}//${window.location.hostname}:8005/api/v1${cleanPath}`;
    if (port8005Url !== primaryUrl && port8005Url !== relativeUrl) {
      try {
        const res = await fetch(port8005Url, reqOptions);
        if (isValidResponse(res)) return res;
      } catch (e) {
        // Port 8005 failed
      }
    }
  }

  // 4. Direct LAN IP Fallback
  if (typeof window !== "undefined" && window.location.hostname !== "192.168.100.178") {
    const lanUrl = `http://192.168.100.178:8005/api/v1${cleanPath}`;
    try {
      const res = await fetch(lanUrl, reqOptions);
      if (isValidResponse(res)) return res;
    } catch (e) {
      // LAN failed
    }
  }

  return null;
}

export async function getAIRecommendations(): Promise<any> {
  const res = await fetchWithFallback("/ai/recommendations");
  if (res && res.ok) {
    return res.json();
  }
  return null;
}

export async function getRevenueSummary(): Promise<any> {
  const res = await fetchWithFallback("/revenue/summary");
  if (res && res.ok) {
    return res.json();
  }
  return null;
}
