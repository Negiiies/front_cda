// src/lib/auth.tsx - Ajouts pour la gestion du profil
'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import authService from '../services/authService';
import userService from '../services/userService';
import { clearCsrfTokenCache } from './api';

export type UserRole = 'student' | 'teacher' | 'admin';

export type User = {
  userId: number;
  email: string;
  role: UserRole;
  name?: string; // Ajouté pour le support du nom d'utilisateur
} | null;

// Vérifier si l'utilisateur a un rôle requis
export function hasRequiredRole(user: User, allowedRoles: UserRole[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

type AuthContextType = {
  user: User;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (name: string, description?: string) => Promise<void>; // Nouvelle fonction pour mettre à jour le profil
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Vérifier si l'utilisateur est authentifié au chargement ou à la réhydratation
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const currentUser = authService.getCurrentUser();
        
        if (currentUser) {
          // Enrichir les données utilisateur avec des informations supplémentaires si possible
          try {
            const userProfile = await userService.getMyProfile();
            setUser({
              ...currentUser,
              name: userProfile.name // Ajouter le nom à partir du profil
            });
          } catch (profileError) {
            console.warn('Failed to fetch extended profile, using basic user info', profileError);
            setUser(currentUser);
          }
        } else if (!PUBLIC_ROUTES.includes(pathname || '')) {
          // Si pas d'utilisateur et pas sur une route publique, rediriger
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    // On surveille le pathname pour réagir aux changements de route
  }, [pathname, router]);

  // Fonction pour se connecter
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.login({ email, password });
      
      // Stocker les tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      // Mettre à jour l'utilisateur avec toutes les données disponibles
      setUser({
        userId: response.user.id,
        email: response.user.email,
        role: response.user.role,
        name: response.user.name // Inclure le nom s'il est disponible
      });
      
      // Rediriger vers le dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.response?.data?.message || 'Échec de la connexion';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour se déconnecter
  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      clearCsrfTokenCache();
      setUser(null);
      router.push('/login');
      setIsLoading(false);
    }
  };

  // Nouvelle fonction pour mettre à jour le profil utilisateur
  const updateUserProfile = async (name: string, description?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsLoading(true);
    try {
      await userService.updateUser(user.userId, { name, description });
      
      // Mettre à jour l'état local de l'utilisateur
      setUser(prev => prev ? { ...prev, name } : null);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Mémoriser le contexte pour éviter des re-renders inutiles
  const contextValue = useMemo(() => ({
    user,
    login,
    logout,
    updateUserProfile, // Ajouter la nouvelle fonction au contexte
    isLoading,
    error,
    setError
  }), [user, isLoading, error]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}