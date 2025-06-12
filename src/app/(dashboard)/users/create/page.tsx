// src/app/(dashboard)/users/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import userService from '../../../../services/userService';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon,
  UserCircleIcon,
  AcademicCapIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function CreateUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Vérifier la force du mot de passe en temps réel
    if (name === 'password') {
      setPasswordStrength({
        hasMinLength: value.length >= 8,
        hasUppercase: /[A-Z]/.test(value),
        hasNumber: /[0-9]/.test(value),
        hasSpecialChar: /[^A-Za-z0-9]/.test(value)
      });
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Le nom est requis');
      return false;
    }
    if (!formData.email.trim()) {
      setError('L\'email est requis');
      return false;
    }
    if (!formData.password) {
      setError('Le mot de passe est requis');
      return false;
    }
    if (!Object.values(passwordStrength).every(Boolean)) {
      setError('Le mot de passe ne respecte pas tous les critères de sécurité');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role as 'student' | 'teacher' | 'admin',
        description: formData.description
      };
      
      await userService.createUser(userData);
      router.push('/users');
    } catch (err: any) {
      console.error('Erreur lors de la création de l\'utilisateur', err);
      setError(err?.response?.data?.message || 'Impossible de créer l\'utilisateur. Veuillez vérifier vos données.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheckIcon className="h-6 w-6" />;
      case 'teacher':
        return <AcademicCapIcon className="h-6 w-6" />;
      default:
        return <UserCircleIcon className="h-6 w-6" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'teacher':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const passwordIsValid = Object.values(passwordStrength).every(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête avec navigation */}
        <div className="mb-8">
          <Link 
            href="/users" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Retour aux utilisateurs
          </Link>
          
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Créer un nouvel utilisateur</h1>
            <p className="text-gray-600 mt-2">Ajoutez un nouveau membre à votre équipe pédagogique</p>
          </div>
        </div>

        {/* Formulaire principal */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* En-tête du formulaire */}
          <div className="bg-gradient-to-r from-[#138784] to-[#0c6460] px-8 py-6">
            <div className="flex items-center">
              <div className="bg-white/20 p-3 rounded-xl">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-white">Informations utilisateur</h2>
                <p className="text-white/80 text-sm">Complétez tous les champs requis</p>
              </div>
            </div>
          </div>

          {/* Contenu du formulaire */}
          <form onSubmit={handleSubmit} className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                <div className="flex items-center">
                  <XMarkIcon className="h-5 w-5 text-red-400 mr-3" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {/* Informations personnelles */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-gray-500" />
                  Informations personnelles
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nom complet *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="Ex: Jean Dupont"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Adresse email *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="jean.dupont@school.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sécurité */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <LockClosedIcon className="h-5 w-5 mr-2 text-gray-500" />
                  Sécurité du compte
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Mot de passe *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    
                    {/* Indicateur de force du mot de passe */}
                    {formData.password && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center space-x-2 text-xs">
                          {Object.entries({
                            hasMinLength: '8 caractères minimum',
                            hasUppercase: 'Une majuscule',
                            hasNumber: 'Un chiffre',
                            hasSpecialChar: 'Un caractère spécial'
                          }).map(([key, label]) => (
                            <div key={key} className={`flex items-center px-2 py-1 rounded-full ${
                              passwordStrength[key as keyof typeof passwordStrength] 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {passwordStrength[key as keyof typeof passwordStrength] ? (
                                <CheckIcon className="h-3 w-3 mr-1" />
                              ) : (
                                <XMarkIcon className="h-3 w-3 mr-1" />
                              )}
                              <span>{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirmer le mot de passe *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 ${
                          formData.confirmPassword && formData.password !== formData.confirmPassword
                            ? 'border-red-300 bg-red-50'
                            : formData.confirmPassword && formData.password === formData.confirmPassword
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-300'
                        }`}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    
                    {formData.confirmPassword && (
                      <div className={`flex items-center text-xs mt-1 ${
                        formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formData.password === formData.confirmPassword ? (
                          <>
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Les mots de passe correspondent
                          </>
                        ) : (
                          <>
                            <XMarkIcon className="h-3 w-3 mr-1" />
                            Les mots de passe ne correspondent pas
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rôle et permissions */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 mr-2 text-gray-500" />
                  Rôle et permissions
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: 'student', label: 'Étudiant', description: 'Consulte ses évaluations' },
                    { value: 'teacher', label: 'Professeur', description: 'Crée et gère les évaluations' },
                    { value: 'admin', label: 'Administrateur', description: 'Accès complet au système' }
                  ].map((role) => (
                    <label key={role.value} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                        formData.role === role.value
                          ? `${getRoleColor(role.value)} border-current`
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}>
                        <div className="flex items-center mb-2">
                          <div className={`${formData.role === role.value ? 'text-current' : 'text-gray-400'}`}>
                            {getRoleIcon(role.value)}
                          </div>
                          <span className="ml-2 font-medium">{role.label}</span>
                        </div>
                        <p className="text-sm text-gray-600">{role.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#138784] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Ajoutez une description pour cet utilisateur..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200 mt-8">
              <Link
                href="/users"
                className="flex-1 sm:flex-none px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 text-center"
              >
                Annuler
              </Link>
              
              <button
                type="submit"
                disabled={loading || !passwordIsValid || formData.password !== formData.confirmPassword}
                className="flex-1 bg-gradient-to-r from-[#138784] to-[#0c6460] text-white px-6 py-3 rounded-xl font-medium hover:from-[#0c6460] hover:to-[#0a5653] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Création en cours...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Créer l'utilisateur
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}