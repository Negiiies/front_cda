// src/app/(dashboard)/student/dashboard/page.tsx - VERSION SIMPLIFIÉE
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../lib/auth';
import evaluationService, { Evaluation } from '../../../../services/evaluationService';
import Link from 'next/link';
import { 
  DocumentTextIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  TrophyIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState({
    pendingEvaluations: 0,
    completedEvaluations: 0,
    averageScore: 0,
    recentEvaluations: [] as Evaluation[]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const evalData = await evaluationService.getEvaluations();
        const studentEvaluations = evalData.filter(evaluation => 
          evaluation.status === 'published' || evaluation.status === 'archived'
        );
        
        setEvaluations(studentEvaluations);
        
        // Calculer les statistiques
        const pending = studentEvaluations.filter(e => e.status === 'published').length;
        const completed = studentEvaluations.filter(e => e.status === 'archived').length;
        const recent = studentEvaluations.slice(0, 3);
        
        // Calculer la moyenne
        let totalPercentage = 0;
        let evaluationsWithGrades = 0;
        
        studentEvaluations.forEach(evaluation => {
          if (evaluation.grades && evaluation.grades.length > 0) {
            const totalPoints = evaluation.grades.reduce((sum, grade) => sum + grade.value, 0);
            const maxPoints = evaluation.grades.reduce(
              (sum, grade) => sum + (grade.criteria?.maxPoints || 0), 
              0
            );
            
            if (maxPoints > 0) {
              totalPercentage += (totalPoints / maxPoints) * 100;
              evaluationsWithGrades++;
            }
          }
        });
        
        const avgScore = evaluationsWithGrades > 0 
          ? Math.round(totalPercentage / evaluationsWithGrades) 
          : 0;
        
        setStats({
          pendingEvaluations: pending,
          completedEvaluations: completed,
          averageScore: avgScore,
          recentEvaluations: recent
        });
        
      } catch (err) {
        console.error('Erreur:', err);
        setError('Impossible de charger vos données.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Bienvenue */}
      <div className="bg-[#138784] rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Bonjour {user?.name?.split(' ')[0] || 'Étudiant'} ! 👋
        </h1>
        <p className="text-green-100">
          Voici un aperçu de vos évaluations récentes.
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Nouvelles évaluations</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingEvaluations}</p>
            </div>
            <ClockIcon className="h-12 w-12 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Évaluations terminées</p>
              <p className="text-3xl font-bold text-green-600">{stats.completedEvaluations}</p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Moyenne générale</p>
              <p className="text-3xl font-bold text-blue-600">{stats.averageScore}%</p>
            </div>
            <TrophyIcon className="h-12 w-12 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Évaluations récentes */}
      <div className="bg-white rounded-xl shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Évaluations récentes</h2>
        </div>

        {stats.recentEvaluations.length === 0 ? (
          <div className="p-8 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune évaluation récente</h3>
            <p className="text-gray-600">
              Vos évaluations apparaîtront ici une fois publiées.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {stats.recentEvaluations.map((evaluation) => (
              <div key={evaluation.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {evaluation.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {evaluation.teacher?.name} • {new Date(evaluation.dateEval).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      evaluation.status === 'published' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {evaluation.status === 'published' ? 'Nouvelle' : 'Terminée'}
                    </span>
                    
                    <Link
                      href={`/student/evaluations/${evaluation.id}`}
                      className="px-4 py-2 bg-[#138784] text-white rounded-lg hover:bg-[#0c6460]"
                    >
                      Voir
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
        <div className="space-y-3">
          <Link
            href="/student/evaluations"
            className="flex items-center p-3 rounded-lg hover:bg-gray-50"
          >
            <DocumentTextIcon className="h-5 w-5 text-[#138784] mr-3" />
            <span className="font-medium">Consulter mes évaluations</span>
          </Link>
          <Link
            href="/student/performance"
            className="flex items-center p-3 rounded-lg hover:bg-gray-50"
          >
            <TrophyIcon className="h-5 w-5 text-[#138784] mr-3" />
            <span className="font-medium">Voir mes performances</span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center p-3 rounded-lg hover:bg-gray-50"
          >
            <AcademicCapIcon className="h-5 w-5 text-[#138784] mr-3" />
            <span className="font-medium">Modifier mon profil</span>
          </Link>
        </div>
      </div>
    </div>
  );
}