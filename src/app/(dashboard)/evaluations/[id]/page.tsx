// src/app/(dashboard)/evaluations/[id]/page.tsx - VERSION COMPLÈTE CORRIGÉE
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../lib/auth';
import evaluationService, { Evaluation, Grade } from '../../../../services/evaluationService';
import scaleService from '../../../../services/scaleService';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  UserIcon, 
  AcademicCapIcon, 
  ArchiveBoxIcon, 
  PencilIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  ExclamationCircleIcon,
  TrophyIcon,
  EyeSlashIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { useNotification } from '../../../../contexts/NotificationContext';

export default function EvaluationDetailPage() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const params = useParams();
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const evaluationId = Number(params.id);

  // Fonctions utilitaires pour les statuts
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'published': return 'Publiée';
      case 'archived': return 'Archivée';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ✅ FONCTION CORRIGÉE : Déterminer si on peut voir les détails
  const shouldShowEvaluation = (evalData: Evaluation | null) => {
    if (!evalData) return false;
    
    // Les professeurs et admins voient toujours tout
    if (user?.role === 'teacher' || user?.role === 'admin') return true;
    
    // Les étudiants voient les détails dès que l'évaluation est "published"
    if (user?.role === 'student') {
      return evalData.status === 'published' || evalData.status === 'archived';
    }
    
    return true;
  };

  // ✅ FONCTION CORRIGÉE : Déterminer l'affichage des résultats
  const shouldShowResults = (evalData: Evaluation | null) => {
    if (!evalData) return false;
    
    // Les professeurs et admins voient toujours les résultats
    if (user?.role === 'teacher' || user?.role === 'admin') return true;
    
    // Les étudiants voient les résultats si évaluation publiée ET qu'il y a des notes
    if (user?.role === 'student') {
      const hasGrades = evalData.grades && Array.isArray(evalData.grades) && evalData.grades.length > 0;
      return evalData.status === 'published' && hasGrades;
    }
    
    return true;
  };

  // ✅ FONCTION CORRIGÉE : Obtenir le statut de notation
  const getGradingStatus = () => {
    if (!evaluation?.scale?.criteria || !Array.isArray(evaluation.scale.criteria)) return null;
    
    const criteria = evaluation.scale.criteria;
    const grades = evaluation?.grades || [];
    
    const gradedCount = criteria.filter(c => 
      grades.some(g => g.criteriaId === c.id && g.value !== undefined && g.value !== null)
    ).length;
    
    return { 
      total: criteria.length, 
      graded: gradedCount,
      isComplete: gradedCount === criteria.length,
      percentage: criteria.length > 0 ? (gradedCount / criteria.length) * 100 : 0
    };
  };

  // ✅ FONCTION CORRIGÉE : Calculs des statistiques temps réel
  const calculateGradeStats = () => {
    // Vérification stricte de l'existence des données
    if (!evaluation?.grades || 
        !Array.isArray(evaluation.grades) || 
        !evaluation?.scale?.criteria || 
        !Array.isArray(evaluation.scale.criteria)) {
      return { totalPoints: 0, maxPoints: 0, percentage: 0, averageScore: 0 };
    }

    const grades = evaluation.grades;
    const criteria = evaluation.scale.criteria;

    // Vérifier que chaque grade.value existe avant de l'utiliser
    const totalPoints = grades.reduce((sum, grade) => {
      const value = (grade.value !== undefined && grade.value !== null) ? grade.value : 0;
      return sum + value;
    }, 0);
    
    const maxPoints = criteria.reduce((sum, criterion) => sum + (criterion.maxPoints || 0), 0);
    const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

    // Calcul de la moyenne pondérée par coefficient
    let weightedSum = 0;
    let totalWeight = 0;
    
    grades.forEach(grade => {
      const criterion = criteria.find(c => c.id === grade.criteriaId);
      // Vérifier que grade.value n'est pas undefined/null
      if (criterion && 
          grade.value !== undefined && 
          grade.value !== null && 
          !isNaN(grade.value) &&
          criterion.maxPoints > 0) {
        const score = (grade.value / criterion.maxPoints) * 100;
        weightedSum += score * (criterion.coefficient || 1);
        totalWeight += (criterion.coefficient || 1);
      }
    });

    const averageScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return { totalPoints, maxPoints, percentage, averageScore };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Début du chargement de l\'évaluation', evaluationId);
        
        // ÉTAPE 1: Charger l'évaluation de base
        let evalData = await evaluationService.getEvaluationById(evaluationId);
        console.log('📋 Évaluation chargée:', {
          id: evalData.id,
          title: evalData.title,
          status: evalData.status,
          studentId: evalData.studentId,
          teacherId: evalData.teacherId,
          userRole: user?.role,
          userId: user?.userId
        });
        
        // ÉTAPE 2: Vérification d'accès pour les étudiants
        if (user?.role === 'student') {
          console.log('🎓 Vérification accès étudiant:', {
            evaluationStudentId: evalData.studentId,
            currentUserId: user.userId,
            evaluationStatus: evalData.status
          });
          
          if (evalData.studentId !== user.userId) {
            console.error('❌ Accès refusé - Étudiant différent');
            setError('Vous n\'avez pas accès à cette évaluation.');
            showNotification('error', 'Accès refusé', 'Vous n\'avez pas accès à cette évaluation.');
            return;
          }
          
          if (evalData.status === 'draft') {
            console.error('❌ Accès refusé - Évaluation en brouillon');
            setError('Cette évaluation n\'est pas encore disponible.');
            showNotification('warning', 'Évaluation non disponible', 'Cette évaluation n\'est pas encore prête.');
            return;
          }
        }
        
        // ÉTAPE 3: S'assurer que les critères sont chargés
        if (!evalData.scale || !evalData.scale.criteria || evalData.scale.criteria.length === 0) {
          console.log('⚠️ Critères manquants, chargement séparé...');
          
          try {
            if (!evalData.scale) {
              console.log('📊 Chargement du barème...');
              const scaleData = await scaleService.getScaleById(evalData.scaleId);
              evalData.scale = scaleData;
              console.log('✅ Barème chargé:', scaleData?.title);
            }
            
            if (!evalData.scale?.criteria || evalData.scale.criteria.length === 0) {
              console.log('📝 Chargement des critères...');
              const criteriaData = await scaleService.getCriteriaByScaleId(evalData.scaleId);
              if (criteriaData && criteriaData.length > 0 && evalData.scale) {
                evalData.scale.criteria = criteriaData;
                console.log('✅ Critères chargés:', criteriaData.length, 'critères');
              }
            }
          } catch (loadError) {
            console.error('❌ Erreur lors du chargement des critères:', loadError);
          }
        }
  
        // ÉTAPE 4: Recharger les notes pour s'assurer qu'elles sont à jour
        try {
          console.log('📊 Rechargement des notes...');
          const freshGrades = await evaluationService.getGrades(evaluationId);
          
          if (freshGrades && Array.isArray(freshGrades)) {
            evalData.grades = freshGrades;
            console.log('✅ Notes rechargées:', freshGrades.length, 'notes');
          } else {
            evalData.grades = [];
            console.log('⚠️ Aucune note trouvée, initialisation avec tableau vide');
          }
        } catch (gradesError) {
          console.warn('⚠️ Impossible de recharger les notes:', gradesError);
          if (!evalData.grades) {
            evalData.grades = [];
          }
        }
        
        // ✅ ÉTAPE 5 NOUVELLE: Charger les commentaires
        try {
          console.log('💬 Chargement des commentaires...');
          const comments = await evaluationService.getComments(evaluationId);
          
          if (comments && Array.isArray(comments)) {
            evalData.comments = comments;
            console.log('✅ Commentaires chargés:', comments.length, 'commentaires');
          } else {
            evalData.comments = [];
            console.log('⚠️ Aucun commentaire trouvé, initialisation avec tableau vide');
          }
        } catch (commentsError) {
          console.warn('⚠️ Impossible de charger les commentaires:', commentsError);
          evalData.comments = [];
        }
        
        // ÉTAPE 6: Vérification finale et debug
        console.log('🔍 État final:', {
          shouldShowEval: shouldShowEvaluation(evalData),
          shouldShowResults: shouldShowResults(evalData),
          hasGrades: evalData.grades?.length > 0,
          gradesCount: evalData.grades?.length || 0,
          hasComments: evalData.comments?.length > 0,
          commentsCount: evalData.comments?.length || 0,
          userRole: user?.role
        });
        
        setEvaluation(evalData);
        
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des données:', err);
        setError('Impossible de charger les détails de cette évaluation.');
        showNotification('error', 'Erreur de chargement', 'Impossible de charger les détails de cette évaluation.');
      } finally {
        setLoading(false);
      }
    };
  
    if (evaluationId) {
      fetchData();
    }
  }, [evaluationId, showNotification, user]);
  
  // ✅ CORRECTION MAJEURE : Publier même sans toutes les notes
  const handleChangeStatus = async (newStatus: 'published' | 'archived') => {
    try {
      setChangingStatus(true);
      
      // ✅ MESSAGE POSITIF pour la publication
      if (newStatus === 'published') {
        const gradingStatus = getGradingStatus();
        if (gradingStatus && gradingStatus.graded < gradingStatus.total) {
          const shouldContinue = window.confirm(
            `🎯 Publier l'évaluation "${evaluation?.title}" ?\n\n` +
            `📊 État actuel:\n` +
            `• ${gradingStatus.graded} critères notés sur ${gradingStatus.total}\n` +
            `• ${gradingStatus.total - gradingStatus.graded} critères restants\n\n` +
            `✅ Avantages de la publication:\n` +
            `• Les étudiants peuvent consulter les critères d'évaluation\n` +
            `• Vous pourrez ajouter/modifier les notes à tout moment\n` +
            `• Les notes seront visibles dès que vous les ajouterez\n\n` +
            `Voulez-vous publier maintenant ?`
          );
          if (!shouldContinue) {
            setChangingStatus(false);
            return;
          }
        }
      }
      
      if (newStatus === 'archived') {
        const shouldContinue = window.confirm(
          `📁 Archiver l'évaluation "${evaluation?.title}" ?\n\n` +
          `⚠️ L'évaluation ne sera plus modifiable après archivage.\n` +
          `📋 Elle restera visible par l'étudiant en lecture seule.\n\n` +
          `Confirmer l'archivage ?`
        );
        if (!shouldContinue) {
          setChangingStatus(false);
          return;
        }
      }
      
      const updatedEvaluation = await evaluationService.changeStatus(evaluationId, newStatus);
      setEvaluation(updatedEvaluation);
      
      let successMessage = '';
      switch (newStatus) {
        case 'published':
          const gradingStatus = getGradingStatus();
          successMessage = `🎉 L'évaluation a été publiée avec succès ! ` +
            `Les étudiants peuvent maintenant la consulter. ` +
            (gradingStatus && gradingStatus.graded < gradingStatus.total 
              ? `Vous pouvez continuer à ajouter les notes (${gradingStatus.graded}/${gradingStatus.total} complétées).`
              : `Toutes les notes sont complètes !`);
          break;
        case 'archived':
          successMessage = '📁 L\'évaluation a été archivée avec succès.';
          break;
      }
      
      showNotification('success', 'Statut mis à jour', successMessage);
      
    } catch (err: any) {
      console.error('Erreur lors du changement de statut', err);
      
      let errorMessage = 'Impossible de changer le statut de cette évaluation.';
      
      // Messages d'erreur spécifiques
      if (err.response?.status === 400) {
        if (err.response?.data?.message?.includes('All criteria must be graded')) {
          errorMessage = '⚠️ Restriction de notes complètes détectée. Contactez l\'administrateur - cette restriction devrait être supprimée.';
        } else {
          errorMessage = err.response.data?.message || errorMessage;
        }
      } else if (err.response?.status === 403) {
        errorMessage = 'Vous n\'êtes pas autorisé à modifier le statut de cette évaluation.';
      }
      
      showNotification('error', 'Erreur', errorMessage);
    } finally {
      setChangingStatus(false);
    }
  };

  // ✅ CORRECTION MAJEURE : Commentaires corrigés
  // ✅ FONCTION handleAddComment CORRIGÉE
const handleAddComment = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!commentText.trim()) {
    showNotification('warning', 'Commentaire vide', 'Veuillez saisir un commentaire avant d\'envoyer.');
    return;
  }
  
  try {
    setSubmittingComment(true);
    // ❌ SUPPRIMÉ : setError(null); - Ne pas toucher à l'état error ici
    
    console.log('📝 AVANT appel service - evaluationId:', evaluationId, 'text:', commentText.trim());
    
    const newComment = await evaluationService.addComment(evaluationId, commentText.trim());
    
    console.log('📝 APRÈS appel service - newComment:', newComment);
    console.log('📝 Type de newComment:', typeof newComment);
    
    // ✅ VÉRIFICATION : Le commentaire est-il valide ?
    if (!newComment || !newComment.id) {
      console.error('❌ Commentaire invalide reçu:', newComment);
      throw new Error('Commentaire invalide reçu du serveur');
    }
    
    console.log('📝 AVANT mise à jour état...');
    
    // ✅ AMÉLIORATION: Mise à jour optimiste de l'état
    setEvaluation(prev => {
      console.log('📝 État précédent:', prev?.comments?.length || 0, 'commentaires');
      if (!prev) return prev;
      const updatedComments = [newComment, ...(prev.comments || [])];
      console.log('📝 Nouvel état:', updatedComments.length, 'commentaires');
      return { ...prev, comments: updatedComments };
    });
    
    setCommentText('');
    showNotification('success', 'Commentaire ajouté', 'Votre commentaire a été ajouté avec succès.');
    
    console.log('✅ SUCCÈS COMPLET !');
    
  } catch (err: any) {
    console.error('❌ ERREUR CATCHÉE dans handleAddComment:', err);
    console.error('❌ Type d\'erreur:', typeof err);
    console.error('❌ Stack trace:', err.stack);
    
    let errorMessage = 'Impossible d\'ajouter ce commentaire.';
    
    if (err.response?.status === 403) {
      errorMessage = 'Vous n\'êtes pas autorisé à commenter cette évaluation.';
    } else if (err.response?.status === 404) {
      errorMessage = 'Route de commentaire non trouvée. Contactez l\'administrateur.';
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
    
    // ❌ SUPPRIMÉ : setError(errorMessage); - C'était ça qui causait le problème !
    showNotification('error', 'Erreur', errorMessage);
  } finally {
    setSubmittingComment(false);
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
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
        <div className="flex">
          <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{error}</p>
            <div className="mt-4">
              <Link 
                href="/evaluations" 
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                ← Retour aux évaluations
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
        <p className="text-sm text-yellow-700">Évaluation non trouvée.</p>
      </div>
    );
  }

  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';
  const isTeacherOfEvaluation = isTeacher && user?.userId === evaluation.teacherId;
  const canEdit = isTeacherOfEvaluation && evaluation.status === 'draft';
  const canGrade = isTeacherOfEvaluation && (evaluation.status === 'draft' || evaluation.status === 'published');
  const canPublish = isTeacherOfEvaluation && evaluation.status === 'draft';
  const canArchive = isTeacherOfEvaluation && evaluation.status === 'published';
  const canComment = isTeacherOfEvaluation && (evaluation.status === 'draft' || evaluation.status === 'published');

  // Calculs corrigés
  const gradeStats = calculateGradeStats();
  const gradingStatus = getGradingStatus();

  // Conditions d'affichage pour étudiants
  const showEvaluationDetails = shouldShowEvaluation(evaluation);
  const showResults = shouldShowResults(evaluation);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Link href="/evaluations" className="text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">{evaluation.title}</h1>
          </div>
          <div className="text-sm text-gray-500">
            Date d'évaluation: {new Date(evaluation.dateEval).toLocaleDateString('fr-FR')}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Badge de statut avec info de notation */}
          <div className="text-right">
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusClass(evaluation.status)}`}>
              {getStatusLabel(evaluation.status)}
            </span>
            {gradingStatus && isTeacherOfEvaluation && (
              <div className="text-xs text-gray-500 mt-1">
                Notes: {gradingStatus.graded}/{gradingStatus.total} critères
                {gradingStatus.isComplete ? (
                  <span className="text-green-600 ml-1 font-semibold">• Complètes</span>
                ) : gradingStatus.graded > 0 ? (
                  <span className="text-blue-600 ml-1 font-semibold">• En cours</span>
                ) : (
                  <span className="text-amber-600 ml-1">• À commencer</span>
                )}
              </div>
            )}
          </div>
          
          {/* Boutons d'action */}
          {isTeacherOfEvaluation && (
            <div className="flex space-x-2">
              {canPublish && (
                <button
                  onClick={() => handleChangeStatus('published')}
                  disabled={changingStatus}
                  className="bg-green-600 text-white px-3 py-1 rounded-md flex items-center space-x-1 text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Publier</span>
                </button>
              )}
              
              {canGrade && (
                <Link
                  href={`/evaluations/${evaluationId}/grade`}
                  className="bg-[#138784] text-white px-3 py-1 rounded-md flex items-center space-x-1 text-sm hover:bg-[#0c6460]"
                >
                  <span>
                    {gradingStatus && gradingStatus.graded > 0 ? 'Modifier notes' : 'Noter'}
                  </span>
                </Link>
              )}
              
              {canEdit && (
                <Link
                  href={`/evaluations/${evaluationId}/edit`}
                  className="bg-blue-600 text-white px-3 py-1 rounded-md flex items-center space-x-1 text-sm hover:bg-blue-700"
                >
                  <PencilIcon className="h-4 w-4" />
                  <span>Modifier</span>
                </Link>
              )}
              
              {canArchive && (
                <button
                  onClick={() => handleChangeStatus('archived')}
                  disabled={changingStatus}
                  className="bg-gray-600 text-white px-3 py-1 rounded-md flex items-center space-x-1 text-sm hover:bg-gray-700 disabled:opacity-50"
                >
                  <ArchiveBoxIcon className="h-4 w-4" />
                  <span>Archiver</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message informatif pour les étudiants sur évaluation draft */}
      {isStudent && evaluation.status === 'draft' && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-blue-700">
                Cette évaluation est encore en préparation. Elle sera accessible dès qu'elle sera publiée par votre professeur.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message si l'étudiant ne peut pas voir les détails */}
      {isStudent && !showEvaluationDetails && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex">
            <EyeSlashIcon className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-700">
                Cette évaluation n'est pas encore disponible. Contactez votre professeur pour plus d'informations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section des informations principales - VISIBLE POUR ÉTUDIANTS SI PUBLIÉE */}
      {showEvaluationDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne 1: Informations */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Informations</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <AcademicCapIcon className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Professeur</p>
                  <p className="font-medium text-sm">{evaluation.teacher?.name || 'Non défini'}</p>
                </div>
              </div>
              
              {/* Afficher l'étudiant seulement pour professeurs/admin */}
              {!isStudent && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Étudiant</p>
                    <p className="font-medium text-sm">{evaluation.student?.name || 'Non défini'}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <ClockIcon className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Créée le</p>
                  <p className="font-medium text-sm">{new Date(evaluation.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              {/* Informations sur le barème pour les étudiants */}
              {isStudent && evaluation.scale && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <BookOpenIcon className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Barème d'évaluation</p>
                    <p className="font-medium text-sm">{evaluation.scale.title}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Colonne 2: Notes ou aperçu barème */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                {showResults && evaluation.grades && evaluation.grades.length > 0 ? (
                  <TrophyIcon className="h-5 w-5 text-indigo-600" />
                ) : (
                  <BookOpenIcon className="h-5 w-5 text-indigo-600" />
                )}
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {showResults && evaluation.grades && evaluation.grades.length > 0 ? 'Résultats' : 'Barème d\'évaluation'}
              </h2>
            </div>
            
            {/* Affichage conditionnel : Résultats si disponibles ET autorisés */}
            {showResults && evaluation.grades && evaluation.grades.length > 0 ? (
              <div className="space-y-4">
                {/* Score global */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {gradeStats.totalPoints.toFixed(1)} / {gradeStats.maxPoints}
                    </div>
                    <div className={`text-lg font-semibold mb-2 ${
                      gradeStats.percentage >= 70 ? 'text-green-600' :
                      gradeStats.percentage >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {gradeStats.percentage.toFixed(1)}%
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          gradeStats.percentage >= 70 ? 'bg-green-500' :
                          gradeStats.percentage >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(gradeStats.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Détail par critère */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Détail par critère</h4>
                  {evaluation.grades.slice(0, 4).map((grade, index) => {
                    const criterion = evaluation.scale?.criteria?.find(c => c.id === grade.criteriaId);
                    const percentage = criterion && criterion.maxPoints > 0 ? (grade.value / criterion.maxPoints) * 100 : 0;
                    
                    return (
                      <div key={grade.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3 flex-1">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                            percentage >= 70 ? 'bg-green-500' :
                            percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {criterion?.description || 'Critère inconnu'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Coefficient: {criterion?.coefficient || 1}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">
                              {grade.value.toFixed(1)}/{criterion?.maxPoints || 0}
                            </div>
                            <div className={`text-xs font-medium ${
                              percentage >= 70 ? 'text-green-600' :
                              percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {percentage.toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {evaluation.grades.length > 4 && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      +{evaluation.grades.length - 4} autres critères notés
                    </p>
                  )}
                </div>
              </div>
            ) : (
              // Affichage du barème pour tous (étudiants et professeurs)
              evaluation.scale && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-gray-900">{evaluation.scale.title}</h3>
                    {evaluation.scale.description && (
                      <p className="text-xs text-gray-600 mt-1">{evaluation.scale.description}</p>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{evaluation.scale.criteria?.length || 0}</span> critères d'évaluation
                    {gradeStats.maxPoints > 0 && (
                      <span className="ml-2">• <span className="font-medium">{gradeStats.maxPoints}</span> points au total</span>
                    )}
                  </div>

                  {/* Indicateur de progression pour les professeurs */}
                  {gradingStatus && isTeacherOfEvaluation && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">Progression des notes</span>
                        <span className="font-bold text-gray-900">{gradingStatus.graded}/{gradingStatus.total}</span>
                      </div>
                      <div className="mb-3 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            gradingStatus.isComplete ? 'bg-green-500' : 
                            gradingStatus.graded > 0 ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                          style={{ width: `${gradingStatus.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {gradingStatus.isComplete ? (
                          <span className="text-green-600 font-semibold">✅ Tous les critères sont notés</span>
                        ) : gradingStatus.graded > 0 ? (
                          <span className="text-blue-600 font-semibold">📝 Notation en cours - vous pouvez publier</span>
                        ) : (
                          <span className="text-gray-500">⚪ Notation pas encore commencée</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Aperçu des critères pour TOUS (étudiants et professeurs) */}
                  {evaluation.scale.criteria && evaluation.scale.criteria.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Critères d'évaluation</h4>
                      <div className="space-y-2">
                        {evaluation.scale.criteria.slice(0, isStudent ? 4 : 3).map((criterion, index) => (
                          <div key={criterion.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700">
                                {criterion.description}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                <span>{criterion.maxPoints} points</span>
                                <span>•</span>
                                <span>Coefficient: {criterion.coefficient}</span>
                                {criterion.associatedSkill && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{criterion.associatedSkill}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {evaluation.scale.criteria.length > (isStudent ? 4 : 3) && (
                          <p className="text-xs text-gray-500 text-center">
                            +{evaluation.scale.criteria.length - (isStudent ? 4 : 3)} autres critères
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Message informatif pour les étudiants si pas de notes */}
                  {isStudent && (!evaluation.grades || evaluation.grades.length === 0) && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start space-x-2">
                        <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">En attente de notation</p>
                          <p className="text-xs text-blue-600 mt-1">
                            Votre professeur n'a pas encore attribué de notes pour cette évaluation. 
                            Vous serez notifié dès qu'elles seront disponibles.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Section des commentaires - VISIBLE SI ÉVALUATION ACCESSIBLE */}
      {showEvaluationDetails && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <ChatBubbleLeftIcon className="h-5 w-5 text-teal-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Commentaires</h2>
          </div>
          
          {/* ✅ FORMULAIRE COMMENTAIRES CORRIGÉ */}
          {canComment && (
            <div className="mb-6">
              <form onSubmit={handleAddComment} className="space-y-3">
                <div className="relative">
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784] text-sm text-gray-900 bg-white resize-none placeholder-gray-400"
                    rows={4}
                    placeholder="Ajouter un commentaire sur cette évaluation..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={submittingComment}
                    maxLength={1000}
                    required
                    style={{ 
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      opacity: 1
                    }}
                  />
                  {/* Compteur de caractères */}
                  <div className="absolute bottom-2 right-3 text-xs text-gray-400 bg-white px-1">
                    {commentText.length}/1000
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {evaluation.status === 'published' && (
                      <span className="text-blue-600 font-medium">• Ce commentaire sera visible par l'étudiant</span>
                    )}
                    {evaluation.status === 'draft' && (
                      <span className="text-yellow-600 font-medium">• Ce commentaire ne sera visible qu'après publication</span>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim() || commentText.length > 1000}
                    className="bg-[#138784] text-white px-6 py-2 rounded-lg hover:bg-[#0c6460] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 flex items-center space-x-2"
                  >
                    {submittingComment ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Envoi...</span>
                      </>
                    ) : (
                      <>
                        <ChatBubbleLeftIcon className="h-4 w-4" />
                        <span>Ajouter le commentaire</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Message si pas autorisé à commenter */}
          {isTeacherOfEvaluation && !canComment && (
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600 text-sm text-center">
                Les commentaires ne peuvent pas être ajoutés sur les évaluations archivées.
              </p>
            </div>
          )}

          {/* ✅ LISTE DES COMMENTAIRES AMÉLIORÉE */}
          <div className="space-y-4">
            {!evaluation.comments || evaluation.comments.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <ChatBubbleLeftIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    {isStudent ? 
                      'Aucun commentaire de votre professeur pour le moment.' : 
                      'Aucun commentaire pour le moment.'
                    }
                  </p>
                  {canComment && (
                    <p className="text-gray-400 text-xs mt-2">Soyez le premier à ajouter un commentaire !</p>
                  )}
                </div>
              </div>
            ) : (
              evaluation.comments.map((comment) => (
                <div key={comment.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#138784] rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {isStudent ? 'P' : (comment.teacher?.name?.charAt(0) || 'P')}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {isStudent ? 'Votre professeur' : (comment.teacher?.name || 'Professeur')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Badge statut si pertinent */}
                    {evaluation.status === 'draft' && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Brouillon
                      </span>
                    )}
                  </div>
                  <div className="pl-11">
                    <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap font-normal" style={{ color: '#111827', opacity: 1 }}>
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}