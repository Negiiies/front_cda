// src/components/dashboard/StudentDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { DocumentTextIcon, ClockIcon, CheckCircleIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../lib/auth';
import evaluationService, { Evaluation } from '../../services/evaluationService';
import StudentEvaluationsTable from '../evaluations/StudentEvaluationsTable';
import Link from 'next/link';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState({
    pendingEvaluations: 0,
    completedEvaluations: 0,
    averageScore: 0,
    unreadMessages: 0
  });

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        
        // Récupérer les évaluations de l'étudiant
        let evalData = await evaluationService.getEvaluations();
        
        // Filtrer pour les évaluations publiées/archivées
        evalData = evalData.filter(evaluation => 
          evaluation.status === 'published' || evaluation.status === 'archived'
        );
        
        setEvaluations(evalData);
        
        // Calculer les statistiques
        const pending = evalData.filter(evaluation => evaluation.status === 'published').length;
        const completed = evalData.filter(evaluation => evaluation.status === 'archived').length;
        
        // Calculer la note moyenne en pourcentage
        let totalPercentage = 0;
        let evaluationsWithGrades = 0;
        
        evalData.forEach(evaluation => {
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
        
        // Mettre à jour les stats
        setStats({
          pendingEvaluations: pending,
          completedEvaluations: completed,
          averageScore: avgScore,
          unreadMessages: 3 // Placeholder - à remplacer par une API réelle
        });
        
      } catch (err) {
        console.error('Erreur lors du chargement des évaluations', err);
        setError('Impossible de charger vos évaluations. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvaluations();
  }, [user]);
  
  const statCards = [
    {
      title: 'Évaluations publiées',
      value: stats.pendingEvaluations,
      icon: <ClockIcon className="h-12 w-12 text-orange-500" />,
      color: 'orange',
      link: '/evaluations?status=published'
    },
    {
      title: 'Évaluations archivées',
      value: stats.completedEvaluations,
      icon: <CheckCircleIcon className="h-12 w-12 text-green-500" />,
      color: 'green',
      link: '/evaluations?status=archived'
    },
    {
      title: 'Note moyenne',
      value: `${stats.averageScore}%`,
      icon: <DocumentTextIcon className="h-12 w-12 text-blue-500" />,
      color: 'blue',
      link: '/student/performance'
    },
    {
      title: 'Messages non lus',
      value: stats.unreadMessages,
      icon: <ChatBubbleLeftIcon className="h-12 w-12 text-purple-500" />,
      color: 'purple',
      link: '/messages'
    }
  ];

  // Fonction pour obtenir une classe de couleur en fonction du score
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Récupérer les 5 dernières évaluations
  const recentEvaluations = [...evaluations]
    .sort((a, b) => new Date(b.dateEval).getTime() - new Date(a.dateEval).getTime())
    .slice(0, 5);

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement de votre tableau de bord..." />;
  }

  return (
    <div className="space-y-8">
      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Link href={card.link} key={index} className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gray-500 text-sm">{card.title}</h3>
                  <p className={`text-4xl font-bold mt-2 ${
                    card.title === 'Note moyenne' ? getScoreColorClass(stats.averageScore) : ''
                  }`}>{card.value}</p>
                </div>
                <div>
                  {card.icon}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Graphique de progression - Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Ma progression</h2>
          <Link href="/student/performance" className="text-[#138784] hover:underline text-sm">
            Voir toutes les statistiques
          </Link>
        </div>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">
            Le graphique de progression sera disponible prochainement.
          </p>
        </div>
      </div>
      
      {/* Tableau des évaluations récentes */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Évaluations récentes</h2>
          <Link href="/evaluations" className="text-[#138784] hover:underline text-sm">
            Voir toutes les évaluations
          </Link>
        </div>
        
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : (
          <StudentEvaluationsTable evaluations={recentEvaluations} />
        )}
      </div>
      
      {/* Section d'alertes et conseils */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Conseils personnalisés</h2>
        <div className="space-y-4">
          {stats.averageScore < 60 ? (
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">Attention à votre moyenne</h3>
              <p className="text-yellow-700 text-sm">
                Votre note moyenne est en dessous de 60%. Pensez à revoir vos points faibles et à demander de l'aide à vos professeurs.
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">Bon travail !</h3>
              <p className="text-green-700 text-sm">
                Votre note moyenne est de {stats.averageScore}%. Continuez sur cette voie !
              </p>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Prochain cours</h3>
            <p className="text-blue-700 text-sm">
              N'oubliez pas votre prochain cours de Développement Web, le 29 avril à 14h00.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}