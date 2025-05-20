// src/app/(dashboard)/student/performance/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../lib/auth';
import evaluationService, { Evaluation } from '../../../../services/evaluationService';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import RoleGuard from '../../../../components/auth/RoleGuard';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function StudentPerformancePage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Données calculées
  const [averageScore, setAverageScore] = useState(0);
  const [skillScores, setSkillScores] = useState<{skill: string; score: number; count: number}[]>([]);
  const [scoresByMonth, setScoresByMonth] = useState<{month: string; score: number}[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les évaluations de l'étudiant
        let evalData = await evaluationService.getEvaluations();
        
        // Filtrer pour les évaluations publiées/archivées avec des notes
        evalData = evalData.filter(evaluation => 
          (evaluation.status === 'published' || evaluation.status === 'archived') &&
          evaluation.grades && evaluation.grades.length > 0
        );
        
        setEvaluations(evalData);
        
        // Calculer la note moyenne globale
        calculateAverageScore(evalData);
        
        // Calculer les scores par compétence
        calculateSkillScores(evalData);
        
        // Calculer l'évolution des scores par mois
        calculateScoresByMonth(evalData);
        
      } catch (err) {
        console.error('Erreur lors du chargement des données de performance', err);
        setError('Impossible de charger vos données de performance. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  const calculateAverageScore = (evaluations: Evaluation[]) => {
    let totalPercentage = 0;
    let evaluationsWithGrades = 0;
    
    evaluations.forEach(evaluation => {
      if (evaluation.grades && evaluation.grades.length > 0) {
        const totalPoints = evaluation.grades.reduce((sum, grade) => sum + grade.value, 0);
        const maxPoints = evaluation.grades.reduce(
          (sum, grade) => sum + (grade.criteria?.maxPoints || 0), 
          0
        );
        
        if (maxPoints > 0) {
          totalPercentage += (totalPoints / maxPoints) * 100;
          evaluationsWithGrades++;
        }
      }
    });
    
    setAverageScore(evaluationsWithGrades > 0 
      ? Math.round(totalPercentage / evaluationsWithGrades) 
      : 0
    );
  };
  
  const calculateSkillScores = (evaluations: Evaluation[]) => {
    // Créer un map pour stocker les scores par compétence
    const skillMap = new Map<string, {total: number; max: number; count: number}>();
    
    evaluations.forEach(evaluation => {
      if (evaluation.grades && evaluation.grades.length > 0) {
        evaluation.grades.forEach(grade => {
          const skill = grade.criteria?.associatedSkill;
          if (!skill) return;
          
          const currentSkill = skillMap.get(skill) || {total: 0, max: 0, count: 0};
          
          currentSkill.total += grade.value;
          currentSkill.max += grade.criteria?.maxPoints || 0;
          currentSkill.count += 1;
          
          skillMap.set(skill, currentSkill);
        });
      }
    });
    
    // Convertir le map en tableau pour l'affichage
    const skillScoreArray = Array.from(skillMap.entries()).map(([skill, data]) => {
      const percentage = data.max > 0 ? Math.round((data.total / data.max) * 100) : 0;
      return {skill, score: percentage, count: data.count};
    });
    
    // Trier par score décroissant
    skillScoreArray.sort((a, b) => b.score - a.score);
    
    setSkillScores(skillScoreArray);
  };
  
  const calculateScoresByMonth = (evaluations: Evaluation[]) => {
    // Map pour stocker les scores par mois
    const monthMap = new Map<string, {total: number; max: number; count: number}>();
    
    evaluations.forEach(evaluation => {
      if (!evaluation.grades || evaluation.grades.length === 0) return;
      
      // Formater la date (mois-année)
      const date = new Date(evaluation.dateEval);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      const totalPoints = evaluation.grades.reduce((sum, grade) => sum + grade.value, 0);
      const maxPoints = evaluation.grades.reduce(
        (sum, grade) => sum + (grade.criteria?.maxPoints || 0), 
        0
      );
      
      if (maxPoints > 0) {
        const currentMonth = monthMap.get(monthYear) || {total: 0, max: 0, count: 0};
        
        currentMonth.total += totalPoints;
        currentMonth.max += maxPoints;
        currentMonth.count += 1;
        
        monthMap.set(monthYear, currentMonth);
      }
    });
    
    // Convertir en tableau pour l'affichage
    const monthArray = Array.from(monthMap.entries()).map(([month, data]) => {
      const percentage = data.max > 0 ? Math.round((data.total / data.max) * 100) : 0;
      return {month, score: percentage};
    });
    
    // Trier par date
    monthArray.sort((a, b) => {
      const [monthA, yearA] = a.month.split('/').map(Number);
      const [monthB, yearB] = b.month.split('/').map(Number);
      
      if (yearA !== yearB) return yearA - yearB;
      return monthA - monthB;
    });
    
    setScoresByMonth(monthArray);
  };
  
  // Fonction pour obtenir une classe de couleur en fonction du score
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Fonction pour obtenir une classe de couleur pour l'arrière-plan
  const getScoreBgClass = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement de vos performances..." />;
  }

  return (
    <RoleGuard allowedRoles={['student']}>
      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-6">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Mes performances</h1>
        </div>
        
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : (
          <>
            {/* Carte de score global */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Performance globale</h2>
              
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <div className="text-center">
                    <div className={`text-6xl font-bold ${getScoreColorClass(averageScore)}`}>
                      {averageScore}%
                    </div>
                    <div className="text-gray-500 mt-2">
                      Score moyen sur {evaluations.length} évaluations
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-2/3">
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <div 
                      className={`h-6 rounded-full ${getScoreBgClass(averageScore)}`}
                      style={{ width: `${averageScore}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Scores par compétence */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Performance par compétence</h2>
              
              {skillScores.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Aucune donnée disponible pour le moment.
                </p>
              ) : (
                <div className="space-y-4">
                  {skillScores.map(skill => (
                    <div key={skill.skill} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{skill.skill}</span>
                          <span className="text-xs text-gray-500 ml-2">({skill.count} évaluation{skill.count > 1 ? 's' : ''})</span>
                        </div>
                        <span className={`font-bold ${getScoreColorClass(skill.score)}`}>
                          {skill.score}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getScoreBgClass(skill.score)}`}
                          style={{ width: `${skill.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Évolution des scores par mois */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Évolution dans le temps</h2>
              
              {scoresByMonth.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Aucune donnée disponible pour le moment.
                </p>
              ) : (
                <div className="h-64 pt-6">
                  {/* Rendu graphique simple */}
                  <div className="flex items-end h-48 space-x-2">
                    {scoresByMonth.map((item, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div className="w-full flex justify-center">
                          <div
                            className={`w-full mx-2 ${getScoreBgClass(item.score)}`}
                            style={{ height: `${item.score * 0.48}px` }}
                          ></div>
                        </div>
                        <div className="text-xs font-medium mt-2">{item.month}</div>
                        <div className={`text-xs font-bold ${getScoreColorClass(item.score)}`}>
                          {item.score}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Section de conseils */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Analyse et conseils</h2>
              
              <div className="space-y-4">
                {averageScore >= 80 ? (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <h3 className="font-medium text-green-800 mb-2">Excellente performance !</h3>
                    <p className="text-green-700">
                      Vous maintenez un excellent niveau dans l'ensemble de vos évaluations. Continuez ainsi !
                    </p>
                  </div>
                ) : averageScore >= 60 ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Bonne performance</h3>
                    <p className="text-blue-700">
                      Vous avez de bons résultats dans la plupart de vos évaluations. Continuez vos efforts !
                    </p>
                  </div>
                ) : averageScore >= 40 ? (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                    <h3 className="font-medium text-yellow-800 mb-2">Performance moyenne</h3>
                    <p className="text-yellow-700">
                      Vos résultats sont moyens. Identifiez les compétences à améliorer et demandez de l'aide si nécessaire.
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                    <h3 className="font-medium text-red-800 mb-2">Performance à améliorer</h3>
                    <p className="text-red-700">
                      Vos résultats nécessitent une attention particulière. Prenez rendez-vous avec vos professeurs pour élaborer un plan d'amélioration.
                    </p>
                  </div>
                )}
                
                {/* Analyse des forces et faiblesses */}
                {skillScores.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Points forts et axes d'amélioration</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Points forts</h4>
                        {skillScores.filter(s => s.score >= 70).length > 0 ? (
                          <ul className="text-sm space-y-1">
                            {skillScores
                              .filter(s => s.score >= 70)
                              .slice(0, 3)
                              .map(s => (
                                <li key={s.skill} className="flex items-center">
                                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                  {s.skill}: <span className="font-medium ml-1">{s.score}%</span>
                                </li>
                              ))
                            }
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            Aucun point fort identifié pour le moment.
                          </p>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Axes d'amélioration</h4>
                        {skillScores.filter(s => s.score < 60).length > 0 ? (
                          <ul className="text-sm space-y-1">
                            {skillScores
                              .filter(s => s.score < 60)
                              .slice(0, 3)
                              .map(s => (
                                <li key={s.skill} className="flex items-center">
                                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                  {s.skill}: <span className="font-medium ml-1">{s.score}%</span>
                                </li>
                              ))
                            }
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            Aucun axe d'amélioration majeur identifié.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  );
}