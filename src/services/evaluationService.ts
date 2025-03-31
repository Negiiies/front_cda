// src/services/evaluationService.ts
import api from '../lib/api';
import { Criteria } from './scaleService';

export interface Grade {
  id: number;
  evaluationId: number;
  criteriaId: number;
  value: number;
  criteria?: Criteria;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: number;
  evaluationId: number;
  teacherId: number;
  text: string;
  teacher?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Evaluation {
  id: number;
  title: string;
  dateEval: Date;
  studentId: number;
  teacherId: number;
  scaleId: number;
  status: 'draft' | 'published' | 'archived';
  student?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  teacher?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  scale?: {
    id: number;
    title: string;
    description?: string;
    criteria?: Criteria[];
  };
  grades?: Grade[];
  comments?: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NewEvaluation {
  title: string;
  dateEval: Date;
  studentId: number;
  scaleId: number;
}

export interface NewGrade {
  evaluationId: number;
  criteriaId: number;
  value: number;
}

const evaluationService = {
  getEvaluations: async (filters = {}): Promise<Evaluation[]> => {
    const response = await api.get('/evaluations', { params: filters });
    return response.data;
  },

  getEvaluationById: async (id: number): Promise<Evaluation> => {
    const response = await api.get(`/evaluations/${id}`);
    return response.data;
  },

  createEvaluation: async (evaluationData: NewEvaluation): Promise<Evaluation> => {
    const response = await api.post('/evaluations', evaluationData);
    return response.data;
  },

  updateEvaluation: async (id: number, evaluationData: Partial<Evaluation>): Promise<Evaluation> => {
    const response = await api.put(`/evaluations/${id}`, evaluationData);
    return response.data;
  },

  changeStatus: async (id: number, status: 'draft' | 'published' | 'archived'): Promise<Evaluation> => {
    const response = await api.patch(`/evaluations/${id}/status`, { status });
    return response.data;
  },

  deleteEvaluation: async (id: number): Promise<void> => {
    await api.delete(`/evaluations/${id}`);
  },

  // Amélioration des méthodes pour les grades
  getGrades: async (evaluationId: number): Promise<Grade[]> => {
    const response = await api.get(`/evaluations/${evaluationId}/grades`);
    return response.data;
  },

  createGrade: async (gradeData: NewGrade): Promise<Grade> => {
    const response = await api.post(`/evaluations/${gradeData.evaluationId}/grades`, gradeData);
    return response.data;
  },
  
  updateGrade: async (gradeId: number, value: number): Promise<Grade> => {
    const response = await api.put(`/grades/${gradeId}`, { value });
    return response.data;
  },
  
  deleteGrade: async (gradeId: number): Promise<void> => {
    await api.delete(`/grades/${gradeId}`);
  },

  // Amélioration des méthodes pour les commentaires
  getComments: async (evaluationId: number): Promise<Comment[]> => {
    const response = await api.get(`/evaluations/${evaluationId}/comments`);
    return response.data;
  },

  addComment: async (evaluationId: number, text: string): Promise<Comment> => {
    const response = await api.post(`/evaluations/${evaluationId}/comments`, {
      evaluationId,
      text
    });
    return response.data;
  },

  updateComment: async (commentId: number, text: string): Promise<Comment> => {
    const response = await api.put(`/comments/${commentId}`, { text });
    return response.data;
  },

  deleteComment: async (commentId: number): Promise<void> => {
    await api.delete(`/comments/${commentId}`);
  }
};

export default evaluationService;