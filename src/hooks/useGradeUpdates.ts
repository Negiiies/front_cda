// src/hooks/useGradeUpdates.ts
import { useState, useEffect, useCallback } from 'react';
import evaluationService, { Evaluation, Grade } from '../services/evaluationService';

interface UseGradeUpdatesOptions {
  evaluationId: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onUpdate?: (evaluation: Evaluation) => void;
  onError?: (error: Error) => void;
}

interface UseGradeUpdatesReturn {
  evaluation: Evaluation | null;
  grades: Grade[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  clearError: () => void;
  lastUpdated: Date | null;
}

export default function useGradeUpdates({
  evaluationId,
  autoRefresh = false,
  refreshInterval = 10000, // 10 secondes par défaut
  onUpdate,
  onError
}: UseGradeUpdatesOptions): UseGradeUpdatesReturn {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchEvaluationData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('🔄 Chargement évaluation:', evaluationId, isRefresh ? '(refresh)' : '(initial)');

      // Charger l'évaluation complète
      const evalData = await evaluationService.getEvaluationById(evaluationId);
      
      if (!evalData) {
        throw new Error('Évaluation introuvable');
      }

      // Extraire les notes
      const currentGrades = evalData.grades || [];
      
      console.log('✅ Données chargées:', {
        evaluationId: evalData.id,
        title: evalData.title,
        gradesCount: currentGrades.length,
        status: evalData.status
      });

      setEvaluation(evalData);
      setGrades(currentGrades);
      setLastUpdated(new Date());
      setError(null);

      // Notifier le parent
      if (onUpdate) {
        onUpdate(evalData);
      }

    } catch (err: any) {
      console.error('❌ Erreur chargement évaluation:', err);
      const errorMessage = err.message || 'Erreur lors du chargement';
      setError(errorMessage);
      
      if (onError) {
        onError(new Error(errorMessage));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [evaluationId, onUpdate, onError]);

  const refresh = useCallback(async () => {
    await fetchEvaluationData(true);
  }, [fetchEvaluationData]);

  // Chargement initial
  useEffect(() => {
    if (evaluationId) {
      fetchEvaluationData(false);
    }
  }, [evaluationId, fetchEvaluationData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !evaluationId) return;

    console.log('🔄 Auto-refresh activé:', refreshInterval + 'ms');
    
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh déclenché');
      fetchEvaluationData(true);
    }, refreshInterval);

    return () => {
      console.log('🛑 Auto-refresh arrêté');
      clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, evaluationId, fetchEvaluationData]);

  return {
    evaluation,
    grades,
    loading,
    refreshing,
    error,
    refresh,
    clearError,
    lastUpdated
  };
}