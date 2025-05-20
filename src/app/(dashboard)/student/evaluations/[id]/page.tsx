// src/app/(dashboard)/student/evaluations/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../lib/auth';
import evaluationService, { Evaluation } from '../../../../../services/evaluationService';
import StudentEvaluationDetail from '../../../../../components/evaluations/StudentEvaluationDetail';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../../../../components/ui/LoadingSpinner';
import { useNotification } from '../../../../../contexts/NotificationContext';
import RoleGuard from '../../../../../components/auth/RoleGuard';

export default function StudentEvaluationPage() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const params = useParams();
  const router = useRouter();
  
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const evaluationId = Number(params.id);

  useEffect(() => {
    if (!evaluationId) return;
    
    const fetchEvaluation = async () => {
      try {
        setLoading(true);
        const data = await evaluationService.getEvaluationById(evaluationId);
        
        // Vérifier si l'étudiant a accès à cette évaluation
        if (user?.role === 'student' && data.studentId !== user.userId) {
          showNotification('error', 'Accès non autorisé', 'Vous n\'avez pas accès à cette évaluation.');
          router.push('/dashboard');
          return;
        }
        
        // Vérifier si l'évaluation est publiée pour les étudiants
        if (user?.role === 'student' && data.status === 'draft') {
          showNotification('warning', 'Évaluation non disponible', 'Cette évaluation n\'est pas encore publiée.');
          router.push('/dashboard');
          return;
        }
        
        setEvaluation(data);
      } catch (err) {
        console.error('Erreur lors du chargement de l\'évaluation', err);
        setError('Impossible de charger les détails de cette évaluation.');
        showNotification('error', 'Erreur de chargement', 'Impossible de charger les détails de cette évaluation.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [evaluationId, router, showNotification, user]);

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement de l'évaluation..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
        {error}
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['student', 'teacher', 'admin']}>
      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-6">
          <Link href="/evaluations" className="text-gray-600 hover:text-gray-900">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Détail de l'évaluation</h1>
        </div>
        
        {evaluation ? (
          <StudentEvaluationDetail evaluation={evaluation} />
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-6">
            Évaluation non trouvée ou inaccessible.
          </div>
        )}
      </div>
    </RoleGuard>
  );
}