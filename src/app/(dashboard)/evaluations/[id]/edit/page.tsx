'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../../lib/auth';
import { useNotification } from '../../../../../contexts/NotificationContext';
import { useParams } from 'next/navigation';
import evaluationService, { Evaluation } from '../../../../../services/evaluationService';
import scaleService, { Scale } from '../../../../../services/scaleService';
import userService, { User } from '../../../../../services/userService';
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
import LoadingSpinner from '../../../../../components/ui/LoadingSpinner';

export default function EditEvaluationPage() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const { showNotification } = useNotification();
  const params = useParams();
  const evaluationId = Number(params.id);
  
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
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  
  // États de UI
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<Record<string, string>>({});
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showScaleDropdown, setShowScaleDropdown] = useState(false);

  // Charger les données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        
        // Charger l'évaluation existante
        const evalData = await evaluationService.getEvaluationById(evaluationId);
        
        // Vérifier les permissions
        if (authUser?.role !== 'teacher' && authUser?.role !== 'admin') {
          setError('Vous n\'avez pas les permissions pour modifier cette évaluation.');
          return;
        }
        
        if (evalData.teacherId !== authUser?.userId && authUser?.role !== 'admin') {
          setError('Vous ne pouvez modifier que vos propres évaluations.');
          return;
        }
        
        if (evalData.status !== 'draft') {
          setError('Seules les évaluations en brouillon peuvent être modifiées.');
          return;
        }
        
        setEvaluation(evalData);
        
        // Pré-remplir le formulaire
        setFormData({
          title: evalData.title,
          dateEval: new Date(evalData.dateEval).toISOString().split('T')[0],
          studentId: evalData.studentId.toString(),
          scaleId: evalData.scaleId.toString()
        });
        
        // Charger les données complémentaires en parallèle
        const [studentsData, scalesData] = await Promise.all([
          userService.getUsers(), // Enlever le paramètre role
          scaleService.getScales()
        ]);
        
        // Filtrer côté client pour obtenir seulement les étudiants
        const studentUsers = studentsData.filter(user => user.role === 'student');
        setStudents(studentUsers);
        setScales(scalesData);
        
        // Trouver le barème sélectionné
        const currentScale = scalesData.find(s => s.id === evalData.scaleId);
        setSelectedScale(currentScale || null);
        
      } catch (err: any) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Impossible de charger les données de l\'évaluation.');
        showNotification('error', 'Erreur de chargement', 'Impossible de charger les données de l\'évaluation.');
      } finally {
        setDataLoading(false);
      }
    };

    if (evaluationId && authUser) {
      fetchData();
    }
  }, [evaluationId, authUser, showNotification]);

  // Gestion des changements de formulaire
  const handleInputChange = (name: string, value: string) => {
    // Effacer l'erreur API si elle existe
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
    setSelectedScale(scale);
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
        title: formData.title.trim(),
        dateEval: new Date(formData.dateEval) // Convertir string en Date
      };
      
      console.log('Données de modification qui seront envoyées au serveur:', evaluationData);
      
      const result = await evaluationService.updateEvaluation(evaluationId, evaluationData);
      
      console.log('Évaluation modifiée avec succès:', result);
      
      showNotification('success', 'Évaluation modifiée', 'L\'évaluation a été modifiée avec succès.');
      router.push(`/evaluations/${evaluationId}`);
    } catch (err: any) {
      console.error('Erreur lors de la modification de l\'évaluation:', err);
      
      let errorMessage = 'Impossible de modifier l\'évaluation.';
      
      if (err.response?.status === 400) {
        if (err.response.data?.errors) {
          const serverErrors: Record<string, string> = {};
          err.response.data.errors.forEach((error: any) => {
            serverErrors[error.field] = error.message;
          });
          setApiError(serverErrors);
          errorMessage = 'Veuillez corriger les erreurs dans le formulaire.';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.response?.status === 403) {
        errorMessage = 'Vous n\'avez pas les permissions pour modifier cette évaluation.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Évaluation non trouvée.';
      }
      
      setError(errorMessage);
      showNotification('error', 'Erreur de modification', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fonctions utilitaires
  const getSelectedStudent = () => {
    return students.find(s => s.id.toString() === formData.studentId);
  };

  const getSelectedScale = () => {
    return scales.find(s => s.id.toString() === formData.scaleId);
  };

  // États de rendu
  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/evaluations" className="text-gray-600 hover:text-gray-900 transition">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Modifier l'évaluation</h1>
        </div>
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-red-700">{error}</p>
              <div className="mt-4">
                <Link href="/evaluations" className="text-sm text-blue-600 hover:text-blue-800 underline">
                  ← Retour aux évaluations
                </Link>
              </div>
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center space-x-4 mb-8">
        <Link href={`/evaluations/${evaluationId}`} className="text-gray-600 hover:text-gray-900 transition">
          <ArrowLeftIcon className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Modifier l'évaluation</h1>
          <p className="text-gray-600 mt-1">Modifiez les informations de base de votre évaluation</p>
        </div>
      </div>

      {/* Message d'information */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-6">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
          <div>
            <p className="text-sm text-blue-700">
              <strong>Note :</strong> Vous pouvez modifier le titre et la date d'évaluation. 
              L'étudiant et le barème ne peuvent pas être modifiés après la création pour préserver l'intégrité des données.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg mb-6">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <div className="w-8 h-8 bg-[#138784] text-white rounded-full flex items-center justify-center mr-3 text-sm font-bold">
              1
            </div>
            Informations générales
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Titre */}
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-semibold text-gray-800 mb-2">
                Titre de l'évaluation <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DocumentTextIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="title"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784] text-gray-800 ${
                    apiError.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Évaluation de développement web - Projet final"
                  maxLength={100}
                  required
                />
              </div>
              {apiError.title && (
                <p className="mt-1 text-sm text-red-600">{apiError.title}</p>
              )}
            </div>

            {/* Date d'évaluation */}
            <div>
              <label htmlFor="dateEval" className="block text-sm font-semibold text-gray-800 mb-2">
                Date d'évaluation <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  id="dateEval"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-[#138784] text-gray-800 ${
                    apiError.dateEval ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  value={formData.dateEval}
                  onChange={(e) => handleInputChange('dateEval', e.target.value)}
                  required
                />
              </div>
              {apiError.dateEval && (
                <p className="mt-1 text-sm text-red-600">{apiError.dateEval}</p>
              )}
            </div>
          </div>
        </div>

        {/* Informations non modifiables */}
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-600 mb-6 flex items-center">
            <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center mr-3 text-sm font-bold">
              2
            </div>
            Informations non modifiables
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Étudiant (lecture seule) */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Étudiant assigné
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <div className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed">
                  {evaluation.student?.name || 'Étudiant non trouvé'}
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                L'étudiant ne peut pas être modifié après la création
              </p>
            </div>

            {/* Barème (lecture seule) */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Barème d'évaluation
              </label>
              <div className="relative">
                <AcademicCapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <div className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed">
                  {evaluation.scale?.title || 'Barème non trouvé'}
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Le barème ne peut pas être modifié après la création
              </p>
            </div>
          </div>

          {/* Informations sur le barème */}
          {evaluation.scale && (
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">Aperçu du barème</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>{evaluation.scale.criteria?.length || 0}</strong> critères d'évaluation</p>
                {evaluation.scale.description && (
                  <p className="text-xs">{evaluation.scale.description}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4">
          <Link
            href={`/evaluations/${evaluationId}`}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#138784] text-white rounded-lg hover:bg-[#0c6460] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Modification en cours...
              </>
            ) : (
              'Modifier l\'évaluation'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}