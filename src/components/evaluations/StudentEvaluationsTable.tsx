// src/components/evaluations/StudentEvaluationsTable.tsx
'use client';

import React, { useState } from 'react';
import { Evaluation } from '../../services/evaluationService';
import Link from 'next/link';
import { 
  EyeIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface StudentEvaluationsTableProps {
  evaluations: Evaluation[];
  loading?: boolean;
}

export default function StudentEvaluationsTable({ 
  evaluations, 
  loading = false 
}: StudentEvaluationsTableProps) {
  const [sortField, setSortField] = useState<string>('dateEval');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Filtrer les évaluations
  const filteredEvaluations = evaluations.filter(evaluation => {
    // Filtre par statut
    if (statusFilter !== 'all' && evaluation.status !== statusFilter) {
      return false;
    }
    
    // Filtre par recherche (titre, professeur ou matière)
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        evaluation.title.toLowerCase().includes(searchTermLower) ||
        (evaluation.teacher?.name?.toLowerCase().includes(searchTermLower) || false) ||
        (evaluation.scale?.title?.toLowerCase().includes(searchTermLower) || false)
      );
    }
    
    return true;
  });
  
  // Trier les évaluations
  const sortedEvaluations = [...filteredEvaluations].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (sortField === 'dateEval') {
      comparison = new Date(a.dateEval).getTime() - new Date(b.dateEval).getTime();
    } else if (sortField === 'teacher') {
      const nameA = a.teacher?.name || '';
      const nameB = b.teacher?.name || '';
      comparison = nameA.localeCompare(nameB);
    } else if (sortField === 'status') {
      comparison = a.status.localeCompare(b.status);
    } else if (sortField === 'score') {
      // Calculer le score en pourcentage pour chaque évaluation
      const scoreA = calculateScore(a);
      const scoreB = calculateScore(b);
      comparison = scoreA - scoreB;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Fonction pour calculer le score en pourcentage pour une évaluation
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

  // Fonction pour obtenir l'URL vers le détail
  const getDetailUrl = (evaluation: Evaluation): string => {
    return `/student/evaluations/${evaluation.id}`;
  };

  // Si chargement
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Mes évaluations</h2>
        
        {/* Filtres et recherche */}
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex items-center">
            <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
            >
              <option value="all">Tous les statuts</option>
              <option value="published">Publiées</option>
              <option value="archived">Archivées</option>
            </select>
          </div>
          
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Rechercher par titre, professeur ou matière..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
            />
          </div>
        </div>
      </div>
      
      {filteredEvaluations.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          Aucune évaluation ne correspond à vos critères de recherche.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Titre</span>
                    {sortField === 'title' && (
                      sortDirection === 'asc' ? 
                        <ChevronUpIcon className="h-4 w-4" /> : 
                        <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('dateEval')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Date</span>
                    {sortField === 'dateEval' && (
                      sortDirection === 'asc' ? 
                        <ChevronUpIcon className="h-4 w-4" /> : 
                        <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('teacher')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Professeur</span>
                    {sortField === 'teacher' && (
                      sortDirection === 'asc' ? 
                        <ChevronUpIcon className="h-4 w-4" /> : 
                        <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('score')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Score</span>
                    {sortField === 'score' && (
                      sortDirection === 'asc' ? 
                        <ChevronUpIcon className="h-4 w-4" /> : 
                        <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Statut</span>
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? 
                        <ChevronUpIcon className="h-4 w-4" /> : 
                        <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedEvaluations.map(evaluation => {
                const score = calculateScore(evaluation);
                const scoreColorClass = getScoreColorClass(score);
                
                return (
                  <tr key={evaluation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {evaluation.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {evaluation.scale?.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(evaluation.dateEval).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {evaluation.teacher?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {evaluation.grades && evaluation.grades.length > 0 ? (
                        <div className={`text-sm font-medium ${scoreColorClass}`}>
                          {score}%
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic">
                          Non noté
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs leading-4 rounded-full font-medium ${
                        evaluation.status === 'published' ? 'bg-green-100 text-green-800' : 
                        evaluation.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {evaluation.status === 'published' ? 'Publiée' : 
                        evaluation.status === 'draft' ? 'Brouillon' : 'Archivée'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={getDetailUrl(evaluation)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir détails"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}