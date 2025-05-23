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
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  UserIcon, 
  DocumentTextIcon, 
  AcademicCapIcon, 
  ChevronDownIcon, 
  CheckIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
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
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showScaleDropdown, setShowScaleDropdown] = useState(false);
  
  // Pour éviter les boucles infinies
  const [authChecked, setAuthChecked] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  // Vérifier les autorisations d'accès
  useEffect(() => {
    if (!authChecked && authUser) {
      setAuthChecked(true);
      if (authUser.role !== 'teacher' && authUser.role !== 'admin') {
        showNotification('error', 'Accès non autorisé', 'Seuls les professeurs et administrateurs peuvent créer des évaluations.');
        router.push('/dashboard');
      }
    }
  }, [authUser, router, showNotification, authChecked]);

  // Charger les données initiales
  useEffect(() => {
    if (!dataFetched && authUser && authChecked) {
      const fetchData = async () => {
        setDataLoading(true);
        setError(null);
        
        try {
          console.log('Chargement des étudiants...');
          const studentsData = await userService.getUsers();
          const filteredStudents = studentsData.filter(u => u.role === 'student' && u.status === 'active');
          setStudents(filteredStudents);
          console.log(`${filteredStudents.length} étudiants chargés`);
          
          console.log('Chargement des barèmes...');
          const scalesData = await scaleService.getScales();
          const availableScales = authUser?.role === 'admin' 
            ? scalesData 
            : scalesData.filter(s => s.creatorId === authUser?.userId || s.isShared);
            
          setScales(availableScales);
          console.log(`${availableScales.length} barèmes disponibles`);
          
        } catch (err) {
          console.error('Erreur lors du chargement des données initiales:', err);
          setError('Impossible de charger les données nécessaires. Veuillez réessayer plus tard.');
        } finally {
          setDataLoading(false);
          setDataFetched(true);
        }
      };
      
      fetchData();
    }
  }, [authUser, authChecked, dataFetched]);

  // Charger les détails du barème sélectionné
  const fetchScaleDetails = useCallback(async (scaleId: number) => {
    try {
      const found = scales.find(s => s.id === scaleId);
      if (found && found.criteria) {
        setSelectedScale(found);
        return;
      }
      
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

  // Sélection d'étudiant via dropdown
  const handleStudentSelect = (student: User) => {
    setFormData(prev => ({ ...prev, studentId: student.id.toString() }));
    setShowStudentDropdown(false);
    if (apiError.studentId) {
      setApiError(prev => {
        const newErrors = {...prev};
        delete newErrors.studentId;
        return newErrors;
      });
    }
  };

  // Sélection de barème via dropdown
  const handleScaleSelect = (scale: Scale) => {
    setFormData(prev => ({ ...prev, scaleId: scale.id.toString() }));
    setShowScaleDropdown(false);
    if (apiError.scaleId) {
      setApiError(prev => {
        const newErrors = {...prev};
        delete newErrors.scaleId;
        return newErrors;
      });
    }
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
    
    setApiError(errors);
    return Object.keys(errors).length === 0;
  };

  // Fonction de soumission de formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const evaluationData = {
        title: formData.title,
        dateEval: formData.dateEval,
        studentId: formData.studentId,
        scaleId: formData.scaleId
      };
      
      console.log('Données qui seront envoyées au serveur:', evaluationData);
      
      const studentIdNum = parseInt(formData.studentId as string, 10);
      const scaleIdNum = parseInt(formData.scaleId as string, 10);
      
      if (isNaN(studentIdNum)) {
        throw new Error("L'ID de l'étudiant n'est pas un nombre valide");
      }
      
      if (isNaN(scaleIdNum)) {
        throw new Error("L'ID du barème n'est pas un nombre valide");
      }
      
      const result = await evaluationService.createEvaluation({
        title: formData.title,
        dateEval: formData.dateEval,
        studentId: studentIdNum,
        scaleId: scaleIdNum
      });
      
      console.log('Évaluation créée avec succès:', result);
      
      showNotification('success', 'Évaluation créée', 'L\'évaluation a été créée avec succès.');
      router.push('/evaluations');
    } catch (err: any) {
      console.error('Erreur lors de la création de l\'évaluation:', err);
      
      let errorMessage = 'Impossible de créer l\'évaluation. ';
      
      if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.response?.data?.errors) {
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

  // Obtenir l'étudiant sélectionné
  const getSelectedStudent = () => {
    return students.find(s => s.id.toString() === formData.studentId);
  };

  // Obtenir le barème sélectionné
  const getSelectedScaleFromList = () => {
    return scales.find(s => s.id.toString() === formData.scaleId);
  };

  // Calculer le total des points
  const getTotalPoints = () => {
    return selectedScale?.criteria?.reduce((sum, c) => sum + c.maxPoints, 0) || 0;
  };

  // Afficher le chargement
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-4 mb-8">
            <Link href="/evaluations" className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md">
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Créer une nouvelle évaluation</h1>
              <p className="text-gray-600 mt-1">Chargement des données...</p>
            </div>
          </div>
          <div className="flex justify-center">
            <LoadingSpinner size="lg" text="Chargement des données..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              href="/evaluations"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Créer une nouvelle évaluation</h1>
              <p className="text-gray-600 mt-1">Configurez les détails de votre évaluation</p>
            </div>
          </div>
        </div>

        {/* Erreur globale */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations principales */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Informations générales</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de l'évaluation *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className={`w-full px-4 py-3 border ${apiError.title ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500`}
                  style={{ backgroundColor: '#ffffff' }}
                  placeholder="Ex: Examen de fin de module JavaScript"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={loading}
                />
                {apiError.title && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {apiError.title}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="dateEval" className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'évaluation *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="dateEval"
                    name="dateEval"
                    className={`w-full px-4 py-3 pl-12 border ${apiError.dateEval ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900`}
                    style={{ backgroundColor: '#ffffff' }}
                    value={formData.dateEval}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <CalendarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {apiError.dateEval && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {apiError.dateEval}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sélection étudiant */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Sélection de l'étudiant</h2>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Étudiant à évaluer *
              </label>
              <button
                type="button"
                onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                disabled={loading}
                className={`w-full bg-white border ${apiError.studentId ? 'border-red-300' : 'border-gray-300'} rounded-xl px-4 py-3 text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-between disabled:opacity-50`}
              >
                {getSelectedStudent() ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {getSelectedStudent()!.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{getSelectedStudent()!.name}</p>
                      <p className="text-sm text-gray-500">{getSelectedStudent()!.email}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500">Sélectionner un étudiant</span>
                )}
                <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${showStudentDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showStudentDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {students.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Aucun étudiant disponible
                    </div>
                  ) : (
                    students.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => handleStudentSelect(student)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 first:rounded-t-xl last:rounded-b-xl transition-colors duration-150"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {student.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                        {getSelectedStudent()?.id === student.id && (
                          <CheckIcon className="h-5 w-5 text-green-500" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
              
              {apiError.studentId && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {apiError.studentId}
                </p>
              )}
              
              {students.length === 0 && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700 flex items-center">
                    <InformationCircleIcon className="h-4 w-4 mr-2" />
                    Aucun étudiant disponible. Contactez l'administrateur.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sélection barème */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <AcademicCapIcon className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Barème d'évaluation</h2>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barème à utiliser *
              </label>
              <button
                type="button"
                onClick={() => setShowScaleDropdown(!showScaleDropdown)}
                disabled={loading}
                className={`w-full bg-white border ${apiError.scaleId ? 'border-red-300' : 'border-gray-300'} rounded-xl px-4 py-3 text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-between disabled:opacity-50`}
              >
                {getSelectedScaleFromList() ? (
                  <div>
                    <p className="font-medium text-gray-900">{getSelectedScaleFromList()!.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{getSelectedScaleFromList()!.description}</p>
                  </div>
                ) : (
                  <span className="text-gray-500">Sélectionner un barème</span>
                )}
                <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${showScaleDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showScaleDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {scales.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p>Aucun barème disponible</p>
                      <Link href="/scales/create" className="text-blue-600 hover:underline text-sm">
                        Créer un barème
                      </Link>
                    </div>
                  ) : (
                    scales.map((scale) => (
                      <button
                        key={scale.id}
                        type="button"
                        onClick={() => handleScaleSelect(scale)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors duration-150"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{scale.title}</p>
                            <p className="text-sm text-gray-500 mt-1">{scale.description}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {scale.criteria?.length || 0} critères • {scale.criteria?.reduce((sum, c) => sum + c.maxPoints, 0) || 0} points max
                            </p>
                          </div>
                          {getSelectedScaleFromList()?.id === scale.id && (
                            <CheckIcon className="h-5 w-5 text-green-500 ml-2" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
              
              {apiError.scaleId && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {apiError.scaleId}
                </p>
              )}
            </div>
          </div>

          {/* Aperçu du barème sélectionné */}
          {selectedScale && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu du barème sélectionné</h3>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">{selectedScale.title}</h4>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {getTotalPoints()} points total
                  </span>
                </div>
                
                {selectedScale.description && (
                  <p className="text-gray-600 mb-4">{selectedScale.description}</p>
                )}
                
                {selectedScale.criteria && selectedScale.criteria.length > 0 ? (
                  <div className="space-y-3">
                    {selectedScale.criteria.map((criteria, index) => (
                      <div key={criteria.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-medium">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900">{criteria.description}</p>
                              <p className="text-sm text-gray-600">{criteria.associatedSkill}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{criteria.maxPoints} pts</p>
                          <p className="text-sm text-gray-500">coeff. {criteria.coefficient}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Ce barème ne contient pas de critères.</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 sm:justify-end sm:space-x-4 pt-6">
            <Link
              href="/evaluations"
              className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all duration-200 text-center"
            >
              Annuler
            </Link>
            
            <button
              type="submit"
              disabled={loading || students.length === 0 || scales.length === 0}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Création en cours...</span>
                </>
              ) : (
                <span>Créer l'évaluation</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}