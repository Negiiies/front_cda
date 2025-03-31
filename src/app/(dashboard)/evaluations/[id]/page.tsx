// src/app/(dashboard)/evaluations/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../lib/auth';
import evaluationService, { Evaluation } from '../../../../services/evaluationService';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ClockIcon, CheckCircleIcon, UserIcon, AcademicCapIcon, ArchiveBoxIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function EvaluationDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);

  const evaluationId = Number(params.id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const evalData = await evaluationService.getEvaluationById(evaluationId);
        setEvaluation(evalData);
        
        // Charger les commentaires et les notes
        const commentsData = await evaluationService.getComments(evaluationId);
        setComments(commentsData);
        
        const gradesData = await evaluationService.getGrades(evaluationId);
        setGrades(gradesData);
      } catch (err) {
        console.error('Erreur lors du chargement des données', err);
        setError('Impossible de charger les détails de cette évaluation.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [evaluationId]);

  const handleChangeStatus = async (newStatus: 'draft' | 'published' | 'archived') => {
    try {
      const updatedEvaluation = await evaluationService.changeStatus(evaluationId, newStatus);
      setEvaluation(updatedEvaluation);
    } catch (err) {
      console.error('Erreur lors du changement de statut', err);
      setError('Impossible de changer le statut de cette évaluation.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    try {
      const newComment = await evaluationService.addComment(evaluationId, commentText);
      setComments([newComment, ...comments]);
      setCommentText('');
    } catch (err) {
      console.error('Erreur lors de l\'ajout du commentaire', err);
      setError('Impossible d\'ajouter ce commentaire.');
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
              {evaluation.status === 'draft' && (
                <>
                  <button
                    onClick={() => handleChangeStatus('published')}
                    className="bg-green-600 text-white px-3 py-1 rounded-md flex items-center space-x-1 text-sm hover:bg-green-700"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Publier</span>
                  </button>
                  
                  <Link
                    href={`/evaluations/${evaluationId}/edit`}
                    className="bg-blue-600 text-white px-3 py-1 rounded-md flex items-center space-x-1 text-sm hover:bg-blue-700"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>Modifier</span>
                  </Link>
                </>
              )}
              
              {evaluation.status === 'published' && (
                <button
                  onClick={() => handleChangeStatus('archived')}
                  className="bg-gray-600 text-white px-3 py-1 rounded-md flex items-center space-x-1 text-sm hover:bg-gray-700"
                >
                  <ArchiveBoxIcon className="h-4 w-4" />
                  <span>Archiver</span>
                </button>
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
        </div>
        
        {/* Colonne 2: Barème et notes */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Notes</h2>
          
          {grades.length === 0 ? (
            <p className="text-gray-500">Aucune note disponible pour le moment.</p>
          ) : (
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
                  {grades.map((grade) => (
                    <tr key={grade.id}>
                      <td className="px-4 py-2 text-sm">{grade.criteria?.description}</td>
                      <td className="px-4 py-2 text-sm">{grade.criteria?.associatedSkill}</td>
                      <td className="px-4 py-2 text-sm text-right font-medium">{grade.value}</td>
                      <td className="px-4 py-2 text-sm text-right text-gray-500">{grade.criteria?.maxPoints}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={2} className="px-4 py-2 text-sm font-bold">Total</td>
                    <td className="px-4 py-2 text-sm text-right font-bold">
                      {grades.reduce((sum, grade) => sum + grade.value, 0)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-bold">
                      {grades.reduce((sum, grade) => sum + grade.criteria?.maxPoints, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
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
                className="bg-[#138784] text-white px-4 py-2 rounded-md hover:bg-[#0c6460]"
              >
                Ajouter un commentaire
              </button>
            </div>
          </form>
        )}
        
        {/* Liste des commentaires */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-500">Aucun commentaire pour le moment.</p>
          ) : (
            comments.map((comment) => (
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