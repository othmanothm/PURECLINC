import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

const STORAGE_KEY = 'pureskin_auth';

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initAuth = async () => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.token) {
            // Verify token by fetching current user
            try {
              const currentUser = await authService.getCurrentUser();
              const userData = currentUser.user || parsed.user;
              // Only store essential user properties to prevent unnecessary re-renders
              if (userData) {
                setUser({
                  id: userData.id,
                  name: userData.name,
                  email: userData.email,
                  role: userData.role,
                  ...(userData.role === 'admin' ? { admin_role: userData.admin_role ?? null } : {}),
                });
              } else {
                setUser(null);
              }
              setToken(parsed.token);
            } catch {
              window.localStorage.removeItem(STORAGE_KEY);
              setUser(null);
              setToken(null);
            }
          } else {
            // If no token but user exists, normalize user object
            const userData = parsed.user;
            if (userData) {
              setUser({
                id: userData.id,
                name: userData.name || '',
                email: userData.email || '',
                role: userData.role || '',
                ...(userData.role === 'admin' ? { admin_role: userData.admin_role ?? null } : {}),
              });
            } else {
              setUser(null);
            }
            setToken(null);
          }
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback((authToken, authUser) => {
    setToken(authToken);
    // Only store essential user properties to prevent unnecessary re-renders
    if (authUser) {
      setUser({
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        ...(authUser.role === 'admin' ? { admin_role: authUser.admin_role ?? null } : {}),
      });
    } else {
      setUser(null);
    }
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: authToken, user: authUser })
    );
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
    navigate('/', { replace: true });
  }, [navigate]);

  // Memoize user object to prevent unnecessary re-renders
  // Only recreate if user properties actually change
  const memoizedUser = useMemo(() => {
    if (!user) return null;
    try {
      // Create a stable reference by only including essential properties
      return {
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        ...(user.role === 'admin' ? { admin_role: user.admin_role ?? null } : {}),
      };
    } catch (error) {
      console.error('Error memoizing user:', error);
      return null;
    }
  }, [user?.id, user?.name, user?.email, user?.role, user?.admin_role]);

  // Memoize value object to prevent unnecessary re-renders
  // Only recreate if actual values change
  const value = useMemo(() => ({
    user: memoizedUser,
    token,
    loading,
    login,
    logout,
    isAuthenticated: Boolean(token),
  }), [memoizedUser, token, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}


