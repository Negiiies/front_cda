// src/app/(dashboard)/evaluations/[id]/grade/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../lib/auth';
import { useNotification } from '../../../../../contexts/NotificationContext';
import evaluationService, { Evaluation, Grade } from '../../../../../services/evaluationService';
import scaleService from '../../../../../services/scaleService';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UserIcon,
  CalendarIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';

export default function GradeEvaluationPage() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const params = useParams();
  const evaluationId = Number(params.id);
  
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [grades, setGrades] = useState<Record<number, number>>({});
  const [existingGrades, setExistingGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    if (user && user.role !== 'teacher') {
      router.push('/dashboard');
      return;
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer l'évaluation complète
        const evalData = await evaluationService.getEvaluationById(evaluationId);
        
        if (!evalData) {
          throw new Error('Évaluation non trouvée');
        }
        
        // Gérer le cas où le barème ou les critères sont manquants
        if (!evalData.scale || !evalData.scale.criteria || evalData.scale.criteria.length === 0) {
          if (!evalData.scale) {
            try {
              const scaleData = await scaleService.getScaleById(evalData.scaleId);
              evalData.scale = scaleData;
            } catch (scaleError) {
              console.error("Erreur lors du chargement du barème:", scaleError);
            }
          }
          
          if (!evalData.scale?.criteria || evalData.scale.criteria.length === 0) {
            try {
              const criteriaData = await scaleService.getCriteriaByScaleId(evalData.scaleId);
              if (criteriaData && criteriaData.length > 0 && evalData.scale) {
                evalData.scale.criteria = criteriaData;
              }
            } catch (criteriaError) {
              console.error("Erreur lors du chargement des critères:", criteriaError);
            }
          }
        }
        
        // Vérifications de sécurité
        if (evalData.teacherId !== user?.userId) {
          throw new Error('Vous n\'êtes pas autorisé à noter cette évaluation');
        }
        
        if (evalData.status !== 'draft') {
          throw new Error('Cette évaluation ne peut plus être modifiée');
        }
        
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
        
      } catch (err: any) {
        console.error('Erreur lors du chargement des données', err);
        setError(err.message || 'Impossible de charger les détails de cette évaluation.');
        showNotification('error', 'Erreur de chargement', err.message || 'Impossible de charger cette évaluation.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, router, evaluationId, showNotification]);

  const handleGradeChange = (criteriaId: number, value: number, maxPoints: number) => {
    // Nettoyer les erreurs de validation précédentes
    if (validationErrors[criteriaId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[criteriaId];
        return newErrors;
      });
    }
    
    // Validation en temps réel
    if (value < 0) {
      setValidationErrors(prev => ({
        ...prev,
        [criteriaId]: 'La note ne peut pas être négative'
      }));
      return;
    }
    
    if (value > maxPoints) {
      setValidationErrors(prev => ({
        ...prev,
        [criteriaId]: `La note ne peut pas dépasser ${maxPoints}`
      }));
      value = maxPoints;
    }
    
    setGrades({
      ...grades,
      [criteriaId]: value
    });
  };

  const calculateTotalGrade = (): number => {
    if (!evaluation?.scale?.criteria) return 0;
    return evaluation.scale.criteria.reduce((sum, criteria) => {
      const grade = grades[criteria.id] || 0;
      return sum + grade;
    }, 0);
  };

  const calculateMaxGrade = (): number => {
    if (!evaluation?.scale?.criteria) return 0;
    return evaluation.scale.criteria.reduce((sum, c) => sum + c.maxPoints, 0);
  };

  const calculatePercentage = (): number => {
    const total = calculateTotalGrade();
    const max = calculateMaxGrade();
    return max > 0 ? (total / max) * 100 : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!evaluation?.scale?.criteria) {
      setError('Aucun critère disponible pour cette évaluation.');
      return;
    }
    
    // Vérifier que toutes les compétences sont notées
    const criteria = evaluation.scale.criteria;
    const ungraded = criteria.filter(c => grades[c.id] === undefined || grades[c.id] === null);
    
    if (ungraded.length > 0) {
      setError(`Veuillez noter tous les critères avant de soumettre. Critères manquants: ${ungraded.length}`);
      showNotification('warning', 'Formulaire incomplet', 'Veuillez noter tous les critères avant de soumettre.');
      return;
    }
    
    // Vérifier les erreurs de validation
    if (Object.keys(validationErrors).length > 0) {
      setError('Veuillez corriger les erreurs de validation avant de soumettre.');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const promises = criteria.map(async (criteria) => {
        const criteriaId = criteria.id;
        const value = grades[criteriaId];
        
        const existingGrade = existingGrades.find(g => g.criteriaId === criteriaId);
        
        if (existingGrade) {
          return await evaluationService.updateGrade(existingGrade.id, value);
        } else {
          return await evaluationService.createGrade({
            evaluationId,
            criteriaId,
            value
          });
        }
      });
      
      await Promise.all(promises);
      
      showNotification('success', 'Notes enregistrées', 'Les notes ont été enregistrées avec succès.');
      
      // Recharger les données
      const updatedEval = await evaluationService.getEvaluationById(evaluationId);
      setEvaluation(updatedEval);
      
      const updatedGrades = await evaluationService.getGrades(evaluationId);
      setExistingGrades(updatedGrades);
      
      // Rediriger vers la page de détail après un court délai
      setTimeout(() => {
        router.push(`/evaluations/${evaluationId}`);
      }, 1500);
      
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement des notes', err);
      setError('Impossible d\'enregistrer les notes. Veuillez réessayer.');
      showNotification('error', 'Erreur d\'enregistrement', 'Impossible d\'enregistrer les notes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#138784]"></div>
          <p className="text-gray-600">Chargement de l'évaluation...</p>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center space-x-3 text-yellow-600">
            <ExclamationTriangleIcon className="h-8 w-8" />
            <h2 className="text-xl font-semibold">Évaluation non trouvée</h2>
          </div>
          <p className="mt-4 text-gray-600">L'évaluation demandée n'existe pas ou vous n'y avez pas accès.</p>
          <Link 
            href="/evaluations" 
            className="mt-6 inline-flex items-center px-4 py-2 bg-[#138784] text-white rounded-md hover:bg-[#0c6460] transition-colors"
          >
            Retour aux évaluations
          </Link>
        </div>
      </div>
    );
  }

  const canGrade = evaluation.status === 'draft';
  const isTeacherOfEvaluation = user?.userId === evaluation.teacherId;
  const hasCriteria = evaluation.scale?.criteria && evaluation.scale.criteria.length > 0;

  if (!isTeacherOfEvaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center space-x-3 text-red-600">
            <ExclamationTriangleIcon className="h-8 w-8" />
            <h2 className="text-xl font-semibold">Accès refusé</h2>
          </div>
          <p className="mt-4 text-gray-600">Vous n'êtes pas autorisé à noter cette évaluation.</p>
        </div>
      </div>
    );
  }

  const percentage = calculatePercentage();
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link 
              href={`/evaluations/${evaluationId}`} 
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Noter l'évaluation</h1>
              <p className="text-gray-600 mt-1">Attribuez une note pour chaque critère d'évaluation</p>
            </div>
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Panneau d'informations */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpenIcon className="h-5 w-5 mr-2 text-[#138784]" />
                Informations
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{evaluation.title}</p>
                    <p className="text-xs text-gray-500">Titre de l'évaluation</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{evaluation.student?.name}</p>
                    <p className="text-xs text-gray-500">Étudiant évalué</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(evaluation.dateEval).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-gray-500">Date d'évaluation</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <ScaleIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{evaluation.scale?.title}</p>
                    <p className="text-xs text-gray-500">Barème utilisé</p>
                  </div>
                </div>
              </div>

              {/* Score total */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">
                    <span className={getScoreColor(percentage)}>
                      {calculateTotalGrade().toFixed(1)}
                    </span>
                    <span className="text-gray-400 text-xl">/{calculateMaxGrade()}</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    {percentage.toFixed(1)}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        percentage >= 80 ? 'bg-green-500' : 
                        percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire de notation */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {!canGrade ? (
                <div className="p-8 text-center">
                  <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Évaluation verrouillée</h3>
                  <p className="text-gray-600">Cette évaluation ne peut plus être modifiée car elle n'est plus en statut "brouillon".</p>
                </div>
              ) : !hasCriteria ? (
                <div className="p-8 text-center">
                  <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun critère disponible</h3>
                  <p className="text-gray-600 mb-4">Le barème sélectionné ne contient pas de critères d'évaluation.</p>
                  <Link
                    href={`/scales/${evaluation.scaleId}`}
                    className="inline-flex items-center px-4 py-2 bg-[#138784] text-white rounded-md hover:bg-[#0c6460] transition-colors"
                  >
                    Modifier le barème
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Critères d'évaluation</h2>
                    <p className="text-gray-600">Attribuez une note pour chaque critère. La note totale sera calculée automatiquement.</p>
                  </div>

                  <div className="space-y-6">
                    {evaluation.scale?.criteria?.map((criteria, index) => (
                      <div key={criteria.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#138784] text-white text-sm font-medium">
                                {index + 1}
                              </span>
                              <h3 className="text-lg font-semibold text-gray-900">{criteria.description}</h3>
                            </div>
                            <p className="text-gray-600 mb-2">{criteria.associatedSkill}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Coefficient: {criteria.coefficient}</span>
                              <span>•</span>
                              <span>Maximum: {criteria.maxPoints} points</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                max={criteria.maxPoints}
                                step="0.5"
                                className={`w-24 text-center px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                                  validationErrors[criteria.id] 
                                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-300 focus:ring-[#138784] focus:border-[#138784]'
                                }`}
                                value={grades[criteria.id] || ''}
                                onChange={(e) => handleGradeChange(criteria.id, parseFloat(e.target.value) || 0, criteria.maxPoints)}
                                disabled={!canGrade || saving}
                                placeholder="0"
                              />
                              <span className="text-gray-500">/ {criteria.maxPoints}</span>
                            </div>
                            {validationErrors[criteria.id] && (
                              <p className="text-red-500 text-xs">{validationErrors[criteria.id]}</p>
                            )}
                            {grades[criteria.id] !== undefined && (
                              <div className="text-xs text-gray-500">
                                {((grades[criteria.id] / criteria.maxPoints) * 100).toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-8 pt-6 border-t border-gray-200">
                    <Link
                      href={`/evaluations/${evaluationId}`}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-center"
                    >
                      Annuler
                    </Link>
                    
                    <button
                      type="submit"
                      disabled={saving || !canGrade}
                      className="px-6 py-2 bg-[#138784] text-white rounded-md hover:bg-[#0c6460] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Enregistrement...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-5 w-5" />
                          <span>Enregistrer les notes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}