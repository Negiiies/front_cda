// src/services/userService.ts
import api from '../lib/api';
import { UserRole } from '../lib/auth';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateUserData {
  name?: string;
  description?: string;
  password?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

const userService = {
  // Récupérer tous les utilisateurs (admin seulement)
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Récupérer un utilisateur par son ID
  getUserById: async (id: number): Promise<User> => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }
  },

  // Créer un nouvel utilisateur (admin seulement)
  createUser: async (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    description?: string;
  }): Promise<User> => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },
  
  // Mettre à jour un utilisateur
  updateUser: async (id: number, userData: UpdateUserData): Promise<User> => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
  },

  // Supprimer/désactiver un utilisateur
  deleteUser: async (id: number): Promise<void> => {
    try {
      await api.delete(`/users/${id}`);
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw error;
    }
  },

  // Changer le mot de passe
  changePassword: async (userId: number, data: ChangePasswordData): Promise<void> => {
    try {
      // Essayer de voir si l'endpoint spécifique existe
      await api.post(`/users/${userId}/change-password`, data);
    } catch (error: any) {
      // Si l'erreur est due à un endpoint inexistant, essayer avec updateUser
      if (error.response && error.response.status === 404) {
        console.warn('change-password endpoint not found, falling back to updateUser');
        await api.put(`/users/${userId}`, {
          password: data.newPassword,
          currentPassword: data.currentPassword
        });
      } else {
        // Propager d'autres erreurs
        throw error;
      }
    }
  },

  // services/userService.ts - Version améliorée
getMyProfile: async (): Promise<User> => {
  try {
    // Essayons d'abord de déduire l'ID à partir du token
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Utilisateur non authentifié');
    }
    
    // Décodage basique du JWT
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        throw new Error('Format de token invalide');
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      
      if (!payload.userId) {
        throw new Error('ID utilisateur non trouvé dans le token');
      }
      
      // Retourner directement les informations du token sans faire d'appel API
      return {
        id: payload.userId,
        name: payload.name || 'Utilisateur',
        email: payload.email || '',
        role: payload.role,
        status: 'active'
      };
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    throw error;
  }
}
};

export default userService;