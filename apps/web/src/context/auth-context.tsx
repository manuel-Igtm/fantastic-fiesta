import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import { SaveSabiApi } from '../lib/api';
import type { MeResponse as ApiMeResponse } from '../lib/api';
import type { LoginRequest, RegisterRequest, SupportedLanguage } from '../types';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  me: ApiMeResponse | null;
  accessToken: string | null;
  token: string | null;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  updateProfile: (payload: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    country?: string;
    currency?: string;
    monthlyBaselineExpense?: number;
  }) => Promise<void>;
  updateLanguage: (preferredLanguage: SupportedLanguage) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'save-sabi-auth';

function normalizeLanguage(language: string): SupportedLanguage {
  return language === 'sw' ? 'sw' : 'en';
}

function normalizeMeResponse(response: ApiMeResponse): ApiMeResponse {
  return {
    ...response,
    preferredLanguage: normalizeLanguage(response.preferredLanguage)
  };
}

type StoredAuthState = {
  accessToken: string;
  refreshToken: string;
};

function readStoredAuth(): StoredAuthState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredAuthState;
  } catch {
    return null;
  }
}

function storeAuth(tokens: StoredAuthState | null) {
  if (!tokens) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = readStoredAuth();
  const [accessToken, setAccessToken] = useState<string | null>(initial?.accessToken ?? null);
  const [refreshToken, setRefreshToken] = useState<string | null>(initial?.refreshToken ?? null);
  const [me, setMe] = useState<ApiMeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const api = useMemo(() => new SaveSabiApi(() => accessToken), [accessToken]);

  const setTokens = useCallback((tokens: StoredAuthState | null) => {
    if (!tokens) {
      setAccessToken(null);
      setRefreshToken(null);
      storeAuth(null);
      return;
    }

    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    storeAuth(tokens);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!accessToken) {
      setMe(null);
      return;
    }

    try {
      const profile = await api.me();
      setMe(normalizeMeResponse(profile));
      return;
    } catch (error) {
      if (!(error instanceof Error) || !refreshToken) {
        throw error;
      }
    }

    const refreshed = await new SaveSabiApi(() => null).refresh(refreshToken);
    setTokens({
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken
    });
    const nextProfile = await new SaveSabiApi(() => refreshed.accessToken).me();
    setMe(normalizeMeResponse(nextProfile));
  }, [accessToken, api, refreshToken, setTokens]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const response = await new SaveSabiApi(() => null).login(payload);
      setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken
      });
      const nextProfile = await new SaveSabiApi(() => response.accessToken).me();
      setMe(normalizeMeResponse(nextProfile));
    },
    [setTokens]
  );

  const register = useCallback(
    async (payload: RegisterRequest) => {
      const response = await new SaveSabiApi(() => null).register(payload);
      setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken
      });
      const nextProfile = await new SaveSabiApi(() => response.accessToken).me();
      setMe(normalizeMeResponse(nextProfile));
    },
    [setTokens]
  );

  const logout = useCallback(async () => {
    if (accessToken) {
      try {
        await api.logout();
      } catch {
        // Clear local state even if server-side logout fails.
      }
    }
    setTokens(null);
    setMe(null);
    setIsLoading(false);
  }, [accessToken, api, setTokens]);

  const updateProfile = useCallback(
    async (payload: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      country?: string;
      currency?: string;
      monthlyBaselineExpense?: number;
    }) => {
      const updated = await api.updateMe(payload);
      setMe(normalizeMeResponse(updated));
    },
    [api]
  );

  const updateLanguage = useCallback(
    async (preferredLanguage: SupportedLanguage) => {
      const updated = await api.updateLanguage(preferredLanguage);
      setMe(normalizeMeResponse(updated));
    },
    [api]
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        if (initial?.accessToken) {
          await refreshMe();
        }
      } catch {
        setTokens(null);
        setMe(null);
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, [initial?.accessToken, refreshMe, setTokens]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(accessToken),
      isLoading,
      me,
      accessToken,
      token: accessToken,
      login,
      register,
      logout,
      refreshMe,
      updateProfile,
      updateLanguage
    }),
    [accessToken, isLoading, login, logout, me, refreshMe, register, updateLanguage, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
