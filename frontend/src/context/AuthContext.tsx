import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  loginUser,
  registerUser,
  logoutUser,
  refreshAuthToken,
  fetchUserProfile,
  updateUserProfile,
  setOnAuthFailure,
  setAccessToken,
} from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; preferred_language?: string; text_size?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Pick<UserProfile, 'preferred_language' | 'text_size'>>) => Promise<void>;
  textSize: 'normal' | 'large' | 'xlarge';
  setTextSize: (size: 'normal' | 'large' | 'xlarge') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { addToast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [textSize, setTextSizeState] = useState<'normal' | 'large' | 'xlarge'>(() => {
    return (localStorage.getItem('law-mithra-text-size') as any) || 'normal';
  });

  // Apply text size class to <html> element app-wide
  const applyTextSize = useCallback((size: 'normal' | 'large' | 'xlarge') => {
    document.documentElement.classList.remove('text-size-normal', 'text-size-large', 'text-size-xlarge');
    document.documentElement.classList.add(`text-size-${size}`);
    localStorage.setItem('law-mithra-text-size', size);
    setTextSizeState(size);
  }, []);

  const setTextSize = (size: 'normal' | 'large' | 'xlarge') => {
    applyTextSize(size);
    if (user) {
      updateUserProfile({ text_size: size }).catch(() => {});
    }
  };

  // Listen for global auth failure (401 session expiration)
  useEffect(() => {
    setOnAuthFailure(() => {
      setUser(null);
      setAccessToken(null);
      addToast({
        title: 'Session Expired',
        description: 'Your session has expired. Please log in again to continue.',
        variant: 'info',
      });
    });
  }, [addToast]);

  // Initial silent auth check on application mount
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const token = await refreshAuthToken();
        if (token && isMounted) {
          const profile = await fetchUserProfile();
          if (isMounted) {
            setUser(profile);
            if (profile.text_size) {
              applyTextSize(profile.text_size);
            }
          }
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [applyTextSize]);

  const login = async (data: { email: string; password: string }) => {
    const res = await loginUser(data);
    setUser(res.user);
    if (res.user.text_size) {
      applyTextSize(res.user.text_size);
    }
  };

  const register = async (data: { email: string; password: string; preferred_language?: string; text_size?: string }) => {
    const res = await registerUser(data);
    setUser(res.user);
    if (res.user.text_size) {
      applyTextSize(res.user.text_size);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      setAccessToken(null);
      addToast({
        title: 'Logged Out',
        description: 'You have been safely signed out.',
        variant: 'info',
      });
    }
  };

  const updateProfile = async (data: Partial<Pick<UserProfile, 'preferred_language' | 'text_size'>>) => {
    const updated = await updateUserProfile(data);
    setUser(updated);
    if (updated.text_size) {
      applyTextSize(updated.text_size);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        textSize,
        setTextSize,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
