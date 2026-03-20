import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.includes('://') ? envUrl.trim() : 'https://' + envUrl.trim();
  }
  return 'http://localhost:5000';
};

const API_BASE = getApiBase();
const AUTH_API = `${API_BASE}/api/auth`;

const STORAGE_KEYS = {
  TOKEN: 'fg_token',
  USER: 'fg_user',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Verify session on mount
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${AUTH_API}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Invalid session');
        return r.json();
      })
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        } else {
          _clearSession();
        }
      })
      .catch(() => _clearSession())
      .finally(() => setLoading(false));
  }, []);

  // ── Register ──────────────────────────────────────────
  const register = useCallback(async ({ name, email, password, region }) => {
    const res = await fetch(`${AUTH_API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, region: region || 'MENA Region' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    _saveSession(data.token, data.user);
    return data.user;
  }, []);

  // ── Login ─────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    const res = await fetch(`${AUTH_API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    _saveSession(data.token, data.user);
    return data.user;
  }, []);

  // ── Logout ────────────────────────────────────────────
  const logout = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      fetch(`${AUTH_API}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    }
    _clearSession();
  }, []);

  // ── Update Profile ────────────────────────────────────
  const updateProfile = useCallback(async ({ name, region, avatar }) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const res = await fetch(`${AUTH_API}/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, region, avatar: avatar || null }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Update failed');
    setUser(data.user);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    return data.user;
  }, []);

  // ── Authenticated Fetch ───────────────────────────────
  const authFetch = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      _clearSession();
      throw new Error('Session expired');
    }

    return res;
  }, []);

  // ── Private Helpers ───────────────────────────────────
  function _saveSession(token, userData) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    setUser(userData);
  }

  function _clearSession() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    updateProfile,
    authFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
