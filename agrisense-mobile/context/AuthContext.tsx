// context/AuthContext.tsx
// Holds who's logged in + the auth token, and shares it with every screen via useAuth().
// Note: this only lives in memory, so closing the app fully will log the user out again.
// If you want "stay logged in" behavior later, install @react-native-async-storage/async-storage
// and save/load the token there in login()/logout()/on app start.
import React, { createContext, useContext, useState, useCallback } from 'react';
import { setAuthToken } from '../api/client';
import { login as apiLogin, AuthUser } from '../api/endpoints';

type AuthContextValue = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: loggedInUser } = await apiLogin(email, password);
    setAuthToken(token);
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
