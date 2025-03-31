// src/components/dashboard/TeacherDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { UserGroupIcon, DocumentTextIcon, ClockIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import evaluationService, { Evaluation } from '../../services/evaluationService';
import Link from 'next/link';

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    activeClasses: 0,
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
        const ongoing = evaluations.filter(e => e.status === 'draft').length;
        
        // Correction pour éviter l'erreur TypeScript
        const toGrade = evaluations.filter(e => {
          // Vérifier si grades existe et si sa longueur est inférieure au nombre de critères
          const gradesCount = e.grades?.length || 0;
          const criteriaCount = e.scale?.criteria?.length || 0;
          return e.status === 'draft' && gradesCount < criteriaCount && criteriaCount > 0;
        }).length;
        
        setStats({
          activeClasses: 4, // Placeholder - à remplacer par une vraie API
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

  // Le reste du code reste identique...
  
  // Définition des cartes statistiques
  const statCards = [
    {
      title: 'Classes actives',
      value: stats.activeClasses,
      icon: <UserGroupIcon className="h-16 w-16 text-blue-500" />,
      color: 'blue',
      link: '/classes'
    },
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
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#138784]"></div>
      </div>
    );
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Link href={card.link} key={index} className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow duration-300 h-full">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gray-500 text-base">{card.title}</h3>
                  <p className="text-5xl font-bold mt-3 mb-2">{card.value}</p>
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
          <h2 className="text-xl font-semibold">Évaluations récentes</h2>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {evaluation.student?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
      
      {/* Section supplémentaire - À faire */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">À faire cette semaine</h2>
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
          
          <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="mr-4 bg-blue-100 p-2 rounded-full">
              <UserGroupIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">Cours à venir</p>
              <p className="text-sm text-gray-600">Prochain cours: Web Frontend le 29 mars</p>
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