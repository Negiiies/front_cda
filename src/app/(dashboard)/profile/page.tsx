// src/app/(dashboard)/profile/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '../../../lib/auth';
import userService from '../../../services/userService';
import { CheckCircleIcon, LockClosedIcon, AtSymbolIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // États pour le changement de mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authUser) {
      setError('Vous devez être connecté pour changer votre mot de passe');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    setUpdating(true);
    setError(null);
    setSuccess(null);
    
    try {
      await userService.changePassword(authUser.userId, {
        currentPassword,
        newPassword
      });
      
      setSuccess('Votre mot de passe a été mis à jour avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Erreur lors du changement de mot de passe:', err);
      
      if (err.response?.status === 401) {
        setError('Le mot de passe actuel est incorrect');
      } else {
        setError('Une erreur est survenue lors du changement de mot de passe');
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mon profil</h1>
      
      {/* Carte d'information utilisateur */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-6">
          <div className="h-16 w-16 rounded-full bg-[#138784] flex items-center justify-center text-white text-xl font-bold">
            {authUser?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-semibold">{authUser?.name || 'Utilisateur'}</h2>
            <p className="text-sm text-gray-600">{authUser?.role === 'student' ? 'Étudiant' : 
                                                 authUser?.role === 'teacher' ? 'Professeur' : 'Administrateur'}</p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4 mt-2">
          <div className="flex items-center text-gray-700 mb-2">
            <AtSymbolIcon className="h-5 w-5 mr-2 text-[#138784]" />
            <span className="font-medium">Email:</span>
            <span className="ml-2">{authUser?.email}</span>
          </div>
        </div>
      </div>
      
      {/* Formulaire de changement de mot de passe */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <LockClosedIcon className="h-6 w-6 text-[#138784] mr-2" />
          <h2 className="text-xl font-semibold">Changer mon mot de passe</h2>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}
        
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe actuel
            </label>
            <input
              type="password"
              id="currentPassword"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              id="newPassword"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Au moins 8 caractères, une majuscule, un chiffre et un caractère spécial
            </p>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#138784] focus:border-[#138784]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={updating}
              className="bg-[#138784] text-white px-6 py-2 rounded-md hover:bg-[#0c6460] disabled:opacity-50 transition-colors"
            >
              {updating ? 'Mise à jour...' : 'Changer le mot de passe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}