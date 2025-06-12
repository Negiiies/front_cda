// src/components/evaluations/GradeProgressView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrophyIcon, 
  ChartBarIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Evaluation, Grade } from '../../services/evaluationService';
import evaluationService from '../../services/evaluationService';

interface GradeProgressViewProps {
  evaluation: Evaluation;
  onGradeUpdate?: (updatedEvaluation: Evaluation) => void;
  autoRefresh?: boolean;
  refreshInterval?: number; // en millisecondes
}

interface SkillGroup {
  skillName: string;
  current: number;
  max: number;
  percentage: number;
  grades: Grade[];
}

interface GradingProgress {
  totalCriteria: number;
  gradedCriteria: number;
  percentage: number;
  isComplete: boolean;
}

export default function GradeProgressView({ 
  evaluation: initialEvaluation, 
  onGradeUpdate,
  autoRefresh = false,
  refreshInterval = 5000
}: GradeProgressViewProps) {
  const [evaluation, setEvaluation] = useState<Evaluation>(initialEvaluation);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fonction pour recharger les données
  const refreshEvaluationData = async () => {
    if (!evaluation.id) return;
    
    try {
      setLoading(true);
      const updated = await evaluationService.getEvaluationById(evaluation.id);
      setEvaluation(updated);
      setLastUpdated(new Date());
      
      // Notifier le parent du changement
      if (onGradeUpdate) {
        onGradeUpdate(updated);
      }
      
      console.log('✅ Données rechargées:', {
        evaluationId: updated.id,
        gradesCount: updated.grades?.length || 0,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('❌ Erreur lors du rechargement:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh optionnel
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshEvaluationData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, evaluation.id]);

  // Mettre à jour l'évaluation si elle change depuis le parent
  useEffect(() => {
    setEvaluation(initialEvaluation);
  }, [initialEvaluation]);

  // Calculs de progression
  const calculateTotalScore = (): { current: number; max: number; percentage: number } => {
    const current = evaluation.grades?.reduce((sum, grade) => sum + grade.value, 0) || 0;
    const max = evaluation.scale?.criteria?.reduce((sum, criteria) => sum + criteria.maxPoints, 0) || 0;
    const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
    return { current, max, percentage };
  };

  const getGradingProgress = (): GradingProgress => {
    const totalCriteria = evaluation.scale?.criteria?.length || 0;
    const gradedCriteria = evaluation.scale?.criteria?.filter(criteria => 
      evaluation.grades?.some(grade => grade.criteriaId === criteria.id)
    ).length || 0;
    
    const percentage = totalCriteria > 0 ? Math.round((gradedCriteria / totalCriteria) * 100) : 0;
    const isComplete = gradedCriteria === totalCriteria && totalCriteria > 0;
    
    return { totalCriteria, gradedCriteria, percentage, isComplete };
  };

  const getSkillGroups = (): SkillGroup[] => {
    if (!evaluation.grades || !evaluation.scale?.criteria) return [];
    
    const skillMap = new Map<string, SkillGroup>();
    
    evaluation.scale.criteria.forEach(criteria => {
      const skill = criteria.associatedSkill;
      const grade = evaluation.grades?.find(g => g.criteriaId === criteria.id);
      
      if (!skillMap.has(skill)) {
        skillMap.set(skill, {
          skillName: skill,
          current: 0,
          max: 0,
          percentage: 0,
          grades: []
        });
      }
      
      const skillGroup = skillMap.get(skill)!;
      skillGroup.max += criteria.maxPoints;
      
      if (grade) {
        skillGroup.current += grade.value;
        skillGroup.grades.push(grade);
      }
    });
    
    // Calculer les pourcentages
    skillMap.forEach(group => {
      group.percentage = group.max > 0 ? Math.round((group.current / group.max) * 100) : 0;
    });
    
    return Array.from(skillMap.values()).sort((a, b) => b.percentage - a.percentage);
  };

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const totalScore = calculateTotalScore();
  const gradingProgress = getGradingProgress();
  const skillGroups = getSkillGroups();

  return (
    <div className="space-y-6">
      {/* En-tête avec score global */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <TrophyIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Progression des notes</h2>
              <p className="text-sm text-gray-500">
                Dernière mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
                {loading && (
                  <span className="ml-2 inline-flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#138784]"></div>
                    <span className="ml-1">Actualisation...</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <button
            onClick={refreshEvaluationData}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
          >
            Actualiser
          </button>
        </div>

        {/* Score global */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                <span className={getScoreColor(totalScore.percentage)}>
                  {totalScore.current}
                </span>
                <span className="text-gray-400 text-2xl">/{totalScore.max}</span>
              </div>
              <div className={`text-xl font-semibold mb-3 ${getScoreColor(totalScore.percentage)}`}>
                {totalScore.percentage}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(totalScore.percentage)}`}
                  style={{ width: `${totalScore.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Progression de la notation */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Critères notés</span>
              <div className="flex items-center space-x-2">
                {gradingProgress.isComplete ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <ClockIcon className="h-5 w-5 text-yellow-600" />
                )}
                <span className="text-lg font-bold text-gray-900">
                  {gradingProgress.gradedCriteria}/{gradingProgress.totalCriteria}
                </span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  gradingProgress.isComplete ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${gradingProgress.percentage}%` }}
              ></div>
            </div>
            
            <p className="text-sm text-gray-600">
              {gradingProgress.isComplete ? (
                <span className="text-green-600 font-medium">✓ Notation terminée</span>
              ) : (
                <span className="text-yellow-600 font-medium">
                  {gradingProgress.totalCriteria - gradingProgress.gradedCriteria} critères restants
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Progression par compétences */}
      {skillGroups.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <ChartBarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Progression par compétence</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skillGroups.map((skill, index) => (
              <div key={skill.skillName} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 text-sm">{skill.skillName}</h4>
                  <span className="text-xs text-gray-500">
                    {skill.grades.length} note{skill.grades.length > 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">
                    {skill.current} / {skill.max} pts
                  </span>
                  <span className={`font-bold text-sm ${getScoreColor(skill.percentage)}`}>
                    {skill.percentage}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(skill.percentage)}`}
                    style={{ width: `${skill.percentage}%` }}
                  ></div>
                </div>
                
                {/* Détail des notes pour cette compétence */}
                {skill.grades.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {skill.grades.slice(0, 2).map((grade) => (
                      <div key={grade.id} className="flex justify-between text-xs text-gray-500">
                        <span className="truncate">{grade.criteria?.description}</span>
                        <span>{grade.value}/{grade.criteria?.maxPoints}</span>
                      </div>
                    ))}
                    {skill.grades.length > 2 && (
                      <p className="text-xs text-gray-400">
                        +{skill.grades.length - 2} autres
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages d'état */}
      {!loading && evaluation.grades && evaluation.grades.length === 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
            <div>
              <p className="text-yellow-700 font-medium">Aucune note disponible</p>
              <p className="text-yellow-600 text-sm mt-1">
                Les notes apparaîtront ici dès qu'elles seront attribuées.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}