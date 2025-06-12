// src/app/(dashboard)/student/evaluations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../lib/auth';
import { useNotification } from '../../../../contexts/NotificationContext';
import evaluationService, { Evaluation } from '../../../../services/evaluationService';
import Link from 'next/link';
import { 
  EyeIcon, 
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarIcon,
  AcademicCapIcon,
  TrophyIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

export default function StudentEvaluationsPage() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const searchParams = useSearchParams();
  
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres et tri
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams?.get('status') || 'all');
  const [sortField, setSortField] = useState<'dateEval' | 'title' | 'score'>('dateEval');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        
        // Récupérer les évaluations de l'étudiant
        let evalData = await evaluationService.getEvaluations();
        
        // Filtrer pour les évaluations publiées/archivées (élèves ne voient pas les brouillons)
        evalData = evalData.filter(evaluation => 
          evaluation.status === 'published' || evaluation.status === 'archived'
        );
        
        setEvaluations(evalData);
        
      } catch (err) {
        console.error('Erreur lors du chargement des évaluations', err);
        setError('Impossible de charger vos évaluations. Veuillez réessayer plus tard.');
        showNotification('error', 'Erreur de chargement', 'Impossible de charger vos évaluations.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvaluations();
  }, [showNotification]);

  // Calculer le score pour une évaluation
  const calculateScore = (evaluation: Evaluation): number => {
    if (!evaluation.grades || evaluation.grades.length === 0) return 0;
    
    const totalPoints = evaluation.grades.reduce((sum, grade) => sum + grade.value, 0);
    const maxPoints = evaluation.grades.reduce(
      (sum, grade) => sum + (grade.criteria?.maxPoints || 0), 
      0
    );
    
    return maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
  };

  // Fonction pour obtenir la classe de couleur en fonction du score
  const getScoreColorClass = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgClass = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Filtrer les évaluations
  const filteredEvaluations = evaluations.filter(evaluation => {
    const matchesStatus = statusFilter === 'all' || evaluation.status === statusFilter;
    const matchesSearch = !searchTerm || 
      evaluation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.teacher?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.scale?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Trier les évaluations
  const sortedEvaluations = [...filteredEvaluations].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'dateEval') {
      comparison = new Date(a.dateEval).getTime() - new Date(b.dateEval).getTime();
    } else if (sortField === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (sortField === 'score') {
      comparison = calculateScore(a) - calculateScore(b);
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement de vos évaluations..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes évaluations</h1>
          <p className="text-gray-600 mt-1">
            Consultez vos résultats et suivez votre progression
          </p>
        </div>
        
        {/* Statistiques rapides */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {evaluations.filter(e => e.status === 'published').length}
            </div>
            <div className="text-gray-600">Nouvelles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {evaluations.filter(e => e.status === 'archived').length}
            </div>
            <div className="text-gray-600">Terminées</div>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, professeur ou matière..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Bouton filtres */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FunnelIcon className="h-5 w-5" />
            <span>Filtres</span>
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {/* Filtres avancés */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-transparent"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="published">Nouvelles évaluations</option>
                  <option value="archived">Évaluations terminées</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as typeof sortField)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-transparent"
                >
                  <option value="dateEval">Date d'évaluation</option>
                  <option value="title">Titre</option>
                  <option value="score">Score</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ordre</label>
                <select
                  value={sortDirection}
                  onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-transparent"
                >
                  <option value="desc">Décroissant</option>
                  <option value="asc">Croissant</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Liste des évaluations */}
      {sortedEvaluations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' 
              ? 'Aucune évaluation trouvée' 
              : 'Aucune évaluation disponible'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all'
              ? 'Aucune évaluation ne correspond à vos critères de recherche.'
              : 'Vos évaluations apparaîtront ici une fois que vos professeurs les auront publiées.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* En-tête du tableau */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-4">
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Évaluation</span>
                  {sortField === 'title' && (
                    sortDirection === 'asc' ? 
                      <ChevronUpIcon className="h-4 w-4" /> : 
                      <ChevronDownIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="col-span-2 text-center">
                <button
                  onClick={() => handleSort('dateEval')}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Date</span>
                  {sortField === 'dateEval' && (
                    sortDirection === 'asc' ? 
                      <ChevronUpIcon className="h-4 w-4" /> : 
                      <ChevronDownIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="col-span-2">Professeur</div>
              <div className="col-span-2 text-center">
                <button
                  onClick={() => handleSort('score')}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Score</span>
                  {sortField === 'score' && (
                    sortDirection === 'asc' ? 
                      <ChevronUpIcon className="h-4 w-4" /> : 
                      <ChevronDownIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="col-span-1">Statut</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
          </div>

          {/* Corps du tableau */}
          <div className="divide-y divide-gray-200">
            {sortedEvaluations.map((evaluation) => {
              const score = calculateScore(evaluation);
              const hasGrades = evaluation.grades && evaluation.grades.length > 0;
              
              return (
                <div key={evaluation.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Titre et matière */}
                    <div className="col-span-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {evaluation.status === 'published' ? (
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          ) : (
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {evaluation.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {evaluation.scale?.title}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Date */}
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{new Date(evaluation.dateEval).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    
                    {/* Professeur */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-[#138784] rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            {evaluation.teacher?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-900 truncate">
                          {evaluation.teacher?.name}
                        </span>
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div className="col-span-2 text-center">
                      {hasGrades ? (
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreBgClass(score)}`}>
                          <TrophyIcon className="h-4 w-4 mr-1" />
                          <span className={getScoreColorClass(score)}>
                            {score}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Non noté</span>
                      )}
                    </div>
                    
                    {/* Statut */}
                    <div className="col-span-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        evaluation.status === 'published' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {evaluation.status === 'published' ? 'Nouvelle' : 'Terminée'}
                      </span>
                    </div>
                    
                    {/* Actions */}
                    <div className="col-span-1 text-right">
                      <Link
                        href={`/student/evaluations/${evaluation.id}`}
                        className="inline-flex items-center p-2 text-[#138784] hover:text-[#0c6460] hover:bg-[#138784]/10 rounded-full transition-colors"
                        title="Voir les détails"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Footer avec nombre total */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                {sortedEvaluations.length} évaluation{sortedEvaluations.length > 1 ? 's' : ''} 
                {searchTerm || statusFilter !== 'all' ? ' trouvée' + (sortedEvaluations.length > 1 ? 's' : '') : ''}
              </span>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>Nouvelles</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Terminées</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}