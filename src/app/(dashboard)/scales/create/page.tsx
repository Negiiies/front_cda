// src/app/(dashboard)/scales/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import scaleService, { NewScale } from '../../../../services/scaleService';
import { PlusIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function CreateScalePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<{ description: string; associatedSkill: string; maxPoints: number; coefficient: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // États pour un nouveau critère
  const [newDescription, setNewDescription] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newMaxPoints, setNewMaxPoints] = useState<number>(0);
  const [newCoefficient, setNewCoefficient] = useState<number>(0);

  const addCriteria = () => {
    // Valider les entrées
    if (!newDescription || !newSkill || newMaxPoints <= 0 || newCoefficient <= 0) {
      setError('Tous les champs du critère sont obligatoires et les valeurs numériques doivent être positives.');
      return;
    }
    
    // Vérifier si l'ajout du nouveau coefficient ne dépasse pas 1
    const totalCoefficient = criteria.reduce((sum, c) => sum + c.coefficient, 0) + newCoefficient;
    if (totalCoefficient > 1) {
      setError('La somme des coefficients ne peut pas dépasser 1.');
      return;
    }
    
    setCriteria([...criteria, {
      description: newDescription,
      associatedSkill: newSkill,
      maxPoints: newMaxPoints,
      coefficient: newCoefficient
    }]);
    
    // Réinitialiser les champs
    setNewDescription('');
    setNewSkill('');
    setNewMaxPoints(0);
    setNewCoefficient(0);
    setError(null);
  };

  const removeCriteria = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      setError('Le titre du barème est obligatoire.');
      return;
    }
    
    if (criteria.length === 0) {
      setError('Au moins un critère est nécessaire pour créer un barème.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const scaleData: NewScale = {
        title,
        description,
        criteria
      };
      
      await scaleService.createScale(scaleData);
      router.push('/scales');
    } catch (err) {
      console.error('Erreur lors de la création du barème', err);
      setError('Impossible de créer le barème. Veuillez vérifier vos données et réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Calculer le total des coefficients
  const totalCoefficient = criteria.reduce((sum, c) => sum + c.coefficient, 0);
  const remainingCoefficient = Math.max(0, 1 - totalCoefficient);

  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/scales" className="text-gray-600 hover:text-gray-900 transition">
          <ArrowLeftIcon className="h-6 w-6" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Créer un nouveau barème</h1>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784] text-gray-800 placeholder-gray-500 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez l'objectif et le contexte de ce barème d'évaluation..."
              ></textarea>
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
            <div className="text-sm">
              <span className="text-gray-600">Total des coefficients: </span>
              <span className={`font-bold ${totalCoefficient > 1 ? 'text-red-600' : totalCoefficient === 1 ? 'text-green-600' : 'text-amber-600'}`}>
                {totalCoefficient.toFixed(2)}/1.00
              </span>
            </div>
          </div>
          
          {/* Liste des critères ajoutés */}
          {criteria.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-1 gap-4">
                {criteria.map((criterion, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Description</p>
                          <p className="text-gray-800 font-medium">{criterion.description}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Compétence</p>
                          <p className="text-gray-800">{criterion.associatedSkill}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Points max</p>
                          <p className="text-gray-800 font-semibold">{criterion.maxPoints}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Coefficient</p>
                          <p className="text-gray-800 font-semibold">{criterion.coefficient}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCriteria(index)}
                        className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition"
                        title="Supprimer ce critère"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Formulaire d'ajout de critère */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <PlusIcon className="h-5 w-5 mr-2 text-[#138784]" />
              Ajouter un critère
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="criteriaDescription" className="block text-sm font-semibold text-gray-800 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="criteriaDescription"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784] placeholder-gray-500"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ex: Qualité du code"
                />
              </div>
              
              <div>
                <label htmlFor="associatedSkill" className="block text-sm font-semibold text-gray-800 mb-2">
                  Compétence associée <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="associatedSkill"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784] placeholder-gray-500"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Ex: Développement"
                />
              </div>
              
              <div>
                <label htmlFor="maxPoints" className="block text-sm font-semibold text-gray-800 mb-2">
                  Points maximum <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="maxPoints"
                  min="1"
                  step="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784]"
                  value={newMaxPoints || ''}
                  onChange={(e) => setNewMaxPoints(Number(e.target.value))}
                  placeholder="Ex: 20"
                />
              </div>
              
              <div>
                <label htmlFor="coefficient" className="block text-sm font-semibold text-gray-800 mb-2">
                  Coefficient <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-600 ml-1">(max: {remainingCoefficient.toFixed(2)})</span>
                </label>
                <input
                  type="number"
                  id="coefficient"
                  min="0.01"
                  max={remainingCoefficient}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784]"
                  value={newCoefficient || ''}
                  onChange={(e) => setNewCoefficient(Number(e.target.value))}
                  placeholder="Ex: 0.3"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={addCriteria}
                disabled={remainingCoefficient <= 0}
                className="bg-[#138784] text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-[#0c6460] disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Ajouter ce critère</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4 pb-8">
          <Link
            href="/scales"
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
          >
            Annuler
          </Link>
          
          <button
            type="submit"
            disabled={loading || criteria.length === 0 || totalCoefficient !== 1}
            className="bg-[#138784] text-white px-8 py-3 rounded-lg hover:bg-[#0c6460] disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? 'Création en cours...' : 'Créer le barème'}
          </button>
        </div>
      </form>
    </div>
  );
}