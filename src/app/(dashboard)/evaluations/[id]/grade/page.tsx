// src/app/(dashboard)/evaluations/[id]/grade/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../lib/auth';
import { useNotification } from '../../../../../contexts/NotificationContext';
import evaluationService, { Evaluation, Grade } from '../../../../../services/evaluationService';
import scaleService from '../../../../../services/scaleService';
import Link from 'next/link';
import { ArrowLeftIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

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
  const [success, setSuccess] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>({});

  useEffect(() => {
    // Rediriger si l'utilisateur n'est pas un professeur
    if (user && user.role !== 'teacher') {
      router.push('/dashboard');
      return;
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("=== DÉBUT DU CHARGEMENT DES DONNÉES ===");
        
        // Récupérer l'évaluation complète
        console.log(`Chargement de l'évaluation ID: ${evaluationId}`);
        const evalData = await evaluationService.getEvaluationById(evaluationId);
        console.log(`Évaluation chargée:`, evalData);
        
        if (!evalData) {
          console.error("Évaluation non trouvée");
          throw new Error('Évaluation non trouvée');
        }
        
        // Vérification de l'évaluation et ses relations
        const debugInfo = {
          hasScale: !!evalData.scale,
          scaleName: evalData.scale?.title || 'Non défini',
          hasScaleCriteria: !!(evalData.scale?.criteria && evalData.scale.criteria.length > 0),
          criteriaCount: evalData.scale?.criteria?.length || 0
        };
        
        console.log("Informations de débogage:", debugInfo);
        setDebug(debugInfo);
        
        // Si l'évaluation n'a pas de barème ou de critères, essayer de les charger manuellement
        if (!evalData.scale || !evalData.scale.criteria || evalData.scale.criteria.length === 0) {
          console.log("Problème détecté: Barème ou critères manquants");
          
          if (!evalData.scale) {
            console.log(`Tentative de chargement manuel du barème ID: ${evalData.scaleId}`);
            try {
              const scaleData = await scaleService.getScaleById(evalData.scaleId);
              console.log("Barème chargé manuellement:", scaleData);
              
              // Mettre à jour l'évaluation avec le barème
              evalData.scale = scaleData;
              
              // Vérifier si des critères ont été chargés avec le barème
              if (!scaleData.criteria || scaleData.criteria.length === 0) {
                console.log("Le barème n'a pas de critères, tentative de chargement manuel");
                
                try {
                  const criteriaData = await scaleService.getCriteriaByScaleId(evalData.scaleId);
                  console.log("Critères chargés manuellement:", criteriaData);
                  
                  if (criteriaData && criteriaData.length > 0) {
                    evalData.scale.criteria = criteriaData;
                  } else {
                    console.error("Aucun critère trouvé pour ce barème");
                  }
                } catch (criteriaError) {
                  console.error("Erreur lors du chargement manuel des critères:", criteriaError);
                }
              }
            } catch (scaleError) {
              console.error("Erreur lors du chargement manuel du barème:", scaleError);
            }
          } else if (!evalData.scale.criteria || evalData.scale.criteria.length === 0) {
            console.log(`Tentative de chargement manuel des critères pour le barème ID: ${evalData.scaleId}`);
            
            try {
              const criteriaData = await scaleService.getCriteriaByScaleId(evalData.scaleId);
              console.log("Critères chargés manuellement:", criteriaData);
              
              if (criteriaData && criteriaData.length > 0) {
                evalData.scale.criteria = criteriaData;
              } else {
                console.error("Aucun critère trouvé pour ce barème");
              }
            } catch (criteriaError) {
              console.error("Erreur lors du chargement manuel des critères:", criteriaError);
            }
          }
          
          // Mettre à jour les informations de débogage après les tentatives de récupération
          setDebug({
            ...debugInfo,
            hasScale: !!evalData.scale,
            scaleName: evalData.scale?.title || 'Non défini',
            hasScaleCriteria: !!(evalData.scale?.criteria && evalData.scale.criteria.length > 0),
            criteriaCount: evalData.scale?.criteria?.length || 0,
            manualRecoveryAttempted: true
          });
        }
        
        // Vérifier que l'évaluation appartient au professeur connecté
        if (evalData.teacherId !== user?.userId) {
          throw new Error('Vous n\'êtes pas autorisé à noter cette évaluation');
        }
        
        // Vérifier que l'évaluation est en statut draft
        if (evalData.status !== 'draft') {
          throw new Error('Cette évaluation ne peut plus être modifiée');
        }
        
        setEvaluation(evalData);
        
        // Récupérer les notes existantes
        console.log("Chargement des notes existantes");
        const gradesData = await evaluationService.getGrades(evaluationId);
        console.log("Notes existantes:", gradesData);
        setExistingGrades(gradesData);
        
        // Pré-remplir les notes existantes
        const gradesMap = gradesData.reduce((acc: Record<number, number>, grade: Grade) => {
          acc[grade.criteriaId] = grade.value;
          return acc;
        }, {});
        setGrades(gradesMap);
        
        console.log("=== FIN DU CHARGEMENT DES DONNÉES ===");
      } catch (err: any) {
        console.error('Erreur lors du chargement des données', err);
        setError(err.message || 'Impossible de charger les détails de cette évaluation.');
        showNotification('error', 'Erreur de chargement', err.message || 'Impossible de charger les détails de cette évaluation.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, router, evaluationId, showNotification]);

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
    
    // Somme simple des notes
    return evaluation.scale.criteria.reduce((sum, criteria) => {
      const grade = grades[criteria.id] || 0;
      return sum + grade;
    }, 0);
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
      showNotification('warning', 'Formulaire incomplet', 'Veuillez noter tous les critères avant de soumettre.');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log("Début de la sauvegarde des notes");
      
      // Pour chaque critère, créer ou mettre à jour la note
      const promises = criteria.map(async (criteria) => {
        const criteriaId = criteria.id;
        const value = grades[criteriaId];
        
        console.log(`Traitement de la note pour le critère ${criteriaId}: ${value}`);
        
        // Chercher si une note existe déjà pour ce critère
        const existingGrade = existingGrades.find(g => g.criteriaId === criteriaId);
        
        if (existingGrade) {
          // Mettre à jour la note existante
          console.log(`Mise à jour de la note existante ID: ${existingGrade.id}`);
          return await evaluationService.updateGrade(existingGrade.id, value);
        } else {
          // Créer une nouvelle note
          console.log(`Création d'une nouvelle note pour le critère: ${criteriaId}`);
          return await evaluationService.createGrade({
            evaluationId,
            criteriaId,
            value
          });
        }
      });
      
      const results = await Promise.all(promises);
      console.log("Résultats de la sauvegarde:", results);
      
      setSuccess('Notes enregistrées avec succès!');
      showNotification('success', 'Notes enregistrées', 'Les notes ont été enregistrées avec succès.');
      
      // Recharger les données pour afficher les notes mises à jour
      console.log("Rechargement des données après sauvegarde");
      const updatedEval = await evaluationService.getEvaluationById(evaluationId);
      setEvaluation(updatedEval);
      
      const updatedGrades = await evaluationService.getGrades(evaluationId);
      setExistingGrades(updatedGrades);
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement des notes', err);
      setError('Impossible d\'enregistrer les notes. Veuillez réessayer.');
      showNotification('error', 'Erreur d\'enregistrement', 'Impossible d\'enregistrer les notes. Veuillez réessayer.');
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

  // Vérifier si le barème a des critères
  const hasCriteria = evaluation.scale?.criteria && evaluation.scale.criteria.length > 0;

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
      
      {/* Information de débogage - À supprimer en production */}
      {Object.keys(debug).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
          <h3 className="font-medium flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 mr-2" />
            Informations de débogage
          </h3>
          <ul className="mt-2 text-sm space-y-1">
            <li>Barème présent: {debug.hasScale ? 'Oui' : 'Non'}</li>
            <li>Nom du barème: {debug.scaleName}</li>
            <li>Critères présents: {debug.hasScaleCriteria ? 'Oui' : 'Non'}</li>
            <li>Nombre de critères: {debug.criteriaCount}</li>
          </ul>
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
            Barème: {evaluation.scale?.title || `ID: ${evaluation.scaleId}`}
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
        ) : !hasCriteria ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            <p>Le barème sélectionné ne contient pas de critères d'évaluation.</p>
            <p className="mt-2">
              <Link href={`/scales/${evaluation.scaleId}`} className="text-[#138784] hover:underline">
                Modifier le barème pour ajouter des critères
              </Link>
            </p>
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