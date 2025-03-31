// src/app/(dashboard)/evaluations/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/auth';
import evaluationService from '../../../../services/evaluationService';
import scaleService, { Scale, Criteria } from '../../../../services/scaleService';
import userService, { User } from '../../../../services/userService';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Types pour les données de secours
interface FallbackStudent {
  id: number;
  name: string;
  email: string;
  role: 'student';
  status: 'active' | 'inactive';
}

interface FallbackCriteria {
  id: number;
  description: string;
  associatedSkill: string;
  maxPoints: number;
  coefficient: number;
}

interface FallbackScale {
  id: number;
  title: string;
  description?: string;
  criteria: FallbackCriteria[];
}

export default function CreateEvaluationPage() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [dateEval, setDateEval] = useState('');
  const [studentId, setStudentId] = useState<number | ''>('');
  const [scaleId, setScaleId] = useState<number | ''>('');
  
  const [students, setStudents] = useState<User[] | FallbackStudent[]>([]);
  const [scales, setScales] = useState<Scale[] | FallbackScale[]>([]);
  const [selectedScale, setSelectedScale] = useState<Scale | FallbackScale | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingScales, setLoadingScales] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  useEffect(() => {
    // Rediriger si l'utilisateur n'est pas un professeur
    if (authUser && authUser.role !== 'teacher' && authUser.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    // Utiliser des données simulées si aucune donnée réelle n'est chargée
    const fallbackStudents: FallbackStudent[] = [
      { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'student', status: 'active' },
      { id: 2, name: 'Bob Wilson', email: 'bob@example.com', role: 'student', status: 'active' },
      { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'student', status: 'active' },
    ];

    const fallbackScales: FallbackScale[] = [
      { 
        id: 1, 
        title: 'Évaluation de développement web', 
        description: 'Barème pour les projets web frontend', 
        criteria: [
          { id: 1, description: 'Qualité du code', associatedSkill: 'Développement', maxPoints: 20, coefficient: 0.3 },
          { id: 2, description: 'Design et UX', associatedSkill: 'Interface', maxPoints: 15, coefficient: 0.3 },
          { id: 3, description: 'Fonctionnalités', associatedSkill: 'Technique', maxPoints: 25, coefficient: 0.4 }
        ]
      },
      { 
        id: 2, 
        title: 'Évaluation de conception', 
        description: 'Barème pour les projets de design', 
        criteria: [
          { id: 4, description: 'Créativité', associatedSkill: 'Conception', maxPoints: 30, coefficient: 0.5 },
          { id: 5, description: 'Technique', associatedSkill: 'Outils', maxPoints: 20, coefficient: 0.5 }
        ]
      }
    ];

    const fetchData = async () => {
      if (fetchAttempted) return;
      setFetchAttempted(true);
      
      // Charger les étudiants
      setLoadingStudents(true);
      try {
        const studentsData = await userService.getUsers();
        // Filtrer seulement les étudiants actifs
        const filteredStudents = studentsData.filter(u => u.role === 'student' && u.status === 'active');
        setStudents(filteredStudents);
      } catch (err) {
        console.error('Erreur lors du chargement des étudiants:', err);
        // Utiliser des données de secours en cas d'échec
        setStudents(fallbackStudents);
      } finally {
        setLoadingStudents(false);
      }
      
      // Charger les barèmes
      setLoadingScales(true);
      try {
        const scalesData = await scaleService.getScales();
        // Filtrer les barèmes disponibles pour ce professeur
        const availableScales = authUser?.role === 'admin' 
          ? scalesData 
          : scalesData.filter((s: Scale) => s.creatorId === authUser?.userId || s.isShared);
          
        setScales(availableScales);
      } catch (err) {
        console.error('Erreur lors du chargement des barèmes:', err);
        // Utiliser des données de secours en cas d'échec
        setScales(fallbackScales);
      } finally {
        setLoadingScales(false);
      }
      
      setDataLoading(false);
    };
    
    fetchData();
  }, [authUser, router, fetchAttempted]);

  // Charger les détails du barème sélectionné
  useEffect(() => {
    if (!scaleId) {
      setSelectedScale(null);
      return;
    }
    
    const fetchScaleDetails = async () => {
      const selected = scales.find(s => s.id === Number(scaleId));
      if (selected) {
        setSelectedScale(selected);
        return;
      }
      
      try {
        const scaleData = await scaleService.getScaleById(Number(scaleId));
        setSelectedScale(scaleData);
      } catch (err) {
        console.error('Erreur lors du chargement des détails du barème:', err);
        setError('Impossible de charger les détails du barème sélectionné.');
      }
    };
    
    fetchScaleDetails();
  }, [scaleId, scales]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !dateEval || !studentId || !scaleId) {
      setError('Tous les champs sont obligatoires.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const evaluationData = {
        title,
        dateEval: new Date(dateEval),
        studentId: Number(studentId),
        scaleId: Number(scaleId)
      };
      
      await evaluationService.createEvaluation(evaluationData);
      router.push('/evaluations');
    } catch (err) {
      console.error('Erreur lors de la création de l\'évaluation:', err);
      setError('Impossible de créer l\'évaluation. Veuillez vérifier vos données.');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading || loadingStudents || loadingScales) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-6">
          <Link href="/evaluations" className="text-gray-600 hover:text-gray-900">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Créer une nouvelle évaluation</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#138784]"></div>
        </div>
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
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Titre de l'évaluation *
            </label>
            <input
              type="text"
              id="title"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="dateEval" className="block text-sm font-medium text-gray-700 mb-1">
              Date d'évaluation *
            </label>
            <input
              type="date"
              id="dateEval"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
              value={dateEval}
              onChange={(e) => setDateEval(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
              Étudiant *
            </label>
            <select
              id="studentId"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
              value={studentId}
              onChange={(e) => setStudentId(Number(e.target.value))}
              required
            >
              <option value="">Sélectionner un étudiant</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
            {students.length === 0 && (
              <p className="mt-2 text-sm text-orange-600">
                Aucun étudiant disponible. Veuillez contacter l'administrateur.
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="scaleId" className="block text-sm font-medium text-gray-700 mb-1">
              Barème *
            </label>
            <select
              id="scaleId"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
              value={scaleId}
              onChange={(e) => setScaleId(Number(e.target.value))}
              required
            >
              <option value="">Sélectionner un barème</option>
              {scales.map((scale) => (
                <option key={scale.id} value={scale.id}>
                  {scale.title}
                </option>
              ))}
            </select>
            {scales.length === 0 ? (
              <p className="mt-2 text-sm text-orange-600">
                Vous n'avez pas encore créé de barème. <Link href="/scales/create" className="text-blue-600 hover:underline">Créer un barème</Link>
              </p>
            ) : scaleId === '' && (
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
                      {selectedScale.criteria.map((criteria: Criteria | FallbackCriteria) => (
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
        
        <div className="flex justify-end space-x-4 pt-4">
          <Link
            href="/evaluations"
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </Link>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-[#138784] text-white px-6 py-2 rounded-md hover:bg-[#0c6460] disabled:opacity-50"
          >
            {loading ? 'Création en cours...' : 'Créer l\'évaluation'}
          </button>
        </div>
      </form>
    </div>
  );
}