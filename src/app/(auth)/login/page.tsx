// src/app/(auth)/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isLoading, user, error, setError } = useAuth();
  const router = useRouter();

  // Si l'utilisateur est déjà connecté, rediriger vers le dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Nettoyer les erreurs du contexte au chargement de la page
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [error, setError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!email.trim()) {
      setFormError('L\'email est requis');
      return;
    }
    
    if (!password) {
      setFormError('Le mot de passe est requis');
      return;
    }
    
    setFormError('');
    setIsSubmitting(true);
    
    try {
      await login(email, password);
      // Si login réussit, la redirection est gérée par le contexte d'authentification
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Message d'erreur détaillé
      if (err?.response?.status === 429) {
        setFormError('Trop de tentatives de connexion. Veuillez réessayer plus tard.');
      } else if (err?.response?.status === 401) {
        setFormError('Email ou mot de passe incorrect.');
      } else if (err?.response?.status === 403) {
        setFormError('Votre compte est désactivé. Contactez l\'administrateur.');
      } else {
        setFormError(err?.response?.data?.message || 'Une erreur est survenue lors de la connexion.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si le chargement initial est en cours
  if (isLoading && !isSubmitting) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#138784]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Section gauche - Couleur de l'école 89 avec illustration */}
      <div className="hidden md:flex md:w-5/12 bg-[#138784] flex-col p-10 relative text-white">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">89 Progress</h1>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">
            Découvrez la plateforme d'évaluation pour l'École 89.
          </h2>
        </div>
        
        {/* Illustration au centre */}
        <div className="flex-grow flex items-center justify-center">
          <div className="relative w-80 h-80">
            {/* Vérifier si l'image existe, sinon utiliser une div */}
            <Image 
              src="/images/geek.svg" 
              alt="Illustration" 
              fill
              style={{ objectFit: 'contain' }}
              onError={(e) => {
                // En cas d'erreur de chargement de l'image
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
        
        {/* Crédits en bas */}
        <div className="text-sm">
          École 89 - Tous droits réservés
        </div>
      </div>

      {/* Section droite - Formulaire de connexion */}
      <div className="w-full md:w-7/12 flex items-center justify-center p-8 bg-[#f0f2f5]">
        <div className="w-full max-w-md">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[#138784]">Se connecter à 89 Progress</h2>
          </div>
          
          {/* Message d'erreur */}
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {formError}
            </div>
          )}
          
          {/* Formulaire */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-[#138784] focus:border-[#138784]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <a href="#" className="text-sm text-[#138784] hover:text-[#0a6c6a]">
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-[#138784] focus:border-[#138784]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#138784] hover:bg-[#0c6460] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#138784] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connexion en cours...
                  </>
                ) : 'Se connecter'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            Seule l'équipe pédagogique peut créer des comptes.
          </div>
        </div>
      </div>
    </div>
  );
}