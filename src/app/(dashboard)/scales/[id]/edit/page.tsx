'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../../lib/auth';
import scaleService, { Scale, Criteria, NewCriteria } from '../../../../../services/scaleService';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, PlusIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function EditScalePage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const scaleId = Number(params.id);

  // États pour les données du formulaire
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<(Criteria | NewCriteria)[]>([]);
  
  // États pour les opérations
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originalScale, setOriginalScale] = useState<Scale | null>(null);

  // Charger les données du barème existant
  useEffect(() => {
    const fetchScale = async () => {
      try {
        setLoadingData(true);
        const scale = await scaleService.getScaleById(scaleId);
        
        // Vérifier les permissions
        if (scale.creatorId !== user?.userId && user?.role !== 'admin') {
          setError('Vous n\'avez pas les permissions pour modifier ce barème.');
          return;
        }

        setOriginalScale(scale);
        setTitle(scale.title);
        setDescription(scale.description || '');
        setCriteria(scale.criteria || []);
      } catch (err) {
        console.error('Erreur lors du chargement du barème:', err);
        setError('Impossible de charger ce barème.');
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchScale();
    }
  }, [scaleId, user]);

  // Ajouter un nouveau critère
  const addCriteria = () => {
    const newCriteria: NewCriteria = {
      description: '',
      associatedSkill: '',
      maxPoints: 10,
      coefficient: 0.1
    };
    setCriteria([...criteria, newCriteria]);
  };

  // Supprimer un critère
  const removeCriteria = async (index: number) => {
    const criteriaToRemove = criteria[index];
    
    // Si c'est un critère existant (avec un ID), vérifier s'il peut être supprimé
    if ('id' in criteriaToRemove && criteriaToRemove.id) {
      if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce critère ? Cette action est irréversible.')) {
        return;
      }
      
      try {
        await scaleService.deleteCriteria(scaleId, criteriaToRemove.id);
        setCriteria(criteria.filter((_, i) => i !== index));
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        setError('Impossible de supprimer ce critère. Il est peut-être utilisé dans des évaluations.');
      }
    } else {
      // Nouveau critère pas encore sauvegardé, suppression directe
      setCriteria(criteria.filter((_, i) => i !== index));
    }
  };

  // Mettre à jour un critère
  const updateCriteria = (index: number, field: keyof Criteria, value: string | number) => {
    const updatedCriteria = [...criteria];
    (updatedCriteria[index] as any)[field] = value;
    setCriteria(updatedCriteria);
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }
    
    if (criteria.length === 0) {
      setError('Au moins un critère est nécessaire.');
      return;
    }

    // Vérifier que tous les critères sont valides
    for (let i = 0; i < criteria.length; i++) {
      const criterion = criteria[i];
      if (!criterion.description.trim() || !criterion.associatedSkill.trim()) {
        setError(`Le critère ${i + 1} doit avoir une description et une compétence associée.`);
        return;
      }
      if (criterion.maxPoints <= 0) {
        setError(`Le critère ${i + 1} doit avoir un nombre de points maximum positif.`);
        return;
      }
      if (criterion.coefficient <= 0) {
        setError(`Le critère ${i + 1} doit avoir un coefficient positif.`);
        return;
      }
    }

    // Vérifier que le total des coefficients ne dépasse pas 1
    const totalCoefficient = criteria.reduce((sum, c) => sum + c.coefficient, 0);
    if (totalCoefficient > 1) {
      setError(`Le total des coefficients (${totalCoefficient.toFixed(2)}) ne peut pas dépasser 1.`);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Mettre à jour les informations générales du barème
      const scaleUpdateData = {
        title: title.trim(),
        description: description.trim()
      };
      
      await scaleService.updateScale(scaleId, scaleUpdateData);

      // 2. Gérer les critères modifiés et nouveaux
      for (const criterion of criteria) {
        if ('id' in criterion && criterion.id) {
          // Critère existant - le mettre à jour
          const criteriaUpdateData = {
            description: criterion.description.trim(),
            associatedSkill: criterion.associatedSkill.trim(),
            maxPoints: criterion.maxPoints,
            coefficient: criterion.coefficient
          };
          await scaleService.updateCriteria(scaleId, criterion.id, criteriaUpdateData);
        } else {
          // Nouveau critère - le créer
          const newCriteriaData = {
            description: criterion.description.trim(),
            associatedSkill: criterion.associatedSkill.trim(),
            maxPoints: criterion.maxPoints,
            coefficient: criterion.coefficient
          };
          await scaleService.createCriteria(scaleId, newCriteriaData);
        }
      }

      // Rediriger vers la page de détail
      router.push(`/scales/${scaleId}`);
    } catch (err) {
      console.error('Erreur lors de la modification du barème:', err);
      setError('Impossible de modifier le barème. Veuillez vérifier vos données et réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Calculer le total des coefficients
  const totalCoefficient = criteria.reduce((sum, c) => sum + c.coefficient, 0);
  const remainingCoefficient = Math.max(0, 1 - totalCoefficient);

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#138784]"></div>
      </div>
    );
  }

  if (error && !originalScale) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/scales" className="text-gray-600 hover:text-gray-900 transition">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Modifier le barème</h1>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center space-x-4 mb-8">
        <Link href={`/scales/${scaleId}`} className="text-gray-600 hover:text-gray-900 transition">
          <ArrowLeftIcon className="h-6 w-6" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Modifier le barème</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informations générales */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <div className="w-8 h-8 bg-[#138784] text-white rounded-full flex items-center justify-center mr-3 text-sm font-bold">
              1
            </div>
            Informations générales
          </h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-800 mb-2">
                Titre du barème <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784] text-gray-800 placeholder-gray-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Évaluation de développement web"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784] text-gray-800 placeholder-gray-500 resize-vertical"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description détaillée du barème d'évaluation..."
              />
            </div>
          </div>
        </div>

        {/* Critères d'évaluation */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <div className="w-8 h-8 bg-[#138784] text-white rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                2
              </div>
              Critères d'évaluation
            </h2>
            
            <button
              type="button"
              onClick={addCriteria}
              className="inline-flex items-center px-3 py-2 border border-[#138784] text-[#138784] rounded-lg hover:bg-[#138784] hover:text-white transition-colors text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Ajouter un critère
            </button>
          </div>

          {/* Indicateur des coefficients */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Total des coefficients: {totalCoefficient.toFixed(2)} / 1.00
              </span>
              <span className={`text-sm font-medium ${remainingCoefficient === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                Restant: {remainingCoefficient.toFixed(2)}
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  totalCoefficient > 1 ? 'bg-red-500' : 
                  totalCoefficient === 1 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(totalCoefficient * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Liste des critères */}
          <div className="space-y-6">
            {criteria.map((criterion, index) => (
              <div key={`criterion-${index}`} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800">
                    Critère {index + 1}
                    {'id' in criterion && criterion.id && (
                      <span className="ml-2 text-sm text-gray-500">(existant)</span>
                    )}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeCriteria(index)}
                    className="text-red-600 hover:text-red-800 transition-colors p-1"
                    title="Supprimer ce critère"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784]"
                      value={criterion.description}
                      onChange={(e) => updateCriteria(index, 'description', e.target.value)}
                      placeholder="Ex: Qualité du code"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compétence associée <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784]"
                      value={criterion.associatedSkill}
                      onChange={(e) => updateCriteria(index, 'associatedSkill', e.target.value)}
                      placeholder="Ex: Développement"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points maximum <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784]"
                      value={criterion.maxPoints}
                      onChange={(e) => updateCriteria(index, 'maxPoints', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coefficient <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      max="1"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784]"
                      value={criterion.coefficient}
                      onChange={(e) => updateCriteria(index, 'coefficient', parseFloat(e.target.value) || 0.01)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {criteria.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Aucun critère défini. Cliquez sur "Ajouter un critère" pour commencer.</p>
              </div>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4">
          <Link
            href={`/scales/${scaleId}`}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#138784] text-white rounded-lg hover:bg-[#0c6460] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Modification en cours...
              </>
            ) : (
              'Modifier le barème'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}