// src/lib/api.ts
import axios, { 
  AxiosError, 
  AxiosResponse, 
  InternalAxiosRequestConfig
} from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Cache pour stocker le token CSRF (toujours une chaîne, jamais null)
let csrfTokenCache: string = '';
// Flag pour éviter les requêtes en cascade
let isFetchingCsrfToken = false;
// File d'attente de résolution pour les requêtes en attente pendant la récupération du token CSRF
let csrfTokenPromiseResolvers: ((token: string) => void)[] = [];

// Fonction pour effacer le cache de token CSRF
export const clearCsrfTokenCache = (): void => {
  csrfTokenCache = '';
};

// Fonction getCsrfToken améliorée avec système anti-boucle
export const getCsrfToken = async (): Promise<string> => {
  // Si le token est déjà en cache, le retourner immédiatement
  if (csrfTokenCache) {
    return csrfTokenCache;
  }
  
  // Si une requête pour obtenir le token est déjà en cours, attendre son résultat
  if (isFetchingCsrfToken) {
    return new Promise<string>((resolve) => {
      csrfTokenPromiseResolvers.push(resolve);
    });
  }
  
  // Marquer que nous commençons à récupérer le token
  isFetchingCsrfToken = true;
  
  try {
    // Ajouter un délai et un timeout pour éviter les problèmes de course
    const response = await axios.get(`${BASE_URL}/csrf-token`, { 
      withCredentials: true,
      timeout: 5000
    });
    
    if (response.data && response.data.token) {
      csrfTokenCache = response.data.token;
      
      // Résoudre toutes les promesses en attente
      csrfTokenPromiseResolvers.forEach(resolve => resolve(csrfTokenCache));
      csrfTokenPromiseResolvers = [];
      
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
  } finally {
    // Réinitialiser le flag une fois la requête terminée
    isFetchingCsrfToken = false;
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

// Variable pour suivre les requêtes de rafraîchissement de token
let refreshTokenPromise: Promise<string> | null = null;

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
    // Si aucune configuration de requête, on ne peut pas réessayer
    if (!error.config) {
      return Promise.reject(error);
    }
    
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Si erreur 401 (non autorisé) et requête pas déjà retentée
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Marquer la requête comme retentée pour éviter les boucles infinies
      originalRequest._retry = true;
      
      try {
        // Utiliser une promesse partagée pour éviter les multiples requêtes de refresh
        if (refreshTokenPromise === null) {
          refreshTokenPromise = (async () => {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }
            
            // Effacer le cache CSRF pour obtenir un nouveau token
            clearCsrfTokenCache();
            
            // Faire la requête de rafraîchissement directement avec axios pour éviter les boucles
            const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
              refreshToken,
            }, {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': await getCsrfToken()
              }
            });
            
            const { accessToken } = response.data;
            localStorage.setItem('accessToken', accessToken);
            return accessToken;
          })();
        }
        
        // Attendre le résultat de la promesse partagée
        const newToken = await refreshTokenPromise;
        
        // Mettre à jour l'Authorization header de la requête originale
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // Retenter la requête originale
        return axios(originalRequest);
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
      } finally {
        // Réinitialiser la promesse partagée
        refreshTokenPromise = null;
      }
    }
    
    // Pour les autres erreurs
    return Promise.reject(error);
  }
);

export default api;