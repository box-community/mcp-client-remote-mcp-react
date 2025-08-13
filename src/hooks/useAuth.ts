import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { AuthState, User } from '../types/auth';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    tokenExpiry: null,
    loading: true,
    error: null,
  });

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have valid Box credentials
        const clientId = import.meta.env.VITE_BOX_CLIENT_ID;
        const clientSecret = import.meta.env.VITE_BOX_CLIENT_SECRET;
        if (!clientId || !clientSecret || 
            clientId === 'your_box_client_id_here' || clientId === 'demo_client_id' ||
            clientSecret === 'your_box_client_secret_here') {
          // Development mode - show login button but warn about missing credentials
          setAuthState({
            isAuthenticated: false,
            token: null,
            tokenExpiry: null,
            loading: false,
            error: 'Box client credentials not configured. Please add valid VITE_BOX_CLIENT_ID and VITE_BOX_CLIENT_SECRET to .env file.',
          });
          return;
        }

        const isAuthenticated = authService.isAuthenticated();
        
        if (isAuthenticated) {
          const token = authService.getAccessToken();
          const currentUser = await authService.getCurrentUser();
          
          setAuthState({
            isAuthenticated: true,
            token,
            tokenExpiry: null,
            loading: false,
            error: null,
          });
          
          setUser(currentUser);
        } else {
          setAuthState({
            isAuthenticated: false,
            token: null,
            tokenExpiry: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setAuthState({
          isAuthenticated: false,
          token: null,
          tokenExpiry: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Authentication failed',
        });
      }
    };

    initializeAuth();
  }, []);

  const login = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await authService.initiateOAuth();
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
    }
  };

  const logout = () => {
    authService.logout();
    setAuthState({
      isAuthenticated: false,
      token: null,
      tokenExpiry: null,
      loading: false,
      error: null,
    });
    setUser(null);
  };

  const refreshAuth = async () => {
    try {
      const tokenData = await authService.refreshToken();
      if (tokenData) {
        const currentUser = await authService.getCurrentUser();
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          token: tokenData.access_token,
          error: null,
        }));
        setUser(currentUser);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
    }
    return false;
  };

  return {
    ...authState,
    user,
    login,
    logout,
    refreshAuth,
  };
};