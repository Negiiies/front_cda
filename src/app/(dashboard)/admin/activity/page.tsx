// src/app/(dashboard)/admin/activity/page.tsx
'use client';

import { useState, useEffect } from 'react';
import RoleGuard from '../../../../components/auth/RoleGuard';
import { useNotification } from '../../../../contexts/NotificationContext';
import {
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'login' | 'logout' | 'user_created' | 'user_updated' | 'user_deleted' | 'evaluation_created' | 'evaluation_published' | 'evaluation_updated' | 'scale_created' | 'scale_updated' | 'grade_added' | 'comment_added' | 'system_error' | 'backup_completed';
  user: {
    id: number;
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
  };
  description: string;
  details?: string;
  ip?: string;
  status: 'success' | 'warning' | 'error';
  metadata?: Record<string, any>;
}

export default function AdminActivityPage() {
  const { showNotification } = useNotification();
  
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    fetchActivities();
    
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, [dateFilter]);

  const fetchActivities = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setRefreshing(!showLoading);
      
      // Simulation des données d'activité - dans un vrai projet, appeler l'API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockActivities: ActivityLog[] = generateMockActivities();
      setActivities(mockActivities);
      
    } catch (err) {
      console.error('Erreur lors du chargement des activités:', err);
      setError('Impossible de charger les activités système');
      showNotification('error', 'Erreur de chargement', 'Impossible de charger les activités système');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateMockActivities = (): ActivityLog[] => {
    const activities: ActivityLog[] = [];
    const now = new Date();
    
    // Types d'activités avec leurs configurations
    const activityTypes = [
      { type: 'login', description: 'Connexion utilisateur', status: 'success' },
      { type: 'logout', description: 'Déconnexion utilisateur', status: 'success' },
      { type: 'user_created', description: 'Nouvel utilisateur créé', status: 'success' },
      { type: 'evaluation_published', description: 'Évaluation publiée', status: 'success' },
      { type: 'scale_created', description: 'Nouveau barème créé', status: 'success' },
      { type: 'grade_added', description: 'Note ajoutée', status: 'success' },
      { type: 'system_error', description: 'Erreur système détectée', status: 'error' },
      { type: 'backup_completed', description: 'Sauvegarde terminée', status: 'success' }
    ];
    
    const users = [
      { id: 1, name: 'Prof. Martin', email: 'martin@school.com', role: 'teacher' as const },
      { id: 2, name: 'Alice Dupont', email: 'alice@school.com', role: 'student' as const },
      { id: 3, name: 'Admin Système', email: 'admin@school.com', role: 'admin' as const },
      { id: 4, name: 'Prof. Durand', email: 'durand@school.com', role: 'teacher' as const }
    ];

    // Générer 100 activités factices
    for (let i = 0; i < 100; i++) {
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const minutesAgo = Math.floor(Math.random() * 2880); // 2 jours en minutes
      
      activities.push({
        id: `activity_${i}`,
        timestamp: new Date(now.getTime() - minutesAgo * 60 * 1000),
        type: activityType.type as any,
        user,
        description: activityType.description,
        details: `Détails de l'action ${i + 1}`,
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        status: activityType.status as any,
        metadata: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          sessionId: `session_${Math.random().toString(36).substr(2, 9)}`
        }
      });
    }
    
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const getActivityIcon = (type: string, status: string) => {
    const iconClass = "h-5 w-5";
    
    switch (type) {
      case 'login':
      case 'logout':
        return <UserIcon className={`${iconClass} text-blue-500`} />;
      case 'user_created':
      case 'user_updated':
      case 'user_deleted':
        return <UserIcon className={`${iconClass} text-green-500`} />;
      case 'evaluation_created':
      case 'evaluation_published':
      case 'evaluation_updated':
        return <AcademicCapIcon className={`${iconClass} text-purple-500`} />;
      case 'scale_created':
      case 'scale_updated':
        return <DocumentTextIcon className={`${iconClass} text-indigo-500`} />;
      case 'system_error':
        return <XCircleIcon className={`${iconClass} text-red-500`} />;
      case 'backup_completed':
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />;
      default:
        return <ClockIcon className={`${iconClass} text-gray-500`} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Succès</span>;
      case 'warning':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Avertissement</span>;
      case 'error':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Erreur</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Inconnu</span>;
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)} j`;
  };

  // Filtrer les activités
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || activity.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || activity.status === selectedStatus;
    const matchesUser = selectedUser === 'all' || activity.user.id.toString() === selectedUser;
    
    // Filtre de date
    const now = new Date();
    let matchesDate = true;
    
    switch (dateFilter) {
      case 'today':
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        matchesDate = activity.timestamp >= startOfDay;
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = activity.timestamp >= weekAgo;
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = activity.timestamp >= monthAgo;
        break;
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesUser && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const uniqueUsers = [...new Set(activities.map(a => a.user))].slice(0, 10);

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement des activités système..." />;
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activité Système</h1>
            <p className="text-gray-600 mt-1">Suivi en temps réel des actions utilisateurs</p>
          </div>
          
          <button
            onClick={() => fetchActivities(false)}
            disabled={refreshing}
            className="bg-[#138784] text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-[#0c6460] disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="font-medium">Actualiser</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{activities.filter(a => a.status === 'success').length}</p>
                <p className="text-sm text-gray-600 font-medium">Succès</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{activities.filter(a => a.status === 'warning').length}</p>
                <p className="text-sm text-gray-600 font-medium">Avertissements</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{activities.filter(a => a.status === 'error').length}</p>
                <p className="text-sm text-gray-600 font-medium">Erreurs</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{uniqueUsers.length}</p>
                <p className="text-sm text-gray-600 font-medium">Utilisateurs actifs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784] text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784] text-gray-900 bg-white"
            >
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="all">Toutes les dates</option>
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784] text-gray-900 bg-white"
            >
              <option value="all">Tous les types</option>
              <option value="login">Connexions</option>
              <option value="user_created">Créations utilisateur</option>
              <option value="evaluation_published">Évaluations</option>
              <option value="system_error">Erreurs système</option>
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784] text-gray-900 bg-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="success">Succès</option>
              <option value="warning">Avertissement</option>
              <option value="error">Erreur</option>
            </select>
            
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784] text-gray-900 bg-white"
            >
              <option value="all">Tous les utilisateurs</option>
              {uniqueUsers.map(user => (
                <option key={user.id} value={user.id.toString()}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Liste des activités */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Activités récentes ({filteredActivities.length})
            </h2>
          </div>
          
          {paginatedActivities.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 font-medium">Aucune activité ne correspond aux critères sélectionnés.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {paginatedActivities.map((activity) => (
                  <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type, activity.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {activity.description}
                            </p>
                            <p className="text-sm text-gray-500">
                              par <span className="font-medium text-gray-700">{activity.user.name}</span> ({activity.user.role})
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(activity.status)}
                            <span className="text-xs text-gray-500 font-medium">
                              {formatRelativeTime(activity.timestamp)}
                            </span>
                          </div>
                        </div>
                        
                        {activity.details && (
                          <p className="mt-1 text-xs text-gray-400">
                            {activity.details}
                          </p>
                        )}
                        
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-400">
                          <span><strong>IP:</strong> {activity.ip}</span>
                          <span><strong>Date:</strong> {activity.timestamp.toLocaleString('fr-FR')}</span>
                          {activity.metadata?.sessionId && (
                            <span><strong>Session:</strong> {activity.metadata.sessionId}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Affichage de <span className="font-medium text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="font-medium text-gray-700">{Math.min(currentPage * itemsPerPage, filteredActivities.length)}</span> sur <span className="font-medium text-gray-700">{filteredActivities.length}</span> activités
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Précédent
                    </button>
                    
                    <span className="px-3 py-1 text-sm text-gray-700 font-medium">
                      Page {currentPage} sur {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}