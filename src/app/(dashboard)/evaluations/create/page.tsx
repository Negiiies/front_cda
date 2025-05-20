// src/app/(dashboard)/evaluations/create/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/auth';
import { useNotification } from '../../../../contexts/NotificationContext';
import evaluationService from '../../../../services/evaluationService';
import scaleService, { Scale } from '../../../../services/scaleService';
import userService, { User } from '../../../../services/userService';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

export default function CreateEvaluationPage() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const { showNotification } = useNotification();
  
  // États du formulaire
  const [formData, setFormData] = useState({
    title: '',
    dateEval: '',
    studentId: '',
    scaleId: ''
  });
  
  // États de données externes
  const [students, setStudents] = useState<User[]>([]);
  const [scales, setScales] = useState<Scale[]>([]);
  const [selectedScale, setSelectedScale] = useState<Scale | null>(null);
  
  // États de UI
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<Record<string, string>>({});
  // Pour éviter les boucles infinies
  const [authChecked, setAuthChecked] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  // Vérifier les autorisations d'accès - maintenant avec garde pour éviter les boucles
  useEffect(() => {
    if (!authChecked && authUser) {
      setAuthChecked(true);
      if (authUser.role !== 'teacher' && authUser.role !== 'admin') {
        showNotification('error', 'Accès non autorisé', 'Seuls les professeurs et administrateurs peuvent créer des évaluations.');
        router.push('/dashboard');
      }
    }
  }, [authUser, router, showNotification, authChecked]);

  // Charger les données initiales avec garde contre les boucles infinies
  useEffect(() => {
    if (!dataFetched && authUser && authChecked) {
      const fetchData = async () => {
        setDataLoading(true);
        setError(null);
        
        try {
          // Charger les étudiants
          console.log('Chargement des étudiants...');
          const studentsData = await userService.getUsers();
          // Filtrer uniquement les étudiants actifs
          const filteredStudents = studentsData.filter(u => u.role === 'student' && u.status === 'active');
          setStudents(filteredStudents);
          console.log(`${filteredStudents.length} étudiants chargés`);
          
          // Charger les barèmes
          console.log('Chargement des barèmes...');
          const scalesData = await scaleService.getScales();
          // Pour les professeurs, filtrer seulement leurs barèmes et les barèmes partagés
          const availableScales = authUser?.role === 'admin' 
            ? scalesData 
            : scalesData.filter(s => s.creatorId === authUser?.userId || s.isShared);
            
          setScales(availableScales);
          console.log(`${availableScales.length} barèmes disponibles`);
          
        } catch (err) {
          console.error('Erreur lors du chargement des données initiales:', err);
          setError('Impossible de charger les données nécessaires. Veuillez réessayer plus tard.');
          // Ne pas appeler showNotification ici pour éviter une possible boucle
        } finally {
          setDataLoading(false);
          setDataFetched(true); // Marquer les données comme chargées
        }
      };
      
      fetchData();
    }
  }, [authUser, authChecked, dataFetched]);

  // Charger les détails du barème sélectionné - mémorisé pour éviter les boucles
  const fetchScaleDetails = useCallback(async (scaleId: number) => {
    try {
      // Vérifier d'abord si nous avons déjà ce barème dans la liste des barèmes chargés
      const found = scales.find(s => s.id === scaleId);
      if (found && found.criteria) {
        setSelectedScale(found);
        return;
      }
      
      // Sinon, charger les détails depuis l'API
      console.log(`Chargement des détails du barème ${scaleId}...`);
      const scaleData = await scaleService.getScaleById(scaleId);
      setSelectedScale(scaleData);
    } catch (err) {
      console.error('Erreur lors du chargement des détails du barème:', err);
      setApiError(prev => ({...prev, scaleId: 'Impossible de charger les détails du barème sélectionné'}));
    }
  }, [scales]);

  // Écouter les changements de barème sélectionné
  useEffect(() => {
    if (formData.scaleId) {
      const scaleId = Number(formData.scaleId);
      fetchScaleDetails(scaleId);
    } else {
      setSelectedScale(null);
    }
  }, [formData.scaleId, fetchScaleDetails]);

  // Gérer les changements de champs du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Effacer les erreurs spécifiques au champ lors de la modification
    if (apiError[name]) {
      setApiError(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Le titre est requis';
    }
    
    if (!formData.dateEval) {
      errors.dateEval = 'La date d\'évaluation est requise';
    }
    
    if (!formData.studentId) {
      errors.studentId = 'Veuillez sélectionner un étudiant';
    }
    
    if (!formData.scaleId) {
      errors.scaleId = 'Veuillez sélectionner un barème';
    }
    
    // Mettre à jour les erreurs de validation
    setApiError(errors);
    
    // Formulaire valide si aucune erreur
    return Object.keys(errors).length === 0;
  };

  // Fonction de soumission de formulaire améliorée pour la page de création d'évaluation
// Remplacez la fonction handleSubmit existante par celle-ci

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }
  
  setLoading(true);
  setError(null);
  
  try {
    // Afficher les données exactes qui seront envoyées
    const evaluationData = {
      title: formData.title,
      dateEval: formData.dateEval,
      studentId: formData.studentId,
      scaleId: formData.scaleId
    };
    
    console.log('Données qui seront envoyées au serveur:', evaluationData);
    console.log('Types des données:',
      `title: ${typeof formData.title}`,
      `dateEval: ${typeof formData.dateEval}`,
      `studentId: ${typeof formData.studentId}`,
      `scaleId: ${typeof formData.scaleId}`
    );
    
    // Vérifier si les IDs sont bien numériques
    const studentIdNum = parseInt(formData.studentId as string, 10);
    const scaleIdNum = parseInt(formData.scaleId as string, 10);
    
    if (isNaN(studentIdNum)) {
      throw new Error("L'ID de l'étudiant n'est pas un nombre valide");
    }
    
    if (isNaN(scaleIdNum)) {
      throw new Error("L'ID du barème n'est pas un nombre valide");
    }
    
    // Envoi des données au service
    const result = await evaluationService.createEvaluation({
      title: formData.title,
      dateEval: formData.dateEval,
      studentId: studentIdNum,
      scaleId: scaleIdNum
    });
    
    console.log('Évaluation créée avec succès:', result);
    
    // Notification et redirection
    showNotification('success', 'Évaluation créée', 'L\'évaluation a été créée avec succès.');
    router.push('/evaluations');
  } catch (err: any) {
    console.error('Erreur lors de la création de l\'évaluation:', err);
    
    let errorMessage = 'Impossible de créer l\'évaluation. ';
    
    // Gestion précise de l'erreur
    if (err.response?.data?.message) {
      errorMessage += err.response.data.message;
    } else if (err.response?.data?.errors) {
      // Erreurs de validation côté serveur
      const serverErrors = err.response.data.errors;
      errorMessage += serverErrors.map((e: any) => e.message).join('. ');
      
      setApiError(serverErrors.reduce((acc: Record<string, string>, error: any) => {
        acc[error.field] = error.message;
        return acc;
      }, {}));
    } else if (err.message) {
      errorMessage += err.message;
    } else {
      errorMessage += 'Veuillez vérifier vos données et réessayer.';
    }
    
    setError(errorMessage);
    showNotification('error', 'Erreur', errorMessage);
  } finally {
    setLoading(false);
  }
};

  // Afficher le chargement
  if (dataLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-6">
          <Link href="/evaluations" className="text-gray-600 hover:text-gray-900">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Créer une nouvelle évaluation</h1>
        </div>
        <LoadingSpinner size="lg" text="Chargement des données..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Link href="/evaluations" className="text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Créer une nouvelle évaluation</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Titre de l'évaluation */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Titre de l'évaluation *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className={`w-full px-4 py-2 border ${apiError.title ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784]`}
              value={formData.title}
              onChange={handleChange}
              disabled={loading}
              required
            />
            {apiError.title && (
              <p className="mt-1 text-sm text-red-600">{apiError.title}</p>
            )}
          </div>
          
          {/* Date d'évaluation */}
          <div>
            <label htmlFor="dateEval" className="block text-sm font-medium text-gray-700 mb-1">
              Date d'évaluation *
            </label>
            <input
              type="date"
              id="dateEval"
              name="dateEval"
              className={`w-full px-4 py-2 border ${apiError.dateEval ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784]`}
              value={formData.dateEval}
              onChange={handleChange}
              disabled={loading}
              required
            />
            {apiError.dateEval && (
              <p className="mt-1 text-sm text-red-600">{apiError.dateEval}</p>
            )}
          </div>
          
          {/* Sélection de l'étudiant */}
          <div>
            <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
              Étudiant *
            </label>
            <select
              id="studentId"
              name="studentId"
              className={`w-full px-4 py-2 border ${apiError.studentId ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784]`}
              value={formData.studentId}
              onChange={handleChange}
              disabled={loading}
              required
            >
              <option value="">Sélectionner un étudiant</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
            {apiError.studentId && (
              <p className="mt-1 text-sm text-red-600">{apiError.studentId}</p>
            )}
            {students.length === 0 && (
              <p className="mt-2 text-sm text-orange-600">
                Aucun étudiant disponible. Veuillez contacter l'administrateur.
              </p>
            )}
          </div>
          
          {/* Sélection du barème */}
          <div>
            <label htmlFor="scaleId" className="block text-sm font-medium text-gray-700 mb-1">
              Barème *
            </label>
            <select
              id="scaleId"
              name="scaleId"
              className={`w-full px-4 py-2 border ${apiError.scaleId ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784]`}
              value={formData.scaleId}
              onChange={handleChange}
              disabled={loading}
              required
            >
              <option value="">Sélectionner un barème</option>
              {scales.map((scale) => (
                <option key={scale.id} value={scale.id}>
                  {scale.title}
                </option>
              ))}
            </select>
            {apiError.scaleId && (
              <p className="mt-1 text-sm text-red-600">{apiError.scaleId}</p>
            )}
            {scales.length === 0 ? (
              <p className="mt-2 text-sm text-orange-600">
                Vous n'avez pas encore créé de barème. <Link href="/scales/create" className="text-blue-600 hover:underline">Créer un barème</Link>
              </p>
            ) : !formData.scaleId && (
              <p className="mt-2 text-sm text-gray-500">
                Veuillez sélectionner un barème pour cette évaluation.
              </p>
            )}
          </div>
        </div>
        
        {/* Afficher les détails du barème sélectionné */}
        {selectedScale && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Détails du barème sélectionné</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium">{selectedScale.title}</h4>
              {selectedScale.description && (
                <p className="text-sm text-gray-600 mt-1">{selectedScale.description}</p>
              )}
              
              {selectedScale.criteria && selectedScale.criteria.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left">Critère</th>
                        <th className="px-4 py-2 text-left">Compétence</th>
                        <th className="px-4 py-2 text-right">Max points</th>
                        <th className="px-4 py-2 text-right">Coefficient</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedScale.criteria.map((criteria) => (
                        <tr key={criteria.id} className="border-t border-gray-200">
                          <td className="px-4 py-2">{criteria.description}</td>
                          <td className="px-4 py-2">{criteria.associatedSkill}</td>
                          <td className="px-4 py-2 text-right">{criteria.maxPoints}</td>
                          <td className="px-4 py-2 text-right">{criteria.coefficient}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">Ce barème ne contient pas de critères.</p>
              )}
            </div>
          </div>
        )}
        
        {/* Buttons d'action */}
        <div className="flex justify-end space-x-4 pt-4">
          <Link
            href="/evaluations"
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </Link>
          
          <button
            type="submit"
            disabled={loading || students.length === 0 || scales.length === 0}
            className="bg-[#138784] text-white px-6 py-2 rounded-md hover:bg-[#0c6460] disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Création en cours...
              </>
            ) : 'Créer l\'évaluation'}
          </button>
        </div>
      </form>
    </div>
  );
}