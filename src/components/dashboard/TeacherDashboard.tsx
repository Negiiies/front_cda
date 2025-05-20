// src/components/dashboard/TeacherDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { DocumentTextIcon, ClockIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import evaluationService, { Evaluation } from '../../services/evaluationService';
import Link from 'next/link';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useAuth } from '../../lib/auth';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    ongoingEvaluations: 0,
    pendingEvaluations: 0,
    unreadMessages: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentEvaluations, setRecentEvaluations] = useState<Evaluation[]>([]);
  
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // Récupérer les évaluations
        const evaluations = await evaluationService.getEvaluations();
        
        // Calculer les statistiques
        const ongoing = evaluations.filter(evaluation => evaluation.status === 'draft').length;
        
        // Correction pour éviter l'erreur TypeScript
        const toGrade = evaluations.filter(evaluation => {
          // Vérifier si grades existe et si sa longueur est inférieure au nombre de critères
          const gradesCount = evaluation.grades?.length || 0;
          const criteriaCount = evaluation.scale?.criteria?.length || 0;
          return evaluation.status === 'draft' && gradesCount < criteriaCount && criteriaCount > 0;
        }).length;
        
        setStats({
          ongoingEvaluations: ongoing,
          pendingEvaluations: toGrade,
          unreadMessages: 3 // Placeholder - à remplacer par une vraie API
        });
        
        // Récupérer les 5 évaluations les plus récentes
        const recent = [...evaluations]
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5);
          
        setRecentEvaluations(recent);
      } catch (err) {
        console.error("Erreur lors du chargement des données du dashboard:", err);
        setError("Impossible de charger les données du tableau de bord");
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  // Définition des cartes statistiques
  const statCards = [
    {
      title: 'Évaluations en cours',
      value: stats.ongoingEvaluations,
      icon: <DocumentTextIcon className="h-16 w-16 text-green-500" />,
      color: 'green',
      link: '/evaluations?status=draft'
    },
    {
      title: 'À noter',
      value: stats.pendingEvaluations,
      icon: <ClockIcon className="h-16 w-16 text-orange-500" />,
      color: 'orange',
      link: '/evaluations?needsGrading=true'
    },
    {
      title: 'Messages non lus',
      value: stats.unreadMessages,
      icon: <ChatBubbleLeftIcon className="h-16 w-16 text-purple-500" />,
      color: 'purple',
      link: '/messages'
    }
  ];

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement du tableau de bord..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <Link href={card.link} key={index} className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow duration-300 h-full">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gray-500 text-base">{card.title}</h3>
                  {/* Utilisation de la couleur de l'École 89 pour une meilleure visibilité */}
                  <p className="text-5xl font-bold mt-3 mb-2 text-[#138784]">{card.value}</p>
                </div>
                <div>
                  {card.icon}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Évaluations récentes */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          {/* Rendre ce titre visible avec la couleur de l'École 89 */}
          <h2 className="text-xl font-semibold text-[#138784]">Évaluations récentes</h2>
          <Link href="/evaluations" className="text-[#138784] hover:underline">
            Voir toutes
          </Link>
        </div>
        
        {recentEvaluations.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucune évaluation récente</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Étudiant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentEvaluations.map((evaluation) => (
                  <tr key={evaluation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/evaluations/${evaluation.id}`} className="text-[#138784] hover:underline">
                        {evaluation.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                      {evaluation.student?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                      {new Date(evaluation.dateEval).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${evaluation.status === 'published' ? 'bg-green-100 text-green-800' : 
                          evaluation.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {evaluation.status === 'published' ? 'Publiée' : 
                         evaluation.status === 'draft' ? 'Brouillon' : 'Archivée'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Section À faire cette semaine */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Rendre ce titre visible avec la couleur de l'École 89 */}
        <h2 className="text-xl font-semibold mb-4 text-[#138784]">À faire cette semaine</h2>
        <div className="space-y-4">
          <div className="flex items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div className="mr-4 bg-orange-100 p-2 rounded-full">
              <ClockIcon className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="font-medium">Évaluations à terminer</p>
              <p className="text-sm text-gray-600">Vous avez {stats.pendingEvaluations} évaluations à noter</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-100">
            <div className="mr-4 bg-purple-100 p-2 rounded-full">
              <ChatBubbleLeftIcon className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="font-medium">Messages en attente</p>
              <p className="text-sm text-gray-600">{stats.unreadMessages} messages nécessitent votre attention</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}