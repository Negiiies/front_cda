// src/app/(dashboard)/evaluations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth';
import { useNotification } from '../../../contexts/NotificationContext';
import evaluationService, { Evaluation } from '../../../services/evaluationService';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { format } from 'date-fns';

export default function EvaluationsPage() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
    const matchesSearch = 
      (evaluation.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (evaluation.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    return matchesStatus && matchesSearch;
  });

  // Calculer la pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEvaluations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEvaluations.length / itemsPerPage);

  // Traduction des statuts
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'published': return 'Publiée';
      case 'archived': return 'Archivée';
      default: return status;
    }
  };

  // Traduction des statuts pour les classes CSS
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'published': return 'bg-green-100 text-green-800 border border-green-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Classes pour les initiales d'étudiants
  const getInitialsBgClass = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const firstLetter = initials.charAt(0).toLowerCase();
    
    // Attribution d'une couleur en fonction de la première lettre
    if ('abc'.includes(firstLetter)) {
      return 'bg-purple-100 text-purple-800'; // Pour A, B, C
    } else if ('defg'.includes(firstLetter)) {
      return 'bg-blue-100 text-blue-800'; // Pour D, E, F, G
    } else if ('hijkl'.includes(firstLetter)) {
      return 'bg-green-100 text-green-800'; // Pour H à L
    } else if ('mnopq'.includes(firstLetter)) {
      return 'bg-amber-100 text-amber-800'; // Pour M à Q
    } else {
      return 'bg-red-100 text-red-800'; // Pour le reste de l'alphabet
    }
  };

  // Obtenir les initiales d'un nom
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement des évaluations..." />;
  }

  return (
    <div>
      {/* En-tête avec titre et bouton d'ajout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Évaluations</h1>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
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
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784] text-gray-800 placeholder-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-72">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784] text-gray-800 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all" className="text-gray-800">Tous les statuts</option>
              <option value="draft" className="text-gray-800">Brouillon</option>
              <option value="published" className="text-gray-800">Publiée</option>
              <option value="archived" className="text-gray-800">Archivée</option>
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
          <p className="text-gray-700">
            {searchTerm || statusFilter !== 'all'
              ? 'Aucune évaluation ne correspond aux critères sélectionnés.'
              : 'Aucune évaluation disponible pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* En-tête du tableau */}
          <div className="grid grid-cols-12 bg-gray-200 py-3 px-6 border-b border-gray-300 font-medium text-xs uppercase text-gray-700 tracking-wider">
            <div className="col-span-4">TITRE</div>
            <div className="col-span-2 text-center">DATE</div>
            <div className="col-span-2 text-center">STATUT</div>
            <div className="col-span-3">ÉTUDIANT</div>
            <div className="col-span-1 text-right">ACTIONS</div>
          </div>

          {/* Corps du tableau */}
          <div className="divide-y divide-gray-200">
            {currentItems.map((evaluation) => (
              <div key={evaluation.id} className="grid grid-cols-12 py-4 px-6 hover:bg-gray-50 items-center">
                <div className="col-span-4">
                  <div className="flex flex-col">
                    <Link href={`/evaluations/${evaluation.id}`} className="text-[#138784] font-medium hover:underline">
                      {evaluation.title}
                    </Link>
                    {evaluation.title !== evaluation.scale?.title && (
                      <span className="text-xs text-gray-700 mt-1">
                        {evaluation.scale?.title}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="col-span-2 text-center text-gray-800">
                  {format(new Date(evaluation.dateEval), 'dd/MM/yyyy')}
                </div>
                
                <div className="col-span-2 text-center">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(evaluation.status)}`}>
                    {getStatusLabel(evaluation.status)}
                  </span>
                </div>
                
                <div className="col-span-3">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full ${getInitialsBgClass(evaluation.student?.name || 'Étudiant')} flex items-center justify-center text-sm font-medium mr-2`}>
                      {getInitials(evaluation.student?.name || 'ET')}
                    </div>
                    <span className="font-medium text-gray-800">{evaluation.student?.name}</span>
                  </div>
                </div>
                
                <div className="col-span-1 flex justify-end space-x-1">
                  <Link 
                    href={`/evaluations/${evaluation.id}`} 
                    className="p-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100"
                    title="Voir"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Link>
                  
                  {(user?.role === 'teacher' || user?.role === 'admin') && (
                    <>
                      <Link 
                        href={`/evaluations/${evaluation.id}/edit`} 
                        className="p-1 bg-amber-50 text-amber-700 rounded-full hover:bg-amber-100"
                        title="Modifier"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </Link>
                      
                      <button 
                        onClick={() => handleDelete(evaluation.id)} 
                        className="p-1 bg-red-50 text-red-700 rounded-full hover:bg-red-100"
                        title="Supprimer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-100 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-800">
                Affichage de {Math.min(filteredEvaluations.length, 1)} à {Math.min(indexOfLastItem, filteredEvaluations.length)} sur {filteredEvaluations.length} évaluations
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-800 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-800 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}