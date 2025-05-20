// src/app/(dashboard)/evaluations/[id]/page.tsx - version améliorée
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../lib/auth';
import evaluationService, { Evaluation, Grade } from '../../../../services/evaluationService';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ClockIcon, CheckCircleIcon, UserIcon, AcademicCapIcon, ArchiveBoxIcon, PencilIcon } from '@heroicons/react/24/outline';
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
      
      // Si on publie, vérifier d'abord que toutes les compétences ont des notes
      if (newStatus === 'published') {
        const criteria = evaluation?.scale?.criteria || [];
        const grades = evaluation?.grades || [];
        
        // Vérifier que chaque critère a une note
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
      
      // Mettre à jour l'évaluation avec le nouveau commentaire
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
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
        {error}
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

  const isTeacher = user?.role === 'teacher';
  const isTeacherOfEvaluation = isTeacher && user?.userId === evaluation.teacherId;
  const canEdit = isTeacherOfEvaluation && evaluation.status === 'draft';
  const canGrade = isTeacherOfEvaluation && evaluation.status === 'draft';
  const canPublish = isTeacherOfEvaluation && evaluation.status === 'draft';
  const canArchive = isTeacherOfEvaluation && evaluation.status === 'published';

  // Calculer la note totale
  const totalPoints = evaluation.grades?.reduce((sum, grade) => sum + grade.value, 0) || 0;
  const maxPoints = evaluation.scale?.criteria?.reduce((sum, criteria) => sum + criteria.maxPoints, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Entête avec les actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{evaluation.title}</h1>
          <div className="text-sm text-gray-500">
            Date d'évaluation: {new Date(evaluation.dateEval).toLocaleDateString('fr-FR')}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Statut */}
          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full
            ${evaluation.status === 'published' ? 'bg-green-100 text-green-800' : 
              evaluation.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'}`}>
            {evaluation.status === 'published' ? 'Publiée' : 
             evaluation.status === 'draft' ? 'Brouillon' : 'Archivée'}
          </span>
          
          {/* Boutons d'action pour le professeur */}
          {isTeacherOfEvaluation && (
            <div className="flex space-x-2">
              {canPublish && (
                <button
                  onClick={() => handleChangeStatus('published')}
                  disabled={changingStatus}
                  className="bg-green-600 text-white px-3 py-1 rounded-md flex items-center space-x-1 text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>{changingStatus ? 'Publication...' : 'Publier'}</span>
                </button>
              )}
              
              {canArchive && (
                <button
                  onClick={() => handleChangeStatus('archived')}
                  disabled={changingStatus}
                  className="bg-gray-600 text-white px-3 py-1 rounded-md flex items-center space-x-1 text-sm hover:bg-gray-700 disabled:opacity-50"
                >
                  <ArchiveBoxIcon className="h-4 w-4" />
                  <span>{changingStatus ? 'Archivage...' : 'Archiver'}</span>
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
            </div>
          )}
        </div>
      </div>
      
      {/* Informations principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne 1: Informations générales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Informations</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <AcademicCapIcon className="h-5 w-5 text-[#138784]" />
              <div>
                <p className="text-sm text-gray-500">Professeur</p>
                <p className="font-medium">{evaluation.teacher?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <UserIcon className="h-5 w-5 text-[#138784]" />
              <div>
                <p className="text-sm text-gray-500">Étudiant</p>
                <p className="font-medium">{evaluation.student?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <ClockIcon className="h-5 w-5 text-[#138784]" />
              <div>
                <p className="text-sm text-gray-500">Créée le</p>
                <p className="font-medium">{new Date(evaluation.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>
          
          {canGrade && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link
                href={`/evaluations/${evaluationId}/grade`}
                className="w-full block text-center bg-[#138784] text-white px-4 py-2 rounded-md hover:bg-[#0c6460]"
              >
                Attribuer des notes
              </Link>
            </div>
          )}
        </div>
        
        {/* Colonne 2: Barème et notes */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Notes</h2>
          
          {!evaluation.grades || evaluation.grades.length === 0 ? (
            <p className="text-gray-500">Aucune note disponible pour le moment.</p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Critère</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Compétence</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Note</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Max</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {evaluation.grades.map((grade) => (
                      <tr key={grade.id}>
                        <td className="px-4 py-2 text-sm">{grade.criteria?.description}</td>
                        <td className="px-4 py-2 text-sm">{grade.criteria?.associatedSkill}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium">{grade.value}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-500">{grade.criteria?.maxPoints}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan={2} className="px-4 py-2 text-sm font-bold">Total</td>
                      <td className="px-4 py-2 text-sm text-right font-bold">{totalPoints}</td>
                      <td className="px-4 py-2 text-sm text-right font-bold">{maxPoints}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Barre de progression (facultatif) */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Score: {totalPoints}/{maxPoints}</span>
                  <span>{Math.round((totalPoints / maxPoints) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-[#138784] h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, Math.round((totalPoints / maxPoints) * 100))}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Section commentaires */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Commentaires</h2>
        
        {/* Formulaire d'ajout de commentaire (uniquement pour les professeurs) */}
        {isTeacherOfEvaluation && (
          <form onSubmit={handleAddComment} className="mb-6">
            <div className="mb-3">
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
                rows={3}
                placeholder="Ajouter un commentaire..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="bg-[#138784] text-white px-4 py-2 rounded-md hover:bg-[#0c6460] disabled:opacity-50"
              >
                {submittingComment ? 'Envoi en cours...' : 'Ajouter un commentaire'}
              </button>
            </div>
          </form>
        )}
        
        {/* Liste des commentaires */}
        <div className="space-y-4">
          {!evaluation.comments || evaluation.comments.length === 0 ? (
            <p className="text-gray-500">Aucun commentaire pour le moment.</p>
          ) : (
            evaluation.comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{comment.teacher?.name}</div>
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
                <p className="text-gray-700">{comment.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}