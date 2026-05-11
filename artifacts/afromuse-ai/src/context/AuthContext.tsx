import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Plan } from "@/context/PlanContext";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  plan: Plan;
  emailVerified?: boolean;
}

interface AuthResult {
  success: boolean;
  error?: string;
  requiresVerification?: boolean;
  email?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isLoading: true,
  user: null,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: async () => {},
});

const TOKEN_KEY = "afromuse_auth_token";

export function getStoredToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function storeToken(token: string) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}

function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch("/api/auth/me", { credentials: "include", headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AuthUser | null) => {
        if (data && data.id) setUser(data);
        else clearToken();
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresVerification) {
          return { success: false, requiresVerification: true, email: data.email, error: data.error };
        }
        return { success: false, error: data.error ?? "Login failed." };
      }
      if (data.token) storeToken(data.token);
      setUser(data as AuthUser);
      return { success: true };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error ?? "Registration failed." };
      if (data.requiresVerification) {
        return { success: true, requiresVerification: true, email: data.email };
      }
      if (data.token) storeToken(data.token);
      setUser(data as AuthUser);
      return { success: true };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: user !== null, isLoading, user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
