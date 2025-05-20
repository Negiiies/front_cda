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
        criteria // Ceci est maintenant compatible avec NewCriteria[]
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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Link href="/scales" className="text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Créer un nouveau barème</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations du barème */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Informations générales</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Titre du barème *
              </label>
              <input
              type="text"
              id="title"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
              style={{ backgroundColor: 'white', color: 'black' }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Critères du barème */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Critères d'évaluation</h2>
            <div className="text-sm text-gray-500">
              Total des coefficients: <span className={totalCoefficient > 1 ? 'text-red-600 font-bold' : ''}>{totalCoefficient.toFixed(2)}</span>/1.00
            </div>
          </div>
          
          {/* Liste des critères ajoutés */}
          {criteria.length > 0 && (
            <div className="mb-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Compétence</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Max points</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Coefficient</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {criteria.map((criterion, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{criterion.description}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{criterion.associatedSkill}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{criterion.maxPoints}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{criterion.coefficient}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => removeCriteria(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Formulaire d'ajout de critère */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-medium mb-3">Ajouter un critère</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="criteriaDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  id="criteriaDescription"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="associatedSkill" className="block text-sm font-medium text-gray-700 mb-1">
                  Compétence associée *
                </label>
                <input
                  type="text"
                  id="associatedSkill"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="maxPoints" className="block text-sm font-medium text-gray-700 mb-1">
                  Points maximum *
                </label>
                <input
                  type="number"
                  id="maxPoints"
                  min="1"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
                  value={newMaxPoints || ''}
                  onChange={(e) => setNewMaxPoints(Number(e.target.value))}
                />
              </div>
              
              <div>
                <label htmlFor="coefficient" className="block text-sm font-medium text-gray-700 mb-1">
                  Coefficient * (max: {(1 - totalCoefficient).toFixed(2)})
                </label>
                <input
                  type="number"
                  id="coefficient"
                  min="0.01"
                  max={1 - totalCoefficient}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
                  value={newCoefficient || ''}
                  onChange={(e) => setNewCoefficient(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={addCriteria}
                className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Ajouter ce critère</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/scales"
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </Link>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-[#138784] text-white px-6 py-2 rounded-md hover:bg-[#0c6460] disabled:opacity-50"
          >
            {loading ? 'Création en cours...' : 'Créer le barème'}
          </button>
        </div>
      </form>
    </div>
  );
}