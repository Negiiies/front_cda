// src/app/(dashboard)/scales/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../lib/auth';
import scaleService, { Scale, Criteria } from '../../../../services/scaleService';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PencilIcon, TrashIcon, PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ScaleDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [scale, setScale] = useState<Scale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const scaleId = Number(params.id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const scaleData = await scaleService.getScaleById(scaleId);
        setScale(scaleData);
      } catch (err) {
        console.error('Erreur lors du chargement des données', err);
        setError('Impossible de charger les détails de ce barème.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [scaleId]);

  const handleDeleteCriteria = async (criteriaId: number) => {
    if (deleteConfirm !== criteriaId) {
      setDeleteConfirm(criteriaId);
      return;
    }

    try {
      await scaleService.deleteCriteria(criteriaId);
      // Mettre à jour l'état local
      if (scale && scale.criteria) {
        setScale({
          ...scale,
          criteria: scale.criteria.filter(c => c.id !== criteriaId)
        });
      }
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Erreur lors de la suppression du critère', err);
      setError('Impossible de supprimer ce critère. Il est peut-être utilisé dans des évaluations.');
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

  if (!scale) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-6">
        Barème non trouvé.
      </div>
    );
  }

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
  const isCreator = isTeacherOrAdmin && user?.userId === scale.creatorId;
  const canEdit = isCreator || user?.role === 'admin';

  // Calculer le total des coefficients
  const totalCoefficient = scale.criteria?.reduce((sum, criteria) => sum + criteria.coefficient, 0) || 0;
  const isValidCoefficient = Math.abs(totalCoefficient - 1) < 0.01; // Pour gérer les erreurs d'arrondi

  return (
    <div className="space-y-6">
      {/* Entête avec les actions */}
      <div className="flex items-center mb-6">
        <Link href="/scales" className="text-gray-600 hover:text-gray-900 mr-2">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div className="flex-grow">
          <h1 className="text-2xl font-bold text-gray-800">{scale.title}</h1>
          <div className="text-sm text-gray-500">
            Créé le {new Date(scale.createdAt!).toLocaleDateString('fr-FR')}
          </div>
        </div>
        
        {canEdit && (
          <div className="flex space-x-3">
            <Link
              href={`/scales/${scaleId}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-blue-700"
            >
              <PencilIcon className="h-5 w-5" />
              <span>Modifier</span>
            </Link>
            
            <Link
              href={`/scales/${scaleId}/criteria/create`}
              className="bg-[#138784] text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-[#0c6460]"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Ajouter un critère</span>
            </Link>
          </div>
        )}
      </div>
      
      {/* Description */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-3">Description</h2>
        <p className="text-gray-700">{scale.description || 'Aucune description fournie.'}</p>
      </div>
      
      {/* Status du coefficient */}
      <div className={`p-4 rounded-lg ${isValidCoefficient ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <p className={`text-sm ${isValidCoefficient ? 'text-green-700' : 'text-yellow-700'}`}>
          {isValidCoefficient 
            ? `Total des coefficients: ${totalCoefficient.toFixed(2)} (Valide)` 
            : `Total des coefficients: ${totalCoefficient.toFixed(2)} (Doit être égal à 1)`}
        </p>
      </div>
      
      {/* Critères */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 pb-3">
          <h2 className="text-xl font-semibold mb-2">Critères d'évaluation</h2>
        </div>
        
        {scale.criteria && scale.criteria.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compétence</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Coefficient</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Points max</th>
                {canEdit && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scale.criteria.map((criteria) => (
                <tr key={criteria.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{criteria.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{criteria.associatedSkill}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">{criteria.coefficient}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">{criteria.maxPoints}</div>
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link 
                          href={`/scales/${scaleId}/criteria/${criteria.id}/edit`} 
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        
                        <button 
                          onClick={() => handleDeleteCriteria(criteria.id)} 
                          className={`${deleteConfirm === criteria.id ? 'text-red-800 bg-red-100 p-1 rounded' : 'text-red-600 hover:text-red-900'}`}
                          title={deleteConfirm === criteria.id ? "Cliquez à nouveau pour confirmer" : "Supprimer"}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Aucun critère défini pour ce barème.
          </div>
        )}
      </div>
    </div>
  );
}