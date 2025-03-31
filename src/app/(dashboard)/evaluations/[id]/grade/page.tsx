// src/app/(dashboard)/evaluations/[id]/grade/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../lib/auth';
import evaluationService, { Evaluation, Grade } from '../../../../../services/evaluationService';
import Link from 'next/link';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function GradeEvaluationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const evaluationId = Number(params.id);
  
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [grades, setGrades] = useState<Record<number, number>>({});
  const [existingGrades, setExistingGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Rediriger si l'utilisateur n'est pas un professeur
    if (user && user.role !== 'teacher') {
      router.push('/dashboard');
      return;
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer l'évaluation complète
        const evalData = await evaluationService.getEvaluationById(evaluationId);
        setEvaluation(evalData);
        
        // Récupérer les notes existantes
        const gradesData = await evaluationService.getGrades(evaluationId);
        setExistingGrades(gradesData);
        
        // Pré-remplir les notes existantes
        const gradesMap = gradesData.reduce((acc: Record<number, number>, grade: Grade) => {
          acc[grade.criteriaId] = grade.value;
          return acc;
        }, {});
        setGrades(gradesMap);
      } catch (err) {
        console.error('Erreur lors du chargement des données', err);
        setError('Impossible de charger les détails de cette évaluation.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, router, evaluationId]);

  const handleGradeChange = (criteriaId: number, value: number, maxPoints: number) => {
    // Vérifier que la note n'excède pas le maximum
    if (value > maxPoints) {
      value = maxPoints;
    }
    
    setGrades({
      ...grades,
      [criteriaId]: value
    });
  };

  const calculateTotalGrade = (): number => {
    if (!evaluation?.scale?.criteria) return 0;
    
    // Méthode 1: Somme simple des notes
    return Object.values(grades).reduce((sum, value) => sum + (value || 0), 0);
    
    // Méthode 2: Somme pondérée (si vous souhaitez utiliser les coefficients)
    /*
    return evaluation.scale.criteria.reduce((sum, criteria) => {
      const grade = grades[criteria.id] || 0;
      return sum + (grade * criteria.coefficient);
    }, 0);
    */
  };

  const calculateMaxGrade = (): number => {
    if (!evaluation?.scale?.criteria) return 0;
    return evaluation.scale.criteria.reduce((sum, c) => sum + c.maxPoints, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!evaluation?.scale?.criteria) {
      setError('Aucun critère disponible pour cette évaluation.');
      return;
    }
    
    // Vérifier que toutes les compétences sont notées
    const criteria = evaluation.scale.criteria;
    const allCriteriaGraded = criteria.every((c) => grades[c.id] !== undefined);
    
    if (!allCriteriaGraded) {
      setError('Veuillez noter tous les critères avant de soumettre.');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Pour chaque critère, créer ou mettre à jour la note
      const promises = criteria.map(async (criteria) => {
        const criteriaId = criteria.id;
        const value = grades[criteriaId];
        
        // Chercher si une note existe déjà pour ce critère
        const existingGrade = existingGrades.find(g => g.criteriaId === criteriaId);
        
        if (existingGrade) {
          // Mettre à jour la note existante
          return await evaluationService.updateGrade(existingGrade.id, value);
        } else {
          // Créer une nouvelle note
          return await evaluationService.createGrade({
            evaluationId,
            criteriaId,
            value
          });
        }
      });
      
      await Promise.all(promises);
      
      setSuccess('Notes enregistrées avec succès!');
      
      // Recharger les données pour afficher les notes mises à jour
      const updatedEval = await evaluationService.getEvaluationById(evaluationId);
      setEvaluation(updatedEval);
      
      const updatedGrades = await evaluationService.getGrades(evaluationId);
      setExistingGrades(updatedGrades);
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement des notes', err);
      setError('Impossible d\'enregistrer les notes. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#138784]"></div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-6">
        Évaluation non trouvée.
      </div>
    );
  }

  // Vérifier si l'évaluation peut être notée (seulement les brouillons)
  const canGrade = evaluation.status === 'draft';
  
  // Vérifier si le prof connecté est bien celui qui a créé l'évaluation
  const isTeacherOfEvaluation = user?.userId === evaluation.teacherId;
  
  if (!isTeacherOfEvaluation) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
        Vous n'êtes pas autorisé à noter cette évaluation.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Link href={`/evaluations/${evaluationId}`} className="text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Noter l'évaluation</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <CheckCircleIcon className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">{evaluation.title}</h2>
          <div className="text-sm text-gray-500 mt-1">
            Date: {new Date(evaluation.dateEval).toLocaleDateString('fr-FR')}
          </div>
          <div className="text-sm text-gray-500">
            Étudiant: {evaluation.student?.name}
          </div>
          <div className="text-sm text-gray-500">
            Barème: {evaluation.scale?.title}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
            <p className="text-sm">
              <strong>Note:</strong> Vous pouvez attribuer des notes pour chaque critère. 
              La note totale sera calculée automatiquement.
            </p>
          </div>
        </div>
        
        {!canGrade ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            Cette évaluation ne peut plus être modifiée car elle n'est plus en statut "brouillon".
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Critère</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compétence</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Coefficient</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Note</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Maximum</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {evaluation.scale?.criteria?.map((criteria) => (
                    <tr key={criteria.id}>
                      <td className="px-4 py-3 text-sm">{criteria.description}</td>
                      <td className="px-4 py-3 text-sm">{criteria.associatedSkill}</td>
                      <td className="px-4 py-3 text-sm text-center">{criteria.coefficient}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max={criteria.maxPoints}
                          step="0.5"
                          className="w-20 text-center px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
                          value={grades[criteria.id] || ''}
                          onChange={(e) => handleGradeChange(criteria.id, parseFloat(e.target.value) || 0, criteria.maxPoints)}
                          disabled={!canGrade}
                          required
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-right">{criteria.maxPoints}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-medium">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm" colSpan={3}>
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-sm">
                      {calculateTotalGrade().toFixed(1)}
                    </th>
                    <th className="px-4 py-3 text-right text-sm">
                      {calculateMaxGrade()}
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <Link
                href={`/evaluations/${evaluationId}`}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </Link>
              
              <button
                type="submit"
                disabled={saving || !canGrade}
                className="bg-[#138784] text-white px-6 py-2 rounded-md hover:bg-[#0c6460] disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer les notes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}