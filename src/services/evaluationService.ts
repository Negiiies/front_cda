// src/services/evaluationService.ts - Version finale corrigée
import api from '../lib/api';
import { Criteria } from './scaleService';
import { AxiosResponse, AxiosError } from 'axios';

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
  dateEval: Date | string;
  studentId: number | string;
  scaleId: number | string;
}

export interface NewGrade {
  evaluationId: number;
  criteriaId: number;
  value: number;
}

// ✅ Interface pour les updates de grades
export interface UpdateGradeParams {
  gradeId: number;
  evaluationId: number;
  value: number;
}

const evaluationService = {
  getEvaluations: async (filters: Record<string, any> = {}): Promise<Evaluation[]> => {
    try {
      console.log("🔍 Frontend - Fetching evaluations with filters:", filters);
      const response: AxiosResponse<Evaluation[]> = await api.get('/evaluations', { params: filters });
      console.log(`✅ Frontend - Retrieved ${response.data.length} evaluations`);
      return response.data;
    } catch (error) {
      console.error('❌ Frontend - Error fetching evaluations:', error);
      throw error;
    }
  },

  getEvaluationById: async (id: number): Promise<Evaluation> => {
    try {
      console.log(`🔍 Frontend - Fetching evaluation with ID: ${id}`);
      const response: AxiosResponse<Evaluation> = await api.get(`/evaluations/${id}`);
      console.log(`✅ Frontend - Evaluation ${id} fetched successfully`);
      return response.data;
    } catch (error) {
      console.error(`❌ Frontend - Error fetching evaluation with ID ${id}:`, error);
      throw error;
    }
  },

  createEvaluation: async (evaluationData: NewEvaluation): Promise<Evaluation> => {
    try {
      console.log('🔍 Frontend - Creating evaluation with data:', evaluationData);
      
      const payload = {
        ...evaluationData,
        studentId: Number(evaluationData.studentId),
        scaleId: Number(evaluationData.scaleId)
      };
      
      console.log('🔍 Frontend - Sending payload:', payload);
      const response: AxiosResponse<Evaluation> = await api.post('/evaluations', payload);
      console.log('✅ Frontend - Evaluation created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Frontend - Error creating evaluation:', error);
      throw error;
    }
  },

  updateEvaluation: async (id: number, evaluationData: Partial<Evaluation>): Promise<Evaluation> => {
    try {
      const formattedData: any = { ...evaluationData };
      
      if (evaluationData.dateEval) {
        formattedData.dateEval = typeof evaluationData.dateEval === 'string' 
          ? evaluationData.dateEval 
          : evaluationData.dateEval.toISOString().split('T')[0];
      }
      
      console.log(`🔍 Frontend - Updating evaluation ${id}:`, formattedData);
      const response: AxiosResponse<Evaluation> = await api.put(`/evaluations/${id}`, formattedData);
      console.log('✅ Frontend - Evaluation updated successfully');
      return response.data;
    } catch (error) {
      console.error(`❌ Frontend - Error updating evaluation ${id}:`, error);
      throw error;
    }
  },

  changeStatus: async (id: number, status: 'draft' | 'published' | 'archived'): Promise<Evaluation> => {
    try {
      console.log(`🔍 Frontend - Changing status for evaluation ${id} to ${status}`);
      
      const requestData = { status };
      console.log('🔍 Frontend - Request data:', requestData);
      console.log('🔍 Frontend - Request URL:', `/evaluations/${id}/status`);
      
      const response: AxiosResponse<Evaluation> = await api.patch(`/evaluations/${id}/status`, requestData);
      
      console.log('✅ Frontend - Status changed successfully');
      console.log('🔍 Frontend - Response data:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error(`❌ Frontend - Error changing status for evaluation ${id}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        requestData: error.config?.data
      });
      
      if (error.response?.data?.errors) {
        console.error('❌ Frontend - Validation errors:', error.response.data.errors);
      }
      
      throw error;
    }
  },

  deleteEvaluation: async (id: number): Promise<void> => {
    try {
      console.log(`🔍 Frontend - Deleting evaluation ${id}`);
      await api.delete(`/evaluations/${id}`);
      console.log('✅ Frontend - Evaluation deleted successfully');
    } catch (error) {
      console.error(`❌ Frontend - Error deleting evaluation ${id}:`, error);
      throw error;
    }
  },

  // ✅ GRADES - Version corrigée avec routes imbriquées cohérentes
  
  getGrades: async (evaluationId: number): Promise<Grade[]> => {
    try {
      console.log(`🔍 Frontend - Fetching grades for evaluation ${evaluationId}`);
      
      // ✅ Route imbriquée directe
      const response: AxiosResponse<Grade[]> = await api.get(`/evaluations/${evaluationId}/grades`);
      
      console.log(`✅ Frontend - Retrieved ${response.data.length} grades for evaluation ${evaluationId}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Frontend - Error fetching grades for evaluation ${evaluationId}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      
      // Log détaillé pour debug
      if (error.response?.status === 404) {
        console.error('❌ Frontend - Route 404: Vérifier que les routes imbriquées sont bien montées dans le backend');
      }
      if (error.response?.status === 403) {
        console.error('❌ Frontend - Accès refusé: Vérifier les permissions utilisateur');
      }
      
      throw error;
    }
  },

  // ✅ CORRECTION MAJEURE: createGrade sans evaluationId dans le body
  createGrade: async (gradeData: NewGrade): Promise<Grade> => {
    try {
      const { evaluationId, criteriaId, value } = gradeData;
      
      console.log(`🔍 Frontend - Creating grade for evaluation ${evaluationId}:`, {
        criteriaId,
        value
      });
      
      // ✅ URL imbriquée + body sans evaluationId
      const url = `/evaluations/${evaluationId}/grades`;
      const requestBody = {
        criteriaId: Number(criteriaId),  // ✅ Assurer que c'est un nombre
        value: Number(value)             // ✅ Assurer que c'est un nombre
        // ❌ evaluationId PAS dans le body car déjà dans l'URL
      };
      
      console.log(`🔍 Frontend - Request URL: ${url}`);
      console.log(`🔍 Frontend - Request body:`, requestBody);
      
      const response: AxiosResponse<Grade> = await api.post(url, requestBody);
      
      console.log(`✅ Frontend - Grade created successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Frontend - Error creating grade:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        requestData: error.config?.data
      });
      
      // Détails spécifiques pour debug
      if (error.response?.status === 404) {
        console.error('❌ Frontend - Route 404: Vérifier que POST /evaluations/:evaluationId/grades existe');
      }
      if (error.response?.status === 400) {
        console.error('❌ Frontend - Validation 400: Vérifier le validator backend et les données envoyées');
        if (error.response?.data?.errors) {
          console.error('❌ Frontend - Erreurs de validation:', error.response.data.errors);
        }
      }
      if (error.response?.status === 403) {
        console.error('❌ Frontend - Accès refusé: Vérifier que l\'utilisateur peut noter cette évaluation');
      }
      
      throw error;
    }
  },
  
  // ✅ updateGrade avec route imbriquée
  updateGrade: async (params: UpdateGradeParams): Promise<Grade> => {
    try {
      const { gradeId, evaluationId, value } = params;
      
      console.log(`🔍 Frontend - Updating grade ${gradeId} in evaluation ${evaluationId} to value ${value}`);
      
      // ✅ Route imbriquée cohérente avec le backend
      const url = `/evaluations/${evaluationId}/grades/${gradeId}`;
      const requestBody = { value: Number(value) }; // ✅ Assurer que c'est un nombre
      
      console.log(`🔍 Frontend - Request URL: ${url}`);
      console.log(`🔍 Frontend - Request body:`, requestBody);
      
      const response: AxiosResponse<Grade> = await api.put(url, requestBody);
      
      console.log(`✅ Frontend - Grade updated successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Frontend - Error updating grade:`, {
        gradeId: params.gradeId,
        evaluationId: params.evaluationId,
        value: params.value,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      
      if (error.response?.status === 404) {
        console.error('❌ Frontend - Route 404: Vérifier que PUT /evaluations/:evaluationId/grades/:id existe');
      }
      if (error.response?.status === 403) {
        console.error('❌ Frontend - Accès refusé: Vérifier que l\'utilisateur peut modifier cette note');
      }
      
      throw error;
    }
  },
  
  // ✅ deleteGrade avec route imbriquée
  deleteGrade: async (gradeId: number, evaluationId: number): Promise<void> => {
    try {
      console.log(`🔍 Frontend - Deleting grade ${gradeId} from evaluation ${evaluationId}`);
      
      // ✅ Route imbriquée cohérente avec le backend
      const url = `/evaluations/${evaluationId}/grades/${gradeId}`;
      
      console.log(`🔍 Frontend - Request URL: ${url}`);
      
      await api.delete(url);
      
      console.log(`✅ Frontend - Grade deleted successfully`);
    } catch (error: any) {
      console.error(`❌ Frontend - Error deleting grade:`, {
        gradeId,
        evaluationId,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      
      if (error.response?.status === 404) {
        console.error('❌ Frontend - Route 404: Vérifier que DELETE /evaluations/:evaluationId/grades/:id existe');
      }
      if (error.response?.status === 403) {
        console.error('❌ Frontend - Accès refusé: Vérifier que l\'utilisateur peut supprimer cette note');
      }
      
      const axiosError = error as AxiosError;
      console.error('❌ Frontend - Full error:', axiosError.response?.data || axiosError.message);
      throw error;
    }
  },

  // ✅ COMMENTAIRES - Routes déjà correctes
  
  getComments: async (evaluationId: number): Promise<Comment[]> => {
    try {
      console.log(`🔍 Frontend - Fetching comments for evaluation ${evaluationId}`);
      
      const response: AxiosResponse<Comment[]> = await api.get(`/evaluations/${evaluationId}/comments`);
      console.log(`✅ Frontend - ${response.data.length} comments fetched successfully`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Frontend - Error fetching comments for evaluation ${evaluationId}:`, error);
      const axiosError = error as AxiosError;
      console.error('❌ Frontend - Full error:', axiosError.response?.data || axiosError.message);
      throw error;
    }
  },

  addComment: async (evaluationId: number, text: string): Promise<Comment> => {
    try {
      const url = `/evaluations/${evaluationId}/comments`;
      console.log('🔍 URL EXACTE CONSTRUITE:', url);
      console.log('🔍 BASE_URL de api.ts:', api.defaults.baseURL);
      console.log('🔍 URL COMPLÈTE:', `${api.defaults.baseURL}${url}`);
      
      const response = await api.post(url, { text });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur complète:', error);
      throw error;
    }
  },

  // ✅ NOTE: updateComment et deleteComment utilisent des routes directes car les commentaires 
  // peuvent être modifiés/supprimés indépendamment de l'évaluation
  updateComment: async (commentId: number, text: string): Promise<Comment> => {
    try {
      console.log(`🔍 Frontend - Updating comment ${commentId}`);
      const response: AxiosResponse<Comment> = await api.put(`/comments/${commentId}`, { text });
      console.log('✅ Frontend - Comment updated successfully');
      return response.data;
    } catch (error: any) {
      console.error(`❌ Frontend - Error updating comment ${commentId}:`, error);
      const axiosError = error as AxiosError;
      console.error('❌ Frontend - Full error:', axiosError.response?.data || axiosError.message);
      throw error;
    }
  },

  deleteComment: async (commentId: number): Promise<void> => {
    try {
      console.log(`🔍 Frontend - Deleting comment ${commentId}`);
      await api.delete(`/comments/${commentId}`);
      console.log('✅ Frontend - Comment deleted successfully');
    } catch (error: any) {
      console.error(`❌ Frontend - Error deleting comment ${commentId}:`, error);
      const axiosError = error as AxiosError;
      console.error('❌ Frontend - Full error:', axiosError.response?.data || axiosError.message);
      throw error;
    }
  },
};

export default evaluationService;