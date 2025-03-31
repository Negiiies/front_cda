// src/lib/api.ts - Correction complète pour éviter les erreurs de typage

import axios, { 
  AxiosError, 
  AxiosResponse, 
  InternalAxiosRequestConfig
} from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Cache pour stocker le token CSRF (toujours une chaîne, jamais null)
let csrfTokenCache: string = '';

// Fonction pour effacer le cache de token CSRF
export const clearCsrfTokenCache = (): void => {
  csrfTokenCache = '';
};

// lib/api.ts - Fonction getCsrfToken améliorée
export const getCsrfToken = async (): Promise<string> => {
  // Vérifier d'abord si nous avons déjà un token en cache
  if (csrfTokenCache) return csrfTokenCache;
  
  try {
    // Ajouter un délai et un timeout pour éviter les problèmes de course
    const response = await axios.get(`${BASE_URL}/csrf-token`, { 
      withCredentials: true,
      timeout: 5000
    });
    
    if (response.data && response.data.token) {
      csrfTokenCache = response.data.token;
      return csrfTokenCache;
    } else {
      console.warn('Réponse CSRF inattendue:', response.data);
      // Retourner une chaîne vide plutôt que null pour éviter les erreurs
      return '';
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du token CSRF:', error);
    // En cas d'erreur, retourner une chaîne vide
    return '';
  }
};
// Créer l'instance API
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important pour les cookies CSRF
});

// Intercepteur pour ajouter les tokens aux requêtes
api.interceptors.request.use(
  async (config) => {
    // Ajouter le token d'authentification si disponible
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Ajouter le token CSRF pour les méthodes non-GET
    if (config.method !== 'get') {
      try {
        const csrfToken = await getCsrfToken();
        if (csrfToken) { // Vérifier que le token n'est pas vide
          config.headers = config.headers || {};
          config.headers['X-CSRF-Token'] = csrfToken;
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du token CSRF:', error);
        // Continuer sans token CSRF - le serveur le rejettera si nécessaire
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs et le refresh token
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;
    
    // Si erreur 401 (non autorisé) et requête pas déjà retentée
    if (error.response?.status === 401 && !(originalRequest as any)._retry) {
      (originalRequest as any)._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Effacer le cache CSRF pour obtenir un nouveau token
        clearCsrfTokenCache();
        
        // Faire la requête de rafraîchissement
        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refreshToken,
        }, {
          withCredentials: true,
          headers: {
            'X-CSRF-Token': await getCsrfToken()
          }
        });
        
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        
        // Mettre à jour l'Authorization header de la requête originale
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Retenter la requête originale
        return api(originalRequest);
      } catch (refreshError) {
        // En cas d'échec du refresh, déconnecter l'utilisateur
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        clearCsrfTokenCache();
        
        // Rediriger vers la page de connexion
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // Pour les autres erreurs
    return Promise.reject(error);
  }
);

export default api;