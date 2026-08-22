// context/AuthContext.tsx
// Holds who's logged in + the auth token, and shares it with every screen via useAuth().
// Note: this only lives in memory, so closing the app fully will log the user out again.
// If you want "stay logged in" behavior later, install @react-native-async-storage/async-storage
// and save/load the token there in login()/logout()/on app start.
//
// Login also requires a step-up OTP whenever the last successful login was 24h+ ago (or
// there hasn't been one yet this session) — see login()/completeStepUp() below. Because
// lastLoginAt is memory-only, a fresh app launch always requires OTP, which is expected.
import React, { createContext, useContext, useState, useCallback } from 'react';
import { setAuthToken } from '../api/client';
import { login as apiLogin, AuthUser } from '../api/endpoints';

const STEP_UP_WINDOW_MS = 24 * 60 * 60 * 1000;

type AuthContextValue = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  pendingUser: AuthUser | null;
  login: (email: string, password: string) => Promise<{ requiresStepUp: boolean }>;
  completeStepUp: () => void;
  logout: () => void;
  setUser: (user: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: loggedInUser } = await apiLogin(email, password);
    const requiresStepUp = !lastLoginAt || Date.now() - new Date(lastLoginAt).getTime() >= STEP_UP_WINDOW_MS;

    if (!requiresStepUp) {
      setAuthToken(token);
      setUser(loggedInUser);
      setLastLoginAt(new Date().toISOString());
      return { requiresStepUp: false };
    }

    setPendingUser(loggedInUser);
    setPendingToken(token);
    return { requiresStepUp: true };
  }, [lastLoginAt]);

  const completeStepUp = useCallback(() => {
    if (!pendingUser || !pendingToken) return;
    setAuthToken(pendingToken);
    setUser(pendingUser);
    setLastLoginAt(new Date().toISOString());
    setPendingUser(null);
    setPendingToken(null);
  }, [pendingUser, pendingToken]);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    // lastLoginAt is intentionally left as-is: it tracks the last successful login, not the
    // last active session, so logging back in within the window still skips the OTP step.
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: !!user, pendingUser, login, completeStepUp, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
