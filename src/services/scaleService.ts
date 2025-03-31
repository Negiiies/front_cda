// src/services/scaleService.ts
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
  isShared?: boolean; // Ajout de la propriété isShared
  criteria?: Criteria[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NewScale {
  title: string;
  description?: string;
  criteria?: NewCriteria[];
}

const scaleService = {
  createScale: async (scaleData: NewScale): Promise<Scale> => {
    const response = await api.post('/scales', scaleData);
    return response.data;
  },

  getScaleById: async (id: number): Promise<Scale> => {
    const response = await api.get(`/scales/${id}`);
    return response.data;
  },

  getScales: async (): Promise<Scale[]> => {
    const response = await api.get('/scales');
    return response.data;
  },

  updateScale: async (id: number, scaleData: Partial<Scale>): Promise<Scale> => {
    const response = await api.put(`/scales/${id}`, scaleData);
    return response.data;
  },

  deleteScale: async (id: number): Promise<void> => {
    await api.delete(`/scales/${id}`);
  },

  // Correction des routes pour les critères
  getCriteriaByScaleId: async (scaleId: number): Promise<Criteria[]> => {
    const response = await api.get(`/scales/${scaleId}/criteria`);
    return response.data;
  },

  createCriteria: async (scaleId: number, criteriaData: Omit<Criteria, 'id' | 'scaleId' | 'createdAt' | 'updatedAt'>): Promise<Criteria> => {
    const response = await api.post(`/scales/${scaleId}/criteria`, criteriaData);
    return response.data;
  },

  // Correction de la route pour mettre à jour un critère
  updateCriteria: async (criteriaId: number, criteriaData: Partial<Criteria>): Promise<Criteria> => {
    const response = await api.put(`/criteria/${criteriaId}`, criteriaData);
    return response.data;
  },

  // Correction de la route pour supprimer un critère
  deleteCriteria: async (criteriaId: number): Promise<void> => {
    await api.delete(`/criteria/${criteriaId}`);
  }
};

export default scaleService;