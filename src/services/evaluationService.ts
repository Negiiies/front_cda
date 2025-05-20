// src/services/evaluationService.ts - Version complètement corrigée
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
  dateEval: Date | string; // Accepter les deux formats
  studentId: number | string; // Accepter string ou number
  scaleId: number | string; // Accepter string ou number
}

export interface NewGrade {
  evaluationId: number;
  criteriaId: number;
  value: number;
}

const evaluationService = {
  getEvaluations: async (filters = {}): Promise<Evaluation[]> => {
    try {
      console.log("Fetching evaluations with filters:", filters);
      const response = await api.get('/evaluations', { params: filters });
      console.log(`Retrieved ${response.data.length} evaluations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      throw error;
    }
  },

  getEvaluationById: async (id: number): Promise<Evaluation> => {
    try {
      console.log(`Fetching evaluation with ID: ${id}`);
      const response = await api.get(`/evaluations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching evaluation with ID ${id}:`, error);
      throw error;
    }
  },

  // Remplacer cette fonction
createEvaluation: async (evaluationData: NewEvaluation): Promise<Evaluation> => {
  try {
    console.log('Frontend - Données envoyées:', evaluationData);
    
    // Assurer que les IDs sont des nombres
    const payload = {
      ...evaluationData,
      studentId: Number(evaluationData.studentId),
      scaleId: Number(evaluationData.scaleId)
    };
    
    const response = await api.post('/evaluations', payload);
    return response.data;
  } catch (error) {
    console.error('Frontend - Erreur API:', error);
    throw error;
  }
},

  updateEvaluation: async (id: number, evaluationData: Partial<Evaluation>): Promise<Evaluation> => {
    try {
      // Normaliser les données avant envoi
      const formattedData: any = { ...evaluationData };
      
      // Formatage de la date si elle existe
      if (evaluationData.dateEval) {
        formattedData.dateEval = typeof evaluationData.dateEval === 'string' 
          ? evaluationData.dateEval 
          : evaluationData.dateEval.toISOString().split('T')[0];
      }
      
      console.log(`Updating evaluation ${id}:`, formattedData);
      const response = await api.put(`/evaluations/${id}`, formattedData);
      console.log('Evaluation updated successfully');
      return response.data;
    } catch (error) {
      console.error(`Error updating evaluation ${id}:`, error);
      throw error;
    }
  },

  changeStatus: async (id: number, status: 'draft' | 'published' | 'archived'): Promise<Evaluation> => {
    try {
      console.log(`Changing status for evaluation ${id} to ${status}`);
      const response = await api.patch(`/evaluations/${id}/status`, { status });
      console.log('Status changed successfully');
      return response.data;
    } catch (error) {
      console.error(`Error changing status for evaluation ${id}:`, error);
      throw error;
    }
  },

  deleteEvaluation: async (id: number): Promise<void> => {
    try {
      console.log(`Deleting evaluation ${id}`);
      await api.delete(`/evaluations/${id}`);
      console.log('Evaluation deleted successfully');
    } catch (error) {
      console.error(`Error deleting evaluation ${id}:`, error);
      throw error;
    }
  },

  // Méthodes pour les notes (grades)
  getGrades: async (evaluationId: number): Promise<Grade[]> => {
    try {
      console.log(`Fetching grades for evaluation ${evaluationId}`);
      const response = await api.get(`/evaluations/${evaluationId}/grades`);
      console.log(`${response.data.length} grades fetched successfully`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching grades for evaluation ${evaluationId}:`, error);
      throw error;
    }
  },

  createGrade: async (gradeData: NewGrade): Promise<Grade> => {
    try {
      console.log('Creating grade:', gradeData);
      const response = await api.post(`/evaluations/${gradeData.evaluationId}/grades`, gradeData);
      console.log('Grade created successfully');
      return response.data;
    } catch (error) {
      console.error('Error creating grade:', error);
      throw error;
    }
  },
  
  updateGrade: async (gradeId: number, value: number): Promise<Grade> => {
    try {
      console.log(`Updating grade ${gradeId} to value ${value}`);
      const response = await api.put(`/grades/${gradeId}`, { value });
      console.log('Grade updated successfully');
      return response.data;
    } catch (error) {
      console.error(`Error updating grade ${gradeId}:`, error);
      throw error;
    }
  },
  
  deleteGrade: async (gradeId: number): Promise<void> => {
    try {
      console.log(`Deleting grade ${gradeId}`);
      await api.delete(`/grades/${gradeId}`);
      console.log('Grade deleted successfully');
    } catch (error) {
      console.error(`Error deleting grade ${gradeId}:`, error);
      throw error;
    }
  },

  // Méthodes pour les commentaires
  getComments: async (evaluationId: number): Promise<Comment[]> => {
    try {
      console.log(`Fetching comments for evaluation ${evaluationId}`);
      const response = await api.get(`/evaluations/${evaluationId}/comments`);
      console.log(`${response.data.length} comments fetched successfully`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching comments for evaluation ${evaluationId}:`, error);
      throw error;
    }
  },

  addComment: async (evaluationId: number, text: string): Promise<Comment> => {
    try {
      console.log(`Adding comment to evaluation ${evaluationId}`);
      const response = await api.post(`/evaluations/${evaluationId}/comments`, {
        evaluationId,
        text
      });
      console.log('Comment added successfully');
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  updateComment: async (commentId: number, text: string): Promise<Comment> => {
    try {
      console.log(`Updating comment ${commentId}`);
      const response = await api.put(`/comments/${commentId}`, { text });
      console.log('Comment updated successfully');
      return response.data;
    } catch (error) {
      console.error(`Error updating comment ${commentId}:`, error);
      throw error;
    }
  },

  deleteComment: async (commentId: number): Promise<void> => {
    try {
      console.log(`Deleting comment ${commentId}`);
      await api.delete(`/comments/${commentId}`);
      console.log('Comment deleted successfully');
    } catch (error) {
      console.error(`Error deleting comment ${commentId}:`, error);
      throw error;
    }
  }
};

export default evaluationService;