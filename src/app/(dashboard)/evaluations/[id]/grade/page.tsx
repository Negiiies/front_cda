// src/app/(dashboard)/evaluations/[id]/grade/page.tsx - VERSION CORRIGÉE
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
    if (user && user.role !== 'teacher' && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        console.log('🔍 Début du chargement de l\'évaluation', evaluationId);
        
        // Récupérer l'évaluation complète
        const evalData = await evaluationService.getEvaluationById(evaluationId);
        
        if (!evalData) {
          throw new Error('Évaluation non trouvée');
        }
        
        console.log('📊 Évaluation chargée:', {
          id: evalData.id,
          title: evalData.title,
          status: evalData.status,
          teacherId: evalData.teacherId,
          currentUserId: user?.userId,
          scaleId: evalData.scaleId
        });
        
        // Gérer le cas où le barème ou les critères sont manquants
        if (!evalData.scale || !evalData.scale.criteria || evalData.scale.criteria.length === 0) {
          console.log('⚠️ Barème incomplet, chargement séparé...');
          
          if (!evalData.scale) {
            try {
              const scaleData = await scaleService.getScaleById(evalData.scaleId);
              evalData.scale = scaleData;
              console.log('✅ Barème chargé séparément');
            } catch (scaleError) {
              console.error("❌ Erreur lors du chargement du barème:", scaleError);
            }
          }
          
          if (!evalData.scale?.criteria || evalData.scale.criteria.length === 0) {
            try {
              const criteriaData = await scaleService.getCriteriaByScaleId(evalData.scaleId);
              if (criteriaData && criteriaData.length > 0 && evalData.scale) {
                evalData.scale.criteria = criteriaData;
                console.log('✅ Critères chargés séparément:', criteriaData.length);
              }
            } catch (criteriaError) {
              console.error("❌ Erreur lors du chargement des critères:", criteriaError);
            }
          }
        }
        
        // Vérifications de sécurité
        if (evalData.teacherId !== user?.userId && user?.role !== 'admin') {
          throw new Error('Vous n\'êtes pas autorisé à noter cette évaluation');
        }
        
        setEvaluation(evalData);
        
        // Récupérer les notes existantes avec gestion d'erreur améliorée
        try {
          console.log('🔍 Chargement des notes existantes...');
          const gradesData = await evaluationService.getGrades(evaluationId);
          setExistingGrades(gradesData);
          console.log('✅ Notes existantes:', gradesData.length);
          
          // Pré-remplir les notes existantes
          const gradesMap = gradesData.reduce((acc: Record<number, number>, grade: Grade) => {
            acc[grade.criteriaId] = grade.value;
            return acc;
          }, {});
          setGrades(gradesMap);
        } catch (gradesError) {
          console.warn('⚠️ Impossible de charger les notes existantes:', gradesError);
          // Continuer sans les notes existantes - ce n'est pas bloquant
        }
        
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des données', err);
        setError(err.message || 'Impossible de charger les détails de cette évaluation.');
        showNotification('error', 'Erreur de chargement', err.message || 'Impossible de charger cette évaluation.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, router, evaluationId, showNotification]);

  const handleGradeChange = (criteriaId: number, value: number, maxPoints: number) => {
    console.log('📝 Modification de note:', { criteriaId, value, maxPoints });
    
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
    
    setGrades(prev => ({
      ...prev,
      [criteriaId]: value
    }));
  };

  // ✅ NOUVELLES FONCTIONS DE CALCUL TEMPS RÉEL
  const calculateTotalGrade = (): number => {
    if (!evaluation?.scale?.criteria) return 0;
    return evaluation.scale.criteria.reduce((sum, criterion) => {
      const grade = grades[criterion.id] || 0;
      return sum + grade;
    }, 0);
  };

  const calculateMaxGrade = (): number => {
    if (!evaluation?.scale?.criteria) return 0;
    return evaluation.scale.criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0);
  };

  const calculatePercentage = (): number => {
    const total = calculateTotalGrade();
    const max = calculateMaxGrade();
    return max > 0 ? (total / max) * 100 : 0;
  };

  // ✅ NOUVELLE FONCTION POUR CALCULER LE STATUT DE NOTATION
  const getGradingProgress = () => {
    if (!evaluation?.scale?.criteria) return { total: 0, graded: 0, percentage: 0 };
    
    const criteria = evaluation.scale.criteria;
    const gradedCount = criteria.filter(c => 
      grades[c.id] !== undefined && grades[c.id] !== null && !isNaN(grades[c.id])
    ).length;
    
    return {
      total: criteria.length,
      graded: gradedCount,
      percentage: criteria.length > 0 ? (gradedCount / criteria.length) * 100 : 0
    };
  };

  // ✅ HANDLESUBMIT MODIFIÉ POUR PERMETTRE LA NOTATION PARTIELLE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!evaluation?.scale?.criteria) {
      setError('Aucun critère disponible pour cette évaluation.');
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
      const criteria = evaluation.scale.criteria;
      
      // ✅ NOUVEAU : Traiter seulement les critères qui ont des notes valides
      const gradesToSave = criteria.filter(criterion => {
        const value = grades[criterion.id];
        return value !== undefined && value !== null && !isNaN(value) && value >= 0;
      });
      
      console.log('💾 Sauvegarde des notes:', {
        evaluationId,
        gradesToSave: gradesToSave.length,
        totalCriteria: criteria.length
      });
      
      if (gradesToSave.length === 0) {
        showNotification('warning', 'Aucune note à sauvegarder', 'Veuillez saisir au moins une note avant d\'enregistrer.');
        setSaving(false);
        return;
      }
      
      // ✅ TRAITEMENT SÉQUENTIEL CORRIGÉ avec nouvelles signatures
      const results = [];
      
      for (const criterion of gradesToSave) {
        try {
          const criteriaId = criterion.id;
          const value = grades[criteriaId];
          
          if (typeof value !== 'number' || isNaN(value)) {
            console.warn(`⚠️ Valeur invalide pour critère ${criteriaId}:`, value);
            continue;
          }
          
          const existingGrade = existingGrades.find(g => g.criteriaId === criteriaId);
          
          console.log(`💾 Traitement critère ${criteriaId}:`, {
            value,
            existingGrade: existingGrade?.id,
            operation: existingGrade ? 'update' : 'create'
          });
          
          let result;
          if (existingGrade) {
            // ✅ FIX : Utiliser la nouvelle signature pour updateGrade
            result = await evaluationService.updateGrade({
              gradeId: existingGrade.id,
              evaluationId: evaluationId,
              value: value
            });
            console.log(`✅ Note mise à jour pour critère ${criteriaId}`);
          } else {
            // ✅ Créer une nouvelle note
            const gradeData = {
              evaluationId: Number(evaluationId),
              criteriaId: Number(criteriaId),
              value: Number(value)
            };
            
            console.log('📝 Création de note:', gradeData);
            
            result = await evaluationService.createGrade(gradeData);
            console.log(`✅ Note créée pour critère ${criteriaId}`);
          }
          results.push(result);
        } catch (gradeError: any) {
          console.error(`❌ Erreur pour critère ${criterion.id}:`, gradeError);
          
          if (gradeError.response) {
            console.error('Réponse serveur:', gradeError.response.data);
          }
          
          throw new Error(`Erreur lors de la sauvegarde du critère "${criterion.description}": ${gradeError.message || 'Erreur inconnue'}`);
        }
      }
      
      const gradedCount = gradesToSave.length;
      const totalCount = criteria.length;
      
      let successMessage = 'Les notes ont été enregistrées avec succès.';
      if (gradedCount < totalCount) {
        successMessage += ` (${gradedCount}/${totalCount} critères notés)`;
      }
      
      showNotification('success', 'Notes enregistrées', successMessage);
      
      // ✅ RECHARGER LES DONNÉES POUR SYNCHRONISER L'AFFICHAGE
      try {
        const updatedEval = await evaluationService.getEvaluationById(evaluationId);
        setEvaluation(updatedEval);
        
        const updatedGrades = await evaluationService.getGrades(evaluationId);
        setExistingGrades(updatedGrades);
        
        const updatedGradesMap = updatedGrades.reduce((acc: Record<number, number>, grade: Grade) => {
          acc[grade.criteriaId] = grade.value;
          return acc;
        }, {});
        setGrades(updatedGradesMap);
        
        console.log('✅ Données rechargées après sauvegarde');
      } catch (reloadError) {
        console.warn('⚠️ Erreur lors du rechargement des données:', reloadError);
      }
      
      // ✅ NOUVEAU : Redirection optionnelle seulement si toutes les notes sont complètes
      if (gradedCount === totalCount) {
        setTimeout(() => {
          router.push(`/evaluations/${evaluationId}`);
        }, 1500);
      }
      
    } catch (err: any) {
      console.error('❌ Erreur lors de l\'enregistrement des notes:', err);
      
      let errorMessage = 'Impossible d\'enregistrer les notes.';
      
      if (err.response?.status === 403) {
        errorMessage = 'Vous n\'êtes pas autorisé à modifier ces notes.';
      } else if (err.response?.status === 404) {
        errorMessage = 'L\'évaluation ou les critères n\'ont pas été trouvés.';
      } else if (err.response?.status === 400) {
        const serverMessage = err.response.data?.message;
        const validationErrors = err.response.data?.errors;
        
        if (validationErrors && Array.isArray(validationErrors)) {
          errorMessage = 'Erreurs de validation: ' + validationErrors.map((e: any) => e.message).join(', ');
        } else if (serverMessage) {
          errorMessage = serverMessage;
        } else {
          errorMessage = 'Données invalides.';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      showNotification('error', 'Erreur d\'enregistrement', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#138784]"></div>
          <p className="text-gray-700 font-medium">Chargement de l'évaluation...</p>
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
            <h2 className="text-xl font-semibold text-gray-900">Évaluation non trouvée</h2>
          </div>
          <p className="mt-4 text-gray-700">L'évaluation demandée n'existe pas ou vous n'y avez pas accès.</p>
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

  const canGrade = evaluation.status === 'draft' || evaluation.status === 'published';
  const isTeacherOfEvaluation = user?.userId === evaluation.teacherId || user?.role === 'admin';
  const hasCriteria = evaluation.scale?.criteria && evaluation.scale.criteria.length > 0;

  if (!isTeacherOfEvaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center space-x-3 text-red-600">
            <ExclamationTriangleIcon className="h-8 w-8" />
            <h2 className="text-xl font-semibold text-gray-900">Accès refusé</h2>
          </div>
          <p className="mt-4 text-gray-700">Vous n'êtes pas autorisé à noter cette évaluation.</p>
        </div>
      </div>
    );
  }

  // ✅ CALCULS TEMPS RÉEL POUR L'AFFICHAGE
  const percentage = calculatePercentage();
  const gradingProgress = getGradingProgress();
  
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-700';
    if (percentage >= 60) return 'text-yellow-700';
    return 'text-red-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* En-tête avec debugging info en développement */}
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
              <p className="text-gray-700 mt-1 font-medium">
                Attribuez une note pour chaque critère d'évaluation
                {evaluation.status !== 'draft' && (
                  <span className="ml-2 text-sm text-blue-600">• Évaluation {evaluation.status === 'published' ? 'publiée' : 'archivée'}</span>
                )}
              </p>
              {/* ✅ NOUVEL INDICATEUR DE PROGRESSION */}
              <div className="mt-2 flex items-center space-x-4 text-sm">
                <span className="text-gray-600">
                  Progression: <span className="font-semibold text-gray-900">{gradingProgress.graded}/{gradingProgress.total} critères</span>
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        gradingProgress.percentage === 100 ? 'bg-green-500' : 
                        gradingProgress.percentage > 0 ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${gradingProgress.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {gradingProgress.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Message informatif pour évaluations publiées */}
        {evaluation.status === 'published' && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-blue-400 mr-2" />
              <p className="text-blue-800 font-medium">
                Cette évaluation est publiée. Les modifications des notes seront visibles par l'étudiant immédiatement.
              </p>
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
                  <AcademicCapIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{evaluation.title}</p>
                    <p className="text-xs text-gray-600 font-medium">Titre de l'évaluation</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{evaluation.student?.name}</p>
                    <p className="text-xs text-gray-600 font-medium">Étudiant évalué</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(evaluation.dateEval).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">Date d'évaluation</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <ScaleIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{evaluation.scale?.title}</p>
                    <p className="text-xs text-gray-600 font-medium">Barème utilisé</p>
                  </div>
                </div>
              </div>

              {/* ✅ SCORE TOTAL TEMPS RÉEL AMÉLIORÉ */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">
                    <span className={getScoreColor(percentage)}>
                      {calculateTotalGrade().toFixed(1)}
                    </span>
                    <span className="text-gray-600 text-xl">/{calculateMaxGrade()}</span>
                  </div>
                  <div className="text-sm text-gray-700 mb-2 font-semibold">
                    {percentage.toFixed(1)}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        percentage >= 80 ? 'bg-green-500' : 
                        percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                  {/* ✅ NOUVEL INDICATEUR DE STATUT */}
                  <div className="text-xs text-gray-600">
                    {gradingProgress.graded === gradingProgress.total ? (
                      <span className="text-green-600 font-semibold">✓ Notation complète</span>
                    ) : gradingProgress.graded > 0 ? (
                      <span className="text-blue-600 font-semibold">📝 En cours ({gradingProgress.graded}/{gradingProgress.total})</span>
                    ) : (
                      <span className="text-gray-500">⚪ Pas encore commencé</span>
                    )}
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
                  <p className="text-gray-700">Cette évaluation est archivée et ne peut plus être modifiée.</p>
                </div>
              ) : !hasCriteria ? (
                <div className="p-8 text-center">
                  <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun critère disponible</h3>
                  <p className="text-gray-700 mb-4">Le barème sélectionné ne contient pas de critères d'évaluation.</p>
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
                    <p className="text-gray-700 font-medium">
                      Attribuez une note pour chaque critère. Vous pouvez enregistrer des notes partielles.
                    </p>
                    {/* ✅ NOUVEL INDICATEUR VISUEL DE PROGRESSION */}
                    {gradingProgress.graded > 0 && gradingProgress.graded < gradingProgress.total && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <span className="font-semibold">Progression:</span> {gradingProgress.graded} sur {gradingProgress.total} critères notés. 
                          <span className="ml-1">Vous pouvez enregistrer et continuer plus tard.</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {evaluation.scale?.criteria?.map((criterion, index) => (
                      <div key={criterion.id} className={`rounded-lg p-6 border transition-all duration-200 ${
                        grades[criterion.id] !== undefined && !isNaN(grades[criterion.id]) 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium ${
                                grades[criterion.id] !== undefined && !isNaN(grades[criterion.id])
                                  ? 'bg-green-500 text-white'
                                  : 'bg-[#138784] text-white'
                              }`}>
                                {grades[criterion.id] !== undefined && !isNaN(grades[criterion.id]) ? '✓' : index + 1}
                              </span>
                              <h3 className="text-lg font-semibold text-gray-900">{criterion.description}</h3>
                            </div>
                            <p className="text-gray-700 mb-2 font-medium">{criterion.associatedSkill}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-700 font-medium">
                              <span>Coefficient: {criterion.coefficient}</span>
                              <span>•</span>
                              <span>Maximum: {criterion.maxPoints} points</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                max={criterion.maxPoints}
                                step="0.5"
                                className={`w-24 text-center px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors font-semibold text-gray-900 ${
                                  validationErrors[criterion.id] 
                                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-300 focus:ring-[#138784] focus:border-[#138784]'
                                }`}
                                value={grades[criterion.id] !== undefined ? grades[criterion.id] : ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                  if (value !== undefined) {
                                    handleGradeChange(criterion.id, value, criterion.maxPoints);
                                  } else {
                                    setGrades(prev => {
                                      const newGrades = { ...prev };
                                      delete newGrades[criterion.id];
                                      return newGrades;
                                    });
                                  }
                                }}
                                disabled={!canGrade || saving}
                                placeholder="0"
                              />
                              <span className="text-gray-700 font-semibold">/ {criterion.maxPoints}</span>
                            </div>
                            {validationErrors[criterion.id] && (
                              <p className="text-red-600 text-xs font-medium">{validationErrors[criterion.id]}</p>
                            )}
                            {grades[criterion.id] !== undefined && !isNaN(grades[criterion.id]) && (
                              <div className="text-xs text-gray-700 font-semibold">
                                {((grades[criterion.id] / criterion.maxPoints) * 100).toFixed(1)}%
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
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-800 hover:bg-gray-50 transition-colors text-center font-medium"
                    >
                      Annuler
                    </Link>
                    
                    <button
                      type="submit"
                      disabled={saving || !canGrade}
                      className="px-6 py-2 bg-[#138784] text-white rounded-md hover:bg-[#0c6460] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 font-medium"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Enregistrement...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-5 w-5" />
                          <span>
                            {gradingProgress.graded === 0 ? 'Enregistrer les notes' :
                             gradingProgress.graded < gradingProgress.total ? 'Enregistrer les modifications' :
                             'Finaliser la notation'}
                          </span>
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