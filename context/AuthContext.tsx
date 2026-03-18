"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { LoginResponse, StoredAuth, User } from "@/types/auth";
import { AUTH_STORAGE_KEY } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isReady: boolean;
  sessionExpired: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  setSessionExpired: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed?.accessToken || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredAuth(payload: StoredAuth): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const stored = readStoredAuth();
    if (stored) {
      setUser(stored.user);
      setAccessTokenState(stored.accessToken);
      setRefreshToken(stored.refreshToken ?? null);
    }
    setIsReady(true);
  }, []);

  const login = useCallback((data: LoginResponse) => {
    const payload: StoredAuth = {
      accessToken: data.accessToken,
      user: data.user,
      ...(data.refreshToken != null && { refreshToken: data.refreshToken }),
    };
    setUser(data.user);
    setAccessTokenState(data.accessToken);
    setRefreshToken(data.refreshToken ?? null);
    writeStoredAuth(payload);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAccessTokenState(null);
    setRefreshToken(null);
    setSessionExpired(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const setAccessToken = useCallback((newAccessToken: string) => {
    setAccessTokenState(newAccessToken);
    const stored = readStoredAuth();
    if (stored) {
      writeStoredAuth({ ...stored, accessToken: newAccessToken });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isReady,
        sessionExpired,
        login,
        logout,
        setAccessToken,
        setSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
