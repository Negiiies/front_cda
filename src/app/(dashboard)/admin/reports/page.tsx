// src/app/(dashboard)/admin/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../lib/auth';
import RoleGuard from '../../../../components/auth/RoleGuard';
import { 
  ChartBarIcon, 
  DocumentArrowDownIcon, 
  CalendarDaysIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import userService from '../../../../services/userService';
import evaluationService from '../../../../services/evaluationService';
import scaleService from '../../../../services/scaleService';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

interface ReportData {
  userStats: {
    totalUsers: number;
    newUsersThisMonth: number;
    activeUsers: number;
    usersByRole: { role: string; count: number }[];
  };
  evaluationStats: {
    totalEvaluations: number;
    evaluationsThisMonth: number;
    averageGrade: number;
    evaluationsByStatus: { status: string; count: number }[];
    evaluationsByMonth: { month: string; count: number }[];
  };
  scaleStats: {
    totalScales: number;
    scalesThisMonth: number;
    mostUsedScales: { name: string; usage: number }[];
  };
}

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      const [users, evaluations, scales] = await Promise.all([
        userService.getUsers(),
        evaluationService.getEvaluations(),
        scaleService.getScales()
      ]);

      // Calculer les statistiques
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      // Stats utilisateurs
      const newUsersThisMonth = users.filter(u => 
        new Date(u.createdAt!) >= startOfMonth
      ).length;
      
      const activeUsers = users.filter(u => u.status === 'active').length;
      
      const usersByRole = [
        { role: 'Étudiants', count: users.filter(u => u.role === 'student').length },
        { role: 'Professeurs', count: users.filter(u => u.role === 'teacher').length },
        { role: 'Administrateurs', count: users.filter(u => u.role === 'admin').length }
      ];

      // Stats évaluations
      const evaluationsThisMonth = evaluations.filter(e => 
        new Date(e.createdAt) >= startOfMonth
      ).length;

      const evaluationsByStatus = [
        { status: 'Brouillon', count: evaluations.filter(e => e.status === 'draft').length },
        { status: 'Publiées', count: evaluations.filter(e => e.status === 'published').length },
        { status: 'Archivées', count: evaluations.filter(e => e.status === 'archived').length }
      ];

      // Calcul de la moyenne des notes (simulé)
      const averageGrade = 14.2; // À calculer réellement depuis les grades

      // Évaluations par mois (6 derniers mois)
      const evaluationsByMonth = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
        const count = evaluations.filter(e => {
          const evalDate = new Date(e.createdAt);
          return evalDate >= monthDate && evalDate < nextMonth;
        }).length;
        
        evaluationsByMonth.push({
          month: monthDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
          count
        });
      }

      // Stats barèmes
      const scalesThisMonth = scales.filter(s => 
        new Date(s.createdAt!) >= startOfMonth
      ).length;

      // Barèmes les plus utilisés (simulé - dans un vrai projet, compter les évaluations par barème)
      const mostUsedScales = scales.slice(0, 5).map(scale => ({
        name: scale.title,
        usage: Math.floor(Math.random() * 20) + 1 // Simulé
      }));

      setReportData({
        userStats: {
          totalUsers: users.length,
          newUsersThisMonth,
          activeUsers,
          usersByRole
        },
        evaluationStats: {
          totalEvaluations: evaluations.length,
          evaluationsThisMonth,
          averageGrade,
          evaluationsByStatus,
          evaluationsByMonth
        },
        scaleStats: {
          totalScales: scales.length,
          scalesThisMonth,
          mostUsedScales
        }
      });

    } catch (err) {
      console.error('Erreur lors du chargement des rapports:', err);
      setError('Impossible de charger les données des rapports');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;
    
    // Création d'un rapport CSV simple
    const csvContent = [
      'Rapport 89Progress - ' + new Date().toLocaleDateString('fr-FR'),
      '',
      'STATISTIQUES UTILISATEURS',
      `Total utilisateurs,${reportData.userStats.totalUsers}`,
      `Nouveaux utilisateurs ce mois,${reportData.userStats.newUsersThisMonth}`,
      `Utilisateurs actifs,${reportData.userStats.activeUsers}`,
      '',
      'RÉPARTITION PAR RÔLES',
      ...reportData.userStats.usersByRole.map(item => `${item.role},${item.count}`),
      '',
      'STATISTIQUES ÉVALUATIONS',
      `Total évaluations,${reportData.evaluationStats.totalEvaluations}`,
      `Évaluations ce mois,${reportData.evaluationStats.evaluationsThisMonth}`,
      `Note moyenne,${reportData.evaluationStats.averageGrade}`,
      '',
      'RÉPARTITION PAR STATUT',
      ...reportData.evaluationStats.evaluationsByStatus.map(item => `${item.status},${item.count}`),
      '',
      'STATISTIQUES BARÈMES',
      `Total barèmes,${reportData.scaleStats.totalScales}`,
      `Nouveaux barèmes ce mois,${reportData.scaleStats.scalesThisMonth}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport-89progress-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement des rapports..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (!reportData) return null;

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Rapports et Statistiques</h1>
            <p className="text-gray-600">Analyse détaillée des performances du système</p>
          </div>
          
          <div className="flex space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
            
            <button
              onClick={exportReport}
              className="bg-[#138784] text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-[#0c6460]"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              <span>Exporter CSV</span>
            </button>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{reportData.userStats.totalUsers}</h3>
                <p className="text-sm text-gray-600">Utilisateurs totaux</p>
                <p className="text-xs text-green-600">+{reportData.userStats.newUsersThisMonth} ce mois</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <AcademicCapIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{reportData.evaluationStats.totalEvaluations}</h3>
                <p className="text-sm text-gray-600">Évaluations totales</p>
                <p className="text-xs text-green-600">+{reportData.evaluationStats.evaluationsThisMonth} ce mois</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{reportData.evaluationStats.averageGrade}/20</h3>
                <p className="text-sm text-gray-600">Note moyenne</p>
                <p className="text-xs text-gray-500">Toutes évaluations</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{reportData.userStats.activeUsers}</h3>
                <p className="text-sm text-gray-600">Utilisateurs actifs</p>
                <p className="text-xs text-gray-500">{Math.round((reportData.userStats.activeUsers / reportData.userStats.totalUsers) * 100)}% du total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques et données détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Répartition des utilisateurs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Répartition des utilisateurs</h2>
            <div className="space-y-4">
              {reportData.userStats.usersByRole.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.role}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(item.count / reportData.userStats.totalUsers) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statut des évaluations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statut des évaluations</h2>
            <div className="space-y-4">
              {reportData.evaluationStats.evaluationsByStatus.map((item, index) => {
                const colors = ['bg-yellow-500', 'bg-green-500', 'bg-gray-500'];
                return (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.status}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className={`${colors[index]} h-2 rounded-full`}
                          style={{ width: `${(item.count / reportData.evaluationStats.totalEvaluations) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Évolution des évaluations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Évolution des évaluations (6 derniers mois)</h2>
          <div className="mt-4">
            <div className="flex items-end space-x-2 h-48">
              {reportData.evaluationStats.evaluationsByMonth.map((item, index) => {
                const maxCount = Math.max(...reportData.evaluationStats.evaluationsByMonth.map(i => i.count));
                const height = maxCount > 0 ? (item.count / maxCount) * 160 : 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="bg-[#138784] rounded-t w-full flex items-end justify-center text-white text-xs pb-1"
                      style={{ height: `${Math.max(height, 20)}px` }}
                    >
                      {item.count > 0 && item.count}
                    </div>
                    <span className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-top-left">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Barèmes les plus utilisés */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Barèmes les plus utilisés</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom du barème
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Popularité
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.scaleStats.mostUsedScales.map((scale, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {scale.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {scale.usage}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-[#138784] h-2 rounded-full" 
                            style={{ width: `${(scale.usage / Math.max(...reportData.scaleStats.mostUsedScales.map(s => s.usage))) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {Math.round((scale.usage / Math.max(...reportData.scaleStats.mostUsedScales.map(s => s.usage))) * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Résumé et recommandations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Résumé et Recommandations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Points forts</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {reportData.userStats.activeUsers} utilisateurs actifs sur {reportData.userStats.totalUsers} inscrits</li>
                <li>• {reportData.evaluationStats.evaluationsThisMonth} nouvelles évaluations ce mois</li>
                <li>• Note moyenne de {reportData.evaluationStats.averageGrade}/20 maintenue</li>
                <li>• {reportData.scaleStats.totalScales} barèmes disponibles pour les évaluations</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Améliorations suggérées</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {reportData.evaluationStats.evaluationsByStatus.find(s => s.status === 'Brouillon')!.count > 5 && (
                  <li>• Encourager la publication des {reportData.evaluationStats.evaluationsByStatus.find(s => s.status === 'Brouillon')!.count} évaluations en brouillon</li>
                )}
                <li>• Organiser des formations pour les nouveaux utilisateurs</li>
                <li>• Promouvoir les barèmes les moins utilisés</li>
                <li>• Mettre en place un système de notifications automatiques</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}