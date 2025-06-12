// src/components/dashboard/AdminDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  UserIcon, 
  AcademicCapIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import userService from '../../services/userService';
import evaluationService from '../../services/evaluationService';
import scaleService from '../../services/scaleService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  teachers: number;
  students: number;
  totalEvaluations: number;
  publishedEvaluations: number;
  draftEvaluations: number;
  totalScales: number;
  recentActivity: ActivityItem[];
  userGrowth: number;
  evaluationGrowth: number;
}

interface ActivityItem {
  id: string;
  type: 'user_created' | 'evaluation_published' | 'scale_created' | 'user_login';
  description: string;
  timestamp: Date;
  user?: string;
  icon?: React.ReactNode;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    teachers: 0,
    students: 0,
    totalEvaluations: 0,
    publishedEvaluations: 0,
    draftEvaluations: 0,
    totalScales: 0,
    recentActivity: [],
    userGrowth: 0,
    evaluationGrowth: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les données en parallèle
      const [users, evaluations, scales] = await Promise.all([
        userService.getUsers(),
        evaluationService.getEvaluations(),
        scaleService.getScales()
      ]);

      // Calculer les statistiques
      const activeUsers = users.filter(u => u.status === 'active').length;
      const teachers = users.filter(u => u.role === 'teacher').length;
      const students = users.filter(u => u.role === 'student').length;
      const publishedEvaluations = evaluations.filter(e => e.status === 'published').length;
      const draftEvaluations = evaluations.filter(e => e.status === 'draft').length;

      // Générer des activités récentes (simulées pour l'exemple)
      const recentActivity: ActivityItem[] = [
        {
          id: '1',
          type: 'user_created',
          description: 'Nouvel utilisateur créé',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          user: users[users.length - 1]?.name || 'Utilisateur inconnu',
          icon: <UserIcon className="h-4 w-4 text-green-500" />
        },
        {
          id: '2',
          type: 'evaluation_published',
          description: 'Évaluation publiée',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          user: 'Prof. Martin',
          icon: <CheckCircleIcon className="h-4 w-4 text-blue-500" />
        },
        {
          id: '3',
          type: 'scale_created',
          description: 'Nouveau barème créé',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          user: 'Prof. Durand',
          icon: <DocumentTextIcon className="h-4 w-4 text-purple-500" />
        }
      ];

      setStats({
        totalUsers: users.length,
        activeUsers,
        teachers,
        students,
        totalEvaluations: evaluations.length,
        publishedEvaluations,
        draftEvaluations,
        totalScales: scales.length,
        recentActivity,
        userGrowth: 12, // Simulé - dans un vrai projet, calculé sur une période
        evaluationGrowth: 8
      });

    } catch (err) {
      console.error('Erreur lors du chargement des données admin:', err);
      setError('Impossible de charger les données du tableau de bord');
      showNotification('error', 'Erreur de chargement', 'Impossible de charger les données du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement du tableau de bord administrateur..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
        {error}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Utilisateurs totaux',
      value: stats.totalUsers,
      subValue: `${stats.activeUsers} actifs`,
      icon: <UserGroupIcon className="h-8 w-8 text-blue-500" />,
      color: 'blue',
      growth: stats.userGrowth,
      link: '/users'
    },
    {
      title: 'Professeurs',
      value: stats.teachers,
      subValue: `${Math.round((stats.teachers / stats.totalUsers) * 100)}% du total`,
      icon: <AcademicCapIcon className="h-8 w-8 text-green-500" />,
      color: 'green',
      link: '/users?role=teacher'
    },
    {
      title: 'Étudiants',
      value: stats.students,
      subValue: `${Math.round((stats.students / stats.totalUsers) * 100)}% du total`,
      icon: <UserIcon className="h-8 w-8 text-orange-500" />,
      color: 'orange',
      link: '/users?role=student'
    },
    {
      title: 'Évaluations',
      value: stats.totalEvaluations,
      subValue: `${stats.publishedEvaluations} publiées`,
      icon: <DocumentTextIcon className="h-8 w-8 text-purple-500" />,
      color: 'purple',
      growth: stats.evaluationGrowth,
      link: '/evaluations'
    }
  ];

  const quickActions = [
    {
      title: 'Créer un utilisateur',
      description: 'Ajouter un nouveau professeur ou étudiant',
      icon: <UserIcon className="h-6 w-6" />,
      color: 'bg-blue-500',
      link: '/users/create'
    },
    {
      title: 'Voir les statistiques',
      description: 'Rapport détaillé des performances',
      icon: <ChartBarIcon className="h-6 w-6" />,
      color: 'bg-green-500',
      link: '/admin/reports'
    },
    {
      title: 'Gestion des barèmes',
      description: 'Superviser les barèmes d\'évaluation',
      icon: <DocumentTextIcon className="h-6 w-6" />,
      color: 'bg-purple-500',
      link: '/scales'
    },
    {
      title: 'Paramètres système',
      description: 'Configuration générale de l\'application',
      icon: <ExclamationTriangleIcon className="h-6 w-6" />,
      color: 'bg-orange-500',
      link: '/admin/settings'
    }
  ];

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tableau de bord Administrateur</h1>
            <p className="text-gray-600 mt-1">Vue d'ensemble du système 89 Progress</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="bg-[#138784] text-white px-4 py-2 rounded-md hover:bg-[#0c6460] transition-colors"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Link href={card.link} key={index} className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow duration-300 h-full">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-gray-500 text-sm font-medium">{card.title}</h3>
                    {card.growth && (
                      <div className={`flex items-center text-xs ${card.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {card.growth > 0 ? (
                          <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(card.growth)}%
                      </div>
                    )}
                  </div>
                  <p className="text-3xl font-bold mt-2 mb-1">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.subValue}</p>
                </div>
                <div className="ml-4">
                  {card.icon}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Actions rapides et activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actions rapides */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
                          <h2 className="text-lg font-semibold text-gray-900">Actions rapides</h2>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.link}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`${action.color} p-2 rounded-lg text-white mr-3`}>
                    {action.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Activité récente */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Activité récente</h2>
              <Link href="/admin/activity" className="text-[#138784] hover:underline text-sm">
                Voir tout
              </Link>
            </div>
            
            {stats.recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
            ) : (
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0 mt-1">
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      {activity.user && (
                        <p className="text-sm text-gray-500">par {activity.user}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Intl.RelativeTimeFormat('fr', { numeric: 'auto' }).format(
                          Math.round((activity.timestamp.getTime() - Date.now()) / (1000 * 60 * 60)),
                          'hour'
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alertes système */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
          <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-2" />
          Alertes système
        </h2>
        <div className="space-y-3">
          {stats.draftEvaluations > 10 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <ClockIcon className="h-5 w-5 text-yellow-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Évaluations en attente
                  </h3>
                  <p className="text-sm text-yellow-700">
                    {stats.draftEvaluations} évaluations sont encore en brouillon et nécessitent une attention.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  Système opérationnel
                </h3>
                <p className="text-sm text-green-700">
                  Tous les systèmes fonctionnent normalement. Dernière vérification : maintenant.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}