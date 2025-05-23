// src/app/(dashboard)/evaluations/[id]/page.tsx - version compacte
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../lib/auth';
import evaluationService, { Evaluation, Grade } from '../../../../services/evaluationService';
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
  TrophyIcon
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const evalData = await evaluationService.getEvaluationById(evaluationId);
        setEvaluation(evalData);
      } catch (err) {
        console.error('Erreur lors du chargement des données', err);
        setError('Impossible de charger les détails de cette évaluation.');
        showNotification('error', 'Erreur de chargement', 'Impossible de charger les détails de cette évaluation.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [evaluationId, showNotification]);

  const handleChangeStatus = async (newStatus: 'published' | 'archived') => {
    try {
      setChangingStatus(true);
      
      if (newStatus === 'published') {
        const criteria = evaluation?.scale?.criteria || [];
        const grades = evaluation?.grades || [];
        
        const allCriteriaGraded = criteria.every(criterion => 
          grades.some(grade => grade.criteriaId === criterion.id)
        );
        
        if (!allCriteriaGraded) {
          showNotification('warning', 'Action impossible', 
            'Vous devez noter tous les critères avant de publier cette évaluation.');
          setChangingStatus(false);
          return;
        }
      }
      
      const updatedEvaluation = await evaluationService.changeStatus(evaluationId, newStatus);
      setEvaluation(updatedEvaluation);
      
      showNotification('success', 'Statut mis à jour', 
        `L'évaluation a été ${newStatus === 'published' ? 'publiée' : 'archivée'} avec succès.`);
      
    } catch (err) {
      console.error('Erreur lors du changement de statut', err);
      showNotification('error', 'Erreur', 'Impossible de changer le statut de cette évaluation.');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    try {
      setSubmittingComment(true);
      const newComment = await evaluationService.addComment(evaluationId, commentText);
      
      setEvaluation(prev => {
        if (!prev) return prev;
        const updatedComments = [...(prev.comments || []), newComment];
        return { ...prev, comments: updatedComments };
      });
      
      setCommentText('');
      showNotification('success', 'Commentaire ajouté', 'Votre commentaire a été ajouté avec succès.');
    } catch (err) {
      console.error('Erreur lors de l\'ajout du commentaire', err);
      showNotification('error', 'Erreur', 'Impossible d\'ajouter ce commentaire.');
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
  const isTeacherOfEvaluation = isTeacher && user?.userId === evaluation.teacherId;
  const canEdit = isTeacherOfEvaluation && evaluation.status === 'draft';
  const canGrade = isTeacherOfEvaluation && evaluation.status === 'draft';
  const canPublish = isTeacherOfEvaluation && evaluation.status === 'draft';
  const canArchive = isTeacherOfEvaluation && evaluation.status === 'published';

  // Calculer la note totale
  const totalPoints = evaluation.grades?.reduce((sum, grade) => sum + grade.value, 0) || 0;
  const maxPoints = evaluation.scale?.criteria?.reduce((sum, criteria) => sum + criteria.maxPoints, 0) || 0;
  const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header compact */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{evaluation.title}</h1>
          <div className="text-sm text-gray-500">
            Date d'évaluation: {new Date(evaluation.dateEval).toLocaleDateString('fr-FR')}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Badge de statut */}
          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full
            ${evaluation.status === 'published' ? 'bg-green-100 text-green-800' : 
              evaluation.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'}`}>
            {evaluation.status === 'published' ? 'Publiée' : 
             evaluation.status === 'draft' ? 'Brouillon' : 'Archivée'}
          </span>
          
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

      {/* Layout en colonnes puis commentaires en bas */}
      <div className="space-y-6">
        {/* Première ligne : Informations + Notes */}
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
                  <p className="font-medium text-sm">{evaluation.teacher?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Étudiant</p>
                  <p className="font-medium text-sm">{evaluation.student?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <ClockIcon className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Créée le</p>
                  <p className="font-medium text-sm">{new Date(evaluation.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>
            
            {canGrade && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href={`/evaluations/${evaluationId}/grade`}
                  className="w-full block text-center bg-[#138784] text-white px-4 py-2 rounded-md hover:bg-[#0c6460] text-sm font-medium"
                >
                  Attribuer des notes
                </Link>
              </div>
            )}
          </div>

          {/* Colonne 2: Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <TrophyIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
            </div>
            
            {!evaluation.grades || evaluation.grades.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">Aucune note disponible pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Score global en haut */}
                {totalPoints > 0 && (
                  <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Score total</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-gray-900">{totalPoints}</span>
                        <span className="text-gray-500 text-sm">/ {maxPoints}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          percentage >= 70 ? 'bg-green-100 text-green-800' :
                          percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Liste des notes */}
                {evaluation.grades.map((grade, index) => (
                  <div key={grade.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-xs">{index + 1}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-gray-900 truncate">{grade.criteria?.description}</p>
                        <p className="text-xs text-gray-500 truncate">{grade.criteria?.associatedSkill}</p>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-lg font-bold text-gray-900">{grade.value}</span>
                        <span className="text-gray-500 text-xs">/{grade.criteria?.maxPoints}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Deuxième ligne : Commentaires en pleine largeur */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <ChatBubbleLeftIcon className="h-5 w-5 text-teal-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Commentaires</h2>
          </div>
          
          {/* Formulaire d'ajout */}
          {isTeacherOfEvaluation && (
            <div className="mb-6">
              <form onSubmit={handleAddComment} className="space-y-3">
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784] text-sm bg-white"
                  style={{ backgroundColor: '#ffffff' }}
                  rows={3}
                  placeholder="Ajouter un commentaire..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="bg-[#138784] text-white px-4 py-2 rounded-md hover:bg-[#0c6460] disabled:opacity-50 text-sm font-medium"
                  >
                    {submittingComment ? 'Envoi...' : 'Ajouter un commentaire'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Liste des commentaires */}
          <div className="space-y-4">
            {!evaluation.comments || evaluation.comments.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">Aucun commentaire pour le moment.</p>
            ) : (
              evaluation.comments.map((comment) => (
                <div key={comment.id} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-sm">{comment.teacher?.name}</div>
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
                  <p className="text-gray-700 text-sm leading-relaxed">{comment.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}