'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../lib/auth';
import scaleService, { Scale, Criteria } from '../../../../services/scaleService';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PencilIcon, TrashIcon, PlusIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

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

  const handleDeleteScale = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce barème ? Cette action est irréversible.')) {
      return;
    }

    try {
      await scaleService.deleteScale(scaleId);
      router.push('/scales');
    } catch (err) {
      console.error('Erreur lors de la suppression du barème', err);
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/scales" className="text-gray-600 hover:text-gray-900 transition">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{scale.title}</h1>
            <p className="text-sm text-gray-600 mt-1">
              Créé le {new Date(scale.createdAt!).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        
        {canEdit && (
          <div className="flex space-x-3">
            <Link
              href={`/scales/${scaleId}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-blue-700 transition"
            >
              <PencilIcon className="h-5 w-5" />
              <span>Modifier</span>
            </Link>
            
            <button
              onClick={handleDeleteScale}
              className="bg-red-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-red-700 transition"
            >
              <TrashIcon className="h-5 w-5" />
              <span>Supprimer</span>
            </button>
            
            <Link
              href={`/scales/${scaleId}/criteria/create`}
              className="bg-[#138784] text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-[#0c6460] transition"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Ajouter un critère</span>
            </Link>
          </div>
        )}
      </div>
      
      {/* Description */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <div className="w-8 h-8 bg-[#138784] text-white rounded-full flex items-center justify-center mr-3 text-sm font-bold">
            1
          </div>
          Description
        </h2>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-gray-800 leading-relaxed">
            {scale.description || 'Aucune description fournie pour ce barème.'}
          </p>
        </div>
      </div>
      
      {/* Status du coefficient */}
      <div className={`p-4 rounded-lg border ${isValidCoefficient 
        ? 'bg-green-50 border-green-200' 
        : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center">
          {isValidCoefficient ? (
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
          ) : (
            <div className="h-5 w-5 text-amber-600 mr-2">⚠️</div>
          )}
          <p className={`text-sm font-medium ${isValidCoefficient ? 'text-green-800' : 'text-amber-800'}`}>
            Total des coefficients: {totalCoefficient.toFixed(2)}/1.00 
            {isValidCoefficient ? ' (Valide)' : ' (Doit être égal à 1)'}
          </p>
        </div>
      </div>
      
      {/* Critères */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <div className="w-8 h-8 bg-[#138784] text-white rounded-full flex items-center justify-center mr-3 text-sm font-bold">
              2
            </div>
            Critères d'évaluation
            <span className="ml-3 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              {scale.criteria?.length || 0} critères
            </span>
          </h2>
        </div>
        
        {scale.criteria && scale.criteria.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">DESCRIPTION</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">COMPÉTENCE</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">COEFFICIENT</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">POINTS MAX</th>
                  {canEdit && (
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">ACTIONS</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {scale.criteria.map((criteria, index) => (
                  <tr key={criteria.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-800">{criteria.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">{criteria.associatedSkill}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {criteria.coefficient}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {criteria.maxPoints} pts
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => router.push(`/scales/${scaleId}/criteria/${criteria.id}`)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition"
                            title="Voir les détails"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          
                          <button 
                            onClick={() => router.push(`/scales/${scaleId}/criteria/${criteria.id}/edit`)}
                            className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-full transition"
                            title="Modifier"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteCriteria(criteria.id)} 
                            className={`p-2 rounded-full transition ${
                              deleteConfirm === criteria.id 
                                ? 'text-red-800 bg-red-100' 
                                : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                            }`}
                            title={deleteConfirm === criteria.id ? "Cliquez à nouveau pour confirmer" : "Supprimer"}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun critère défini</h3>
            <p className="text-gray-600 mb-4">Ce barème n'a pas encore de critères d'évaluation.</p>
            {canEdit && (
              <Link
                href={`/scales/${scaleId}/criteria/create`}
                className="inline-flex items-center px-4 py-2 bg-[#138784] text-white rounded-md hover:bg-[#0c6460] transition"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Ajouter le premier critère
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Statistiques d'utilisation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <div className="w-8 h-8 bg-[#138784] text-white rounded-full flex items-center justify-center mr-3 text-sm font-bold">
            📊
          </div>
          Statistiques d'utilisation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{scale.criteria?.length || 0}</div>
            <div className="text-sm text-green-700">Critères définis</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {scale.criteria?.reduce((sum, c) => sum + c.maxPoints, 0) || 0}
            </div>
            <div className="text-sm text-purple-700">Points totaux</div>
          </div>
        </div>
      </div>
    </div>
  );
}
