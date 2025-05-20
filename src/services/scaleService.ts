// src/services/scaleService.ts - Version corrigée
import api from '../lib/api';

export interface Criteria {
  id: number;
  description: string;
  associatedSkill: string;
  maxPoints: number;
  coefficient: number;
  scaleId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NewCriteria {
  description: string;
  associatedSkill: string;
  maxPoints: number;
  coefficient: number;
}

export interface Scale {
  id: number;
  title: string;
  description?: string;
  creatorId: number;
  isShared?: boolean;
  criteria?: Criteria[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NewScale {
  title: string;
  description?: string;
  criteria?: NewCriteria[];
}

// Données de secours pour les barèmes
const fallbackScales: Scale[] = [
  { 
    id: 1, 
    title: 'Évaluation de développement web', 
    description: 'Barème pour les projets web frontend', 
    creatorId: 1,
    isShared: true,
    criteria: [
      { id: 1, description: 'Qualité du code', associatedSkill: 'Développement', maxPoints: 20, coefficient: 0.3, scaleId: 1 },
      { id: 2, description: 'Design et UX', associatedSkill: 'Interface', maxPoints: 15, coefficient: 0.3, scaleId: 1 },
      { id: 3, description: 'Fonctionnalités', associatedSkill: 'Technique', maxPoints: 25, coefficient: 0.4, scaleId: 1 }
    ]
  },
  { 
    id: 2, 
    title: 'Évaluation de conception', 
    description: 'Barème pour les projets de design', 
    creatorId: 1,
    isShared: false,
    criteria: [
      { id: 4, description: 'Créativité', associatedSkill: 'Conception', maxPoints: 30, coefficient: 0.5, scaleId: 2 },
      { id: 5, description: 'Technique', associatedSkill: 'Outils', maxPoints: 20, coefficient: 0.5, scaleId: 2 }
    ]
  }
];

const scaleService = {
  createScale: async (scaleData: NewScale): Promise<Scale> => {
    try {
      console.log('Creating new scale:', scaleData);
      const response = await api.post('/scales', scaleData);
      console.log('Scale created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating scale:', error);
      
      // Logs détaillés en cas d'erreur
      if (error.response) {
        console.error('Server error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      throw error;
    }
  },

  getScaleById: async (id: number): Promise<Scale> => {
    try {
      console.log(`Fetching scale with ID: ${id}`);
      const response = await api.get(`/scales/${id}`);
      console.log('Scale fetched successfully:', response.data.title);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching scale with ID ${id}:`, error);
      
      // En cas d'erreur, essayer de trouver le barème dans les données de secours
      const fallbackScale = fallbackScales.find(scale => scale.id === id);
      if (fallbackScale) {
        console.warn(`Using fallback data for scale ${id}`);
        return fallbackScale;
      }
      
      throw error;
    }
  },

  getScales: async (): Promise<Scale[]> => {
    try {
      console.log('Fetching all scales');
      
      // Vérifiez le token avant d'envoyer la requête
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('No authentication token found when fetching scales');
      }
      
      const response = await api.get('/scales');
      console.log(`${response.data.length} scales fetched successfully`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching scales:', error);
      
      // Log détaillé de l'erreur
      if (error.response) {
        console.error('Server error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // En cas d'erreur 403 ou autre, utiliser des données de secours
        if (error.response.status === 403 || error.response.status === 401) {
          console.warn('Permission denied, using fallback scales data');
          return fallbackScales;
        }
      } else if (error.request) {
        console.warn('Network error, using fallback scales data');
        return fallbackScales;
      }
      
      throw error;
    }
  },

  updateScale: async (id: number, scaleData: Partial<Scale>): Promise<Scale> => {
    try {
      console.log(`Updating scale ${id}:`, scaleData);
      const response = await api.put(`/scales/${id}`, scaleData);
      console.log('Scale updated successfully');
      return response.data;
    } catch (error) {
      console.error(`Error updating scale with ID ${id}:`, error);
      throw error;
    }
  },

  deleteScale: async (id: number): Promise<void> => {
    try {
      console.log(`Deleting scale ${id}`);
      await api.delete(`/scales/${id}`);
      console.log('Scale deleted successfully');
    } catch (error) {
      console.error(`Error deleting scale with ID ${id}:`, error);
      throw error;
    }
  },

  // Fonctions pour la gestion des critères
  getCriteriaByScaleId: async (scaleId: number): Promise<Criteria[]> => {
    try {
      console.log(`Fetching criteria for scale ${scaleId}`);
      const response = await api.get(`/scales/${scaleId}/criteria`);
      console.log(`${response.data.length} criteria fetched successfully`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching criteria for scale ${scaleId}:`, error);
      
      // En cas d'erreur, essayer de trouver les critères dans les données de secours
      const fallbackScale = fallbackScales.find(scale => scale.id === scaleId);
      if (fallbackScale && fallbackScale.criteria) {
        console.warn(`Using fallback criteria data for scale ${scaleId}`);
        return fallbackScale.criteria;
      }
      
      throw error;
    }
  },

  createCriteria: async (scaleId: number, criteriaData: Omit<Criteria, 'id' | 'scaleId' | 'createdAt' | 'updatedAt'>): Promise<Criteria> => {
    try {
      console.log(`Creating new criteria for scale ${scaleId}:`, criteriaData);
      const response = await api.post(`/scales/${scaleId}/criteria`, criteriaData);
      console.log('Criteria created successfully');
      return response.data;
    } catch (error) {
      console.error(`Error creating criteria for scale ${scaleId}:`, error);
      throw error;
    }
  },

  updateCriteria: async (criteriaId: number, criteriaData: Partial<Criteria>): Promise<Criteria> => {
    try {
      console.log(`Updating criteria ${criteriaId}:`, criteriaData);
      const response = await api.put(`/criteria/${criteriaId}`, criteriaData);
      console.log('Criteria updated successfully');
      return response.data;
    } catch (error) {
      console.error(`Error updating criteria with ID ${criteriaId}:`, error);
      throw error;
    }
  },

  deleteCriteria: async (criteriaId: number): Promise<void> => {
    try {
      console.log(`Deleting criteria ${criteriaId}`);
      await api.delete(`/criteria/${criteriaId}`);
      console.log('Criteria deleted successfully');
    } catch (error) {
      console.error(`Error deleting criteria with ID ${criteriaId}:`, error);
      throw error;
    }
  }
};

export default scaleService;