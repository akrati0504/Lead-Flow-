import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('leadflow_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('leadflow_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Restore and verify user session on mount/refresh
  useEffect(() => {
    async function restoreSession() {
      const storedToken = localStorage.getItem('leadflow_token');
      if (!storedToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getCurrentUser();
        const userData = response.data?.user || response.data;
        setUser(userData);
        localStorage.setItem('leadflow_user', JSON.stringify(userData));
      } catch (_err) {
        // Token was invalid, expired or user was deactivated
        localStorage.removeItem('leadflow_token');
        localStorage.removeItem('leadflow_user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    const { token: receivedToken, user: receivedUser } = res.data;

    localStorage.setItem('leadflow_token', receivedToken);
    localStorage.setItem('leadflow_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);

    return receivedUser;
  };

  const logout = async () => {
    try {
      if (token) {
        await authService.logout();
      }
    } catch (err) {
      console.warn('Logout API failed or token already invalid:', err);
    } finally {
      localStorage.removeItem('leadflow_token');
      localStorage.removeItem('leadflow_user');
      setToken(null);
      setUser(null);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      const userData = response.data?.user || response.data;
      setUser(userData);
      localStorage.setItem('leadflow_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      logout();
      throw err;
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    logout,
    fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
