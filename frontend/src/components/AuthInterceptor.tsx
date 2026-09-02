"use client";

import { useEffect } from "react";

export function AuthInterceptor() {
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).__AUDIRA_FETCH_HOOKED__) {
      (window as any).__AUDIRA_FETCH_HOOKED__ = true;
      const originalFetch = window.fetch;
      window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
        try {
          const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
          if (url && (url.includes("/api/v1") || url.includes(":8005"))) {
            const token = localStorage.getItem("audira_token");
            if (token) {
              init = init || {};
              const headers = new Headers(init.headers || {});
              if (!headers.has("Authorization")) {
                headers.set("Authorization", `Bearer ${token}`);
              }
              init.headers = headers;
            }
          }
        } catch (e) {
          // Pass through on error
        }
        return originalFetch.call(this, input, init);
      };
    }
  }, []);

  return null;
}
