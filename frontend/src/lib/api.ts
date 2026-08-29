export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname || "localhost";
    // If origin is port 3005 or port 80, backend port is 8005
    return `http://${host}:8005/api/v1`;
  }
  return "http://localhost:8005/api/v1";
}
