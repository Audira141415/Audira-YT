export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname || "localhost";
    return `http://${host}:8005/api/v1`;
  }
  return "http://localhost:8005/api/v1";
}

export function getOAuthRedirectUri(callbackPath: string = "/dashboard/accounts/callback"): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // Google OAuth Security Policy forbids IP addresses like 192.168.100.178 as redirect URIs.
    // Fall back to http://localhost:3005 if accessed via private IP, or use current origin if localhost / domain
    if (/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname)) {
      const port = window.location.port ? `:${window.location.port}` : ":3005";
      return `http://localhost${port}${callbackPath}`;
    }
    return `${window.location.origin}${callbackPath}`;
  }
  return `http://localhost:3005${callbackPath}`;
}
