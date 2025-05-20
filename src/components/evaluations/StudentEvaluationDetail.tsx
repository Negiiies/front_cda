// src/components/evaluations/StudentEvaluationDetail.tsx
'use client';

import React, { useState } from 'react';
import { Evaluation, Grade } from '../../services/evaluationService';
import { 
  AcademicCapIcon, 
  CalendarIcon, 
  DocumentTextIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

interface StudentEvaluationDetailProps {
  evaluation: Evaluation;
}

export default function StudentEvaluationDetail({ evaluation }: StudentEvaluationDetailProps) {
  const [showComments, setShowComments] = useState(true);
  
  if (!evaluation) {
    return <div className="text-center py-8">Évaluation non disponible</div>;
  }

  // Calcul des totaux et de la note finale (%)
  const totalPoints = evaluation.grades?.reduce((sum, grade) => sum + grade.value, 0) || 0;
  const maxPoints = evaluation.grades?.reduce(
    (sum, grade) => sum + (grade.criteria?.maxPoints || 0), 
    0
  ) || 0;
  const finalPercentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
  
  // Détermination de la classe de la note finale
  const getFinalScoreColorClass = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Calcul du score pour un groupe de compétences
  const getSkillGroupScore = (skillName: string): { current: number; max: number; percentage: number } => {
    if (!evaluation.grades) return { current: 0, max: 0, percentage: 0 };
    
    const skillGrades = evaluation.grades.filter(
      grade => grade.criteria?.associatedSkill === skillName
    );
    
    const current = skillGrades.reduce((sum, grade) => sum + grade.value, 0);
    const max = skillGrades.reduce((sum, grade) => sum + (grade.criteria?.maxPoints || 0), 0);
    const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
    
    return { current, max, percentage };
  };

  // Obtenir toutes les compétences uniques
  const uniqueSkills = [...new Set(
    evaluation.grades?.map(grade => grade.criteria?.associatedSkill).filter(Boolean) || []
  )];

  return (
    <div className="space-y-6">
      {/* En-tête avec les informations principales */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{evaluation.title}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center text-gray-700">
              <AcademicCapIcon className="h-5 w-5 text-[#138784] mr-2" />
              <span className="font-medium mr-2">Professeur:</span>
              <span>{evaluation.teacher?.name}</span>
            </div>
            
            <div className="flex items-center text-gray-700">
              <CalendarIcon className="h-5 w-5 text-[#138784] mr-2" />
              <span className="font-medium mr-2">Date d'évaluation:</span>
              <span>{new Date(evaluation.dateEval).toLocaleDateString('fr-FR')}</span>
            </div>
            
            <div className="flex items-center text-gray-700">
              <DocumentTextIcon className="h-5 w-5 text-[#138784] mr-2" />
              <span className="font-medium mr-2">Barème:</span>
              <span>{evaluation.scale?.title}</span>
            </div>
            
            <div className="flex items-center text-gray-700">
              <ClockIcon className="h-5 w-5 text-[#138784] mr-2" />
              <span className="font-medium mr-2">Statut:</span>
              <span className={`px-2 py-0.5 rounded-full text-sm ${
                evaluation.status === 'published' ? 'bg-green-100 text-green-800' : 
                evaluation.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-gray-100 text-gray-800'
              }`}>
                {evaluation.status === 'published' ? 'Publiée' : 
                evaluation.status === 'draft' ? 'Brouillon' : 'Archivée'}
              </span>
            </div>
          </div>
          
          {/* Section de résumé de la note */}
          <div className="bg-gray-50 rounded-lg p-4 flex flex-col justify-center items-center">
            <div className="text-5xl font-bold mb-2 flex items-baseline">
              <span className={getFinalScoreColorClass(finalPercentage)}>
                {finalPercentage}%
              </span>
            </div>
            <div className="text-gray-500 text-center">
              Score global: <span className="font-medium">{totalPoints}</span> / {maxPoints} points
            </div>
            
            {/* Barre de progression */}
            <div className="w-full mt-4 bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full ${
                  finalPercentage >= 80 ? 'bg-green-500' : 
                  finalPercentage >= 60 ? 'bg-blue-500' : 
                  finalPercentage >= 40 ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}
                style={{ width: `${finalPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Section des notes par compétence */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Détail par compétence</h2>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {uniqueSkills.map(skill => {
            const { current, max, percentage } = getSkillGroupScore(skill as string);
            return (
              <div key={skill} className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-lg mb-2">{skill}</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">{current} / {max} points</span>
                  <span className={`font-bold ${getFinalScoreColorClass(percentage)}`}>
                    {percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      percentage >= 80 ? 'bg-green-500' : 
                      percentage >= 60 ? 'bg-blue-500' : 
                      percentage >= 40 ? 'bg-yellow-500' : 
                      'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Tableau détaillé des notes par critère */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Détail par critère</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Critère</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compétence</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Coefficient</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Maximum</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {evaluation.grades?.map((grade: Grade) => (
                <tr key={grade.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {grade.criteria?.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {grade.criteria?.associatedSkill}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-500">
                      {grade.criteria?.coefficient}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-medium">
                      {grade.value}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-500">
                      {grade.criteria?.maxPoints}
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-medium">
                <td className="px-6 py-4 whitespace-nowrap" colSpan={3}>
                  Total
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {totalPoints}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {maxPoints}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Section des commentaires */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Commentaires</h2>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showComments ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        
        {showComments && (
          <div className="p-6">
            {evaluation.comments && evaluation.comments.length > 0 ? (
              <div className="space-y-4">
                {evaluation.comments.map(comment => (
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
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">Aucun commentaire pour cette évaluation.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}