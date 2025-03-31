// src/app/(dashboard)/scales/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth';
import scaleService, { Scale } from '../../../services/scaleService'; // Assurez-vous d'importer le type Scale correctement
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function ScalesPage() {
  const { user } = useAuth();
  const [scales, setScales] = useState<Scale[]>([]); // Utilisez le type Scale ici
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  return (
    <div>
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

      {scales.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">Aucun barème disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scales.map((scale) => (
            <div key={scale.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{scale.title}</h2>
                <p className="text-gray-600 mb-4">{scale.description || 'Aucune description'}</p>
                <div className="text-sm text-gray-500 mb-4">
                  {scale.criteria?.length || 0} critères d'évaluation
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Créé le {new Date(scale.createdAt!).toLocaleDateString('fr-FR')}
                </div>
                <div className="flex space-x-2">
                  <Link 
                    href={`/scales/${scale.id}`} 
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </Link>
                  
                  {isTeacherOrAdmin && (
                    <>
                      <Link 
                        href={`/scales/${scale.id}/edit`} 
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      
                      <button 
                        onClick={() => handleDelete(scale.id)} 
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}