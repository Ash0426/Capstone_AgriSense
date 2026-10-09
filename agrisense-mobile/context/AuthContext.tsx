// context/AuthContext.tsx
// Holds who's logged in + the auth token, and shares it with every screen via useAuth().
// The session itself only lives in memory, so closing the app fully logs the user out again.
//
// Whether a login needs an emailed OTP is decided by the server: it asks for one when this
// device hasn't been verified for the account before, or the account hasn't logged in for 3+
// days. login() returns { requiresStepUp: true } in that case; the screen then calls
// verifyStepUp(code) to finish. A PIN can be used in place of the password (see login()).
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { setAuthToken } from '../api/client';
import { getDeviceId } from '../api/deviceId';
import {
  login as apiLogin,
  verifyLoginStepUpOtp,
  resendLoginStepUpOtp,
  AuthUser,
} from '../api/endpoints';

type AuthContextValue = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (email: string, secret: { password?: string; pin?: string }) => Promise<{ requiresStepUp: boolean }>;
  verifyStepUp: (otp: string) => Promise<void>;
  resendStepUpOtp: () => Promise<void>;
  logout: () => void;
  setUser: (user: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const stepUpToken = useRef<string | null>(null);

  const login = useCallback(async (email: string, secret: { password?: string; pin?: string }) => {
    const deviceId = await getDeviceId();
    const result = await apiLogin(email, secret, deviceId);

    if (result.requiresStepUp) {
      stepUpToken.current = result.stepUpToken;
      return { requiresStepUp: true };
    }

    setAuthToken(result.token);
    setUser(result.user);
    return { requiresStepUp: false };
  }, []);

  const verifyStepUp = useCallback(async (otp: string) => {
    if (!stepUpToken.current) throw new Error('Login session expired. Please log in again.');
    const { token, user: verifiedUser } = await verifyLoginStepUpOtp(stepUpToken.current, otp);
    stepUpToken.current = null;
    setAuthToken(token);
    setUser(verifiedUser);
  }, []);

  const resendStepUpOtp = useCallback(async () => {
    if (!stepUpToken.current) throw new Error('Login session expired. Please log in again.');
    await resendLoginStepUpOtp(stepUpToken.current);
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    stepUpToken.current = null;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: !!user, login, verifyStepUp, resendStepUpOtp, logout, setUser }}
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
