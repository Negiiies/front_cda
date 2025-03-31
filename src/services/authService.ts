// src/services/authService.ts
import api, { getCsrfToken, clearCsrfTokenCache } from '../lib/api';
import { UserRole } from '../lib/auth';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    role: UserRole;
    name?: string; // Inclure le nom si disponible
  };
}

interface DecodedToken {
  userId: number;
  email: string;
  role: UserRole;
  name?: string; // Inclure le nom si disponible
  exp: number;
  iat: number;
}

const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Obtenir un token CSRF avant de tenter la connexion
    await getCsrfToken();
    
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      console.error('Login API error:', error.response?.data || error.message);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      // Vérifier si un token existe
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        // Essayer de se déconnecter via l'API
        await getCsrfToken(); // S'assurer d'avoir un CSRF token valide
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      // Dans tous les cas, nettoyer le localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      clearCsrfTokenCache();
    }
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    try {
      // Obtenir un nouveau token CSRF pour le refresh
      await getCsrfToken();
      
      const response = await api.post('/auth/refresh-token', { refreshToken });
      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  },

  getCurrentUser: (): { userId: number; email: string; role: UserRole; name?: string } | null => {
    // S'assurer que le code s'exécute uniquement côté client
    if (typeof window === 'undefined') return null;
    
    // Récupérer le token
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      // Décodage du JWT
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const decoded = JSON.parse(jsonPayload) as DecodedToken;
      
      // Vérifier si le token n'est pas expiré
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        // Token expiré, tenter un refresh automatique
        console.warn('Token expired, should refresh');
        // Retourner null pour provoquer une réauthentification
        return null;
      }
      
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name // Inclure le nom si disponible
      };
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  },
  
  isTokenExpired: (): boolean => {
    const token = localStorage.getItem('accessToken');
    if (!token) return true;
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = JSON.parse(atob(base64));
      
      const currentTime = Math.floor(Date.now() / 1000);
      return jsonPayload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }
};

export default authService;