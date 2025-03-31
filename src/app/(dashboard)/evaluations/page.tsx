// src/app/(dashboard)/evaluations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth';
import { useNotification } from '../../../contexts/NotificationContext';
import evaluationService, { Evaluation } from '../../../services/evaluationService';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

export default function EvaluationsPage() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        const data = await evaluationService.getEvaluations();
        setEvaluations(data);
      } catch (err) {
        console.error('Erreur lors du chargement des évaluations', err);
        setError('Impossible de charger les évaluations. Veuillez réessayer plus tard.');
        showNotification('error', 'Erreur de chargement', 'Impossible de charger les évaluations.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, [showNotification]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette évaluation ?')) {
      return;
    }

    try {
      await evaluationService.deleteEvaluation(id);
      setEvaluations(evaluations.filter(evaluation => evaluation.id !== id));
      showNotification('success', 'Évaluation supprimée', 'L\'évaluation a été supprimée avec succès.');
    } catch (err) {
      console.error('Erreur lors de la suppression', err);
      showNotification('error', 'Erreur de suppression', 'Impossible de supprimer cette évaluation.');
    }
  };

  // Filtrer les évaluations
  const filteredEvaluations = evaluations.filter(evaluation => {
    const matchesStatus = statusFilter === 'all' || evaluation.status === statusFilter;
    const matchesSearch = evaluation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evaluation.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (evaluation.teacher?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement des évaluations..." />;
  }

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Évaluations</h1>
        {isTeacherOrAdmin && (
          <Link 
            href="/evaluations/create" 
            className="bg-[#138784] text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-[#0c6460] transition"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nouvelle évaluation</span>
          </Link>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher
            </label>
            <input
              type="text"
              id="searchTerm"
              placeholder="Titre, étudiant ou professeur..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              id="statusFilter"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="published">Publiée</option>
              <option value="archived">Archivée</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {filteredEvaluations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all'
              ? 'Aucune évaluation ne correspond aux critères sélectionnés.'
              : 'Aucune évaluation disponible pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                {user?.role === 'teacher' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Étudiant</th>
                )}
                {user?.role === 'student' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Professeur</th>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvaluations.map((evaluation) => (
                <tr key={evaluation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{evaluation.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(evaluation.dateEval).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${evaluation.status === 'published' ? 'bg-green-100 text-green-800' : 
                        evaluation.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {evaluation.status === 'published' ? 'Publiée' : 
                       evaluation.status === 'draft' ? 'Brouillon' : 
                       'Archivée'}
                    </span>
                  </td>
                  {user?.role === 'teacher' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{evaluation.student?.name}</div>
                    </td>
                  )}
                  {user?.role === 'student' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{evaluation.teacher?.name}</div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link 
                        href={`/evaluations/${evaluation.id}`} 
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir détails"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      
                      {isTeacherOrAdmin && 
                       evaluation.status === 'draft' && 
                       evaluation.teacherId === user?.userId && (
                        <>
                          <Link 
                            href={`/evaluations/${evaluation.id}/edit`} 
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Modifier"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </Link>
                          
                          <button 
                            onClick={() => handleDelete(evaluation.id)} 
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}