"use client";

import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getOrCreateDeviceId } from "@/lib/deviceId";
import type { RefreshResponse } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const REFRESH_API_V1 = process.env.NEXT_PUBLIC_REFRESH_API_V1 ?? "";

/**
 * Auth-aware fetch: on 401, stays on same page and calls refresh token API.
 * If refresh succeeds, retries the original request with the new token.
 * Only if refresh fails do we logout (layout will redirect to login when user becomes null).
 */
export function useAuthFetch() {
  const {
    accessToken,
    refreshToken,
    setAccessToken,
    setSessionExpired,
  } = useAuth();

  const authFetch = useCallback(
    async (url: string, init: RequestInit = {}): Promise<Response> => {
      const fetchInit = init;
      let retried = false;
      const headers = new Headers(fetchInit.headers);
      if (accessToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }
      const deviceId = getOrCreateDeviceId();
      if (deviceId) headers.set("x-device-id", deviceId);

      const res = await fetch(url, { ...fetchInit, headers });

      if (res.status === 401 && !retried) {
        retried = true;
        const refreshUrl = `${API_BASE_URL}${REFRESH_API_V1}`;
        const refreshHeaders: HeadersInit = { "Content-Type": "application/json" };
        if (refreshToken) {
          (refreshHeaders as Record<string, string>)["Cookie"] = `refreshToken=${refreshToken}`;
        }
        if (deviceId) (refreshHeaders as Record<string, string>)["x-device-id"] = deviceId;
        const refreshRes = await fetch(refreshUrl, {
          method: "POST",
          headers: refreshHeaders,
          body: "{}",
          credentials: refreshToken ? "omit" : "include",
        });
        const refreshData = await refreshRes.json().catch(() => ({}));
        const newToken = (refreshData as RefreshResponse).accessToken;

        if (refreshRes.ok && newToken) {
          setAccessToken(newToken);
          const retryHeaders = new Headers(fetchInit.headers);
          retryHeaders.set("Authorization", `Bearer ${newToken}`);
          if (deviceId) retryHeaders.set("x-device-id", deviceId);
          return fetch(url, { ...fetchInit, headers: retryHeaders });
        }

        // Refresh failed: mark session expired so UI can show message; user stays on page until they choose to sign in
        setSessionExpired(true);
        return res;
      }

      return res;
    },
    [accessToken, refreshToken, setAccessToken, setSessionExpired]
  );

  return authFetch;
}
