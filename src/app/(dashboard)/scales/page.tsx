// src/app/(dashboard)/scales/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth';
import scaleService, { Scale } from '../../../services/scaleService';
import Link from 'next/link';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ScalesPage() {
  const { user } = useAuth();
  const [scales, setScales] = useState<Scale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchScales = async () => {
      try {
        const data = await scaleService.getScales();
        setScales(data);
      } catch (err) {
        console.error('Erreur lors du chargement des barèmes', err);
        setError('Impossible de charger les barèmes. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchScales();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce barème ?')) {
      return;
    }

    try {
      await scaleService.deleteScale(id);
      setScales(scales.filter(scale => scale.id !== id));
    } catch (err) {
      console.error('Erreur lors de la suppression', err);
      setError('Impossible de supprimer ce barème. Il est peut-être utilisé dans des évaluations.');
    }
  };

  // Filtrer les barèmes selon la recherche
  const filteredScales = scales.filter(scale =>
    scale.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (scale.description && scale.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#138784]"></div>
      </div>
    );
  }

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  return (
    <div>
      {/* En-tête avec titre et bouton */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Barèmes d'évaluation</h1>
        {isTeacherOrAdmin && (
          <Link 
            href="/scales/create" 
            className="bg-[#138784] text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-[#0c6460] transition"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nouveau barème</span>
          </Link>
        )}
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <input
          type="text"
          placeholder="Rechercher un barème..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784] text-gray-800 placeholder-gray-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {filteredScales.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {searchTerm ? 'Aucun barème trouvé' : 'Aucun barème disponible'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Aucun barème ne correspond à votre recherche.' 
              : 'Commencez par créer votre premier barème d\'évaluation.'}
          </p>
          {isTeacherOrAdmin && !searchTerm && (
            <Link 
              href="/scales/create"
              className="inline-flex items-center px-4 py-2 bg-[#138784] text-white rounded-md hover:bg-[#0c6460] transition"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Créer un barème
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScales.map((scale) => (
            <div key={scale.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              {/* En-tête de la carte */}
              <div className="p-6 pb-4">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-bold text-gray-800 leading-tight">
                    {scale.title}
                  </h2>
                  <div className="flex space-x-1 ml-2">
                    <Link 
                      href={`/scales/${scale.id}`} 
                      className="p-1.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition"
                      title="Voir"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                    
                    {isTeacherOrAdmin && (
                      <>
                        <Link 
                          href={`/scales/${scale.id}/edit`} 
                          className="p-1.5 bg-amber-50 text-amber-700 rounded-full hover:bg-amber-100 transition"
                          title="Modifier"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        
                        <button 
                          onClick={() => handleDelete(scale.id)} 
                          className="p-1.5 bg-red-50 text-red-700 rounded-full hover:bg-red-100 transition"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-700 text-sm leading-relaxed mb-4 min-h-[2.5rem]">
                  {scale.description || 'Aucune description fournie'}
                </p>
                
                <div className="flex items-center text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1.5 text-[#138784]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <span className="font-medium text-gray-800">
                      {scale.criteria?.length || 0} critères d'évaluation
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Pied de carte */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>Créé le {scale.createdAt ? format(new Date(scale.createdAt), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}</span>
                  <Link 
                    href={`/scales/${scale.id}`}
                    className="text-[#138784] hover:text-[#0c6460] font-medium transition"
                  >
                    Voir les détails →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}